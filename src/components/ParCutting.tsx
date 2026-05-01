import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Save, 
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  TrendingDown,
  History
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const ParCutting: React.FC = () => {
  const { items, categories, addLog, logs, recipes } = useInventory();
  const [date, setDate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  
  const [mode, setMode] = useState<'count' | 'delivery'>('count');
  const [activeTab, setActiveTab] = useState<'entry' | 'usage' | 'sales'>('entry');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedDateStr = format(date, 'yyyy-MM-dd');

  // Load existing counts for the selected date if they exist in logs
  useEffect(() => {
    const existingLogs = logs.filter(l => l.date === selectedDateStr);
    const initialCounts: Record<string, number> = {};
    existingLogs.forEach(log => {
      if ((mode === 'count' && (log.type === 'count' || log.type === 'sales')) || 
          (mode === 'delivery' && log.type === 'delivery')) {
        initialCounts[log.itemId] = log.quantity;
      }
    });
    setCounts(initialCounts);
  }, [selectedDateStr, mode, logs]);

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || 'Other';
  };

  const filteredItems = items.filter(item => {
    const itemCategoryName = categories.find(c => c.id === item.categoryId)?.name.toLowerCase() || '';
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          itemCategoryName.includes(search.toLowerCase());
    return matchesSearch;
  });

  const filteredSelectorItems = items.filter(item => 
    item.name.toLowerCase().includes(selectorSearch.toLowerCase())
  );

  // Calculate usage and sales items including recipe deductions formulas
  const salesItemsReport = useMemo(() => {
    return items
      .filter(i => i.isGlass)
      .map(item => ({
        ...item,
        sold: counts[item.id] || 0
      }))
      .filter(i => i.sold > 0);
  }, [items, counts]);

  const usageItemsReport = useMemo(() => {
    // 1. Get raw counts (physical stock reconciliation)
    const report = items
      .filter(i => !i.isGlass)
      .map(item => {
        const closing = counts[item.id] !== undefined ? counts[item.id] : item.currentStock;
        const opening = item.currentStock;
        
        // 2. Calculate Theoretical Usage from Sales
        let theoreticalUsage = 0;
        
        // Check recipes
        salesItemsReport.forEach(sale => {
          const recipe = recipes.find(r => r.name.toLowerCase() === sale.name.toLowerCase());
          if (recipe) {
            const ingredient = recipe.ingredients.find(ing => ing.itemId === item.id);
            if (ingredient) {
              theoreticalUsage += (ingredient.amount * sale.sold);
            }
          }
        });

        // Check Direct glass-bottle links (oz -> ml conversion)
        salesItemsReport.forEach(sale => {
          const isLinked = sale.targetBottleId === item.id || 
                           sale.name.toLowerCase().startsWith(item.name.toLowerCase());
          if (isLinked && !recipes.some(r => r.name.toLowerCase() === sale.name.toLowerCase())) {
            // Standard conversion: sale.sold is in 'oz' or 'units', bottle is in 'ml'
            // We assume 1 unit of sale corresponds to some oz amount. 
            // If the sale item unit is 'oz', then quantity is oz.
            const conversionFactor = 29.57; // 1 oz = 29.57 ml
            theoreticalUsage += (sale.sold * conversionFactor);
          }
        });

        const physicalVariance = (opening - theoreticalUsage) - closing;

        return {
          ...item,
          opening,
          closing,
          theoreticalUsage,
          physicalVariance,
          totalUsage: opening - closing
        };
      })
      .filter(i => i.totalUsage > 0 || i.theoreticalUsage > 0 || counts[i.id] !== undefined);
      
    return report;
  }, [items, counts, salesItemsReport, recipes]);

  const handleSaveAll = async () => {
    const logEntries = Object.entries(counts).filter(([_, qty]) => qty !== undefined && qty > 0);
    if (logEntries.length === 0) {
      toast.error("No entries found");
      return;
    }

    setIsSaving(true);
    try {
      for (const [itemId, quantity] of logEntries) {
        const item = items.find(i => i.id === itemId);
        const isGlass = item?.isGlass || item?.name.toLowerCase().includes('(glass)');
        
        const logType = mode === 'count' 
          ? (isGlass ? 'sales' : 'count') 
          : 'delivery';

        await addLog({
          itemId,
          quantity,
          date: selectedDateStr,
          type: logType,
          notes: mode === 'count' 
            ? (isGlass ? `Daily Sales (${selectedDateStr})` : `Inventory Count (${selectedDateStr})`)
            : `Delivery Received (${selectedDateStr})`
        });
      }
      toast.success(`Recorded ${logEntries.length} ${mode} entries for ${selectedDateStr}`);
    } catch (e) {
      toast.error("Failed to save records");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountChange = (itemId: string, value: string) => {
    const num = parseFloat(value);
    setCounts(prev => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Par Cutting</h1>
          <p className="text-slate-500 font-medium tracking-tight">Data Entry for {format(date, 'PPP')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl h-11">
            <button 
              onClick={() => setMode('count')}
              className={cn(
                "px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                mode === 'count' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Par Cut (Night)
            </button>
            <button 
              onClick={() => setMode('delivery')}
              className={cn(
                "px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                mode === 'delivery' ? "bg-green-600 text-white shadow-lg shadow-green-900/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Receiving (Day)
            </button>
          </div>
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" className={cn("rounded-xl h-11 border-border bg-card justify-start font-bold px-4 min-w-[200px] text-foreground hover:bg-secondary shadow-sm")}>
                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className="bg-card text-foreground"
              />
            </PopoverContent>
          </Popover>
          <Button 
            className={cn(
              "rounded-xl h-11 px-6 shadow-lg gap-2 font-bold transition-all",
              mode === 'count' ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20" : "bg-green-600 hover:bg-green-500 shadow-green-900/20"
            )}
            onClick={handleSaveAll}
            disabled={isSaving || Object.keys(counts).length === 0}
          >
            {isSaving ? <TrendingDown size={18} className="animate-pulse" /> : <CheckCircle2 size={18} />}
            {isSaving ? 'Processing...' : (mode === 'count' ? 'Finalize Night Cut' : 'Confirm Delivery')}
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <History size={120} />
        </div>

        {mode === 'count' && (
          <div className="flex border-b border-slate-800 -mx-6 px-6 mb-6">
            <button 
              onClick={() => setActiveTab('entry')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                activeTab === 'entry' ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Entry Mode
              {activeTab === 'entry' && <motion.div layoutId="activeTabMode" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('usage')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                activeTab === 'usage' ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Usage Summary
              {activeTab === 'usage' && <motion.div layoutId="activeTabMode" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('sales')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                activeTab === 'sales' ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Sales Report
              {activeTab === 'sales' && <motion.div layoutId="activeTabMode" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />}
            </button>
          </div>
        )}

        {activeTab === 'entry' ? (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                <button 
                  onClick={() => setSelectorOpen(!isSelectorOpen)}
                  className="w-full pl-12 h-14 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center text-slate-400 transition-all font-bold text-left shadow-inner"
                >
                  {search || "Search inventory item..."}
                </button>

                {isSelectorOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSelectorOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[400px]">
                      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                        <Input 
                          autoFocus
                          placeholder="Filter items..."
                          value={selectorSearch}
                          onChange={e => setSelectorSearch(e.target.value)}
                          className="h-12 bg-slate-950 border-slate-800 rounded-xl font-bold"
                        />
                      </div>
                      <div className="overflow-y-auto p-2 custom-scrollbar">
                        {filteredSelectorItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSearch(item.name);
                              setSelectorOpen(false);
                              setSelectorSearch('');
                            }}
                            className="w-full text-left px-4 py-3 rounded-xl text-xs transition-all hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between group"
                          >
                            <span className="font-bold">{item.name}</span>
                            <span className="text-[9px] text-slate-600 font-black uppercase group-hover:text-blue-400">{getCategoryName(item.categoryId)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSearch('')}
                className="h-14 px-6 rounded-2xl border-slate-800 bg-slate-950 text-slate-500 font-bold"
              >
                Clear
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/40 border-b border-slate-800">
                  <tr>
                    <th className="text-left p-4 font-bold text-[9px] uppercase tracking-[0.2em] text-slate-500">Inventory Item</th>
                    <th className="text-center p-4 font-bold text-[9px] uppercase tracking-[0.2em] text-slate-500 hidden sm:table-cell">Basis</th>
                    <th className="text-center p-4 font-bold text-[9px] uppercase tracking-[0.2em] text-slate-500">Par</th>
                    <th className="text-center p-4 font-bold text-[9px] uppercase tracking-[0.2em] text-slate-500">On Hand</th>
                    <th className="text-right p-4 font-bold text-[9px] uppercase tracking-[0.2em] text-slate-500 w-[160px]">
                      {mode === 'count' ? 'Night Count' : 'Qty Received'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "font-bold",
                            item.isGlass ? "text-blue-400" : "text-slate-200"
                          )}>{item.name}</div>
                          {item.isGlass && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[7px] font-black uppercase text-blue-500 border border-blue-500/20">SOP</span>
                          )}
                        </div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-700 sm:hidden">{item.unit}</div>
                      </td>
                      <td className="p-4 text-center text-slate-600 hidden sm:table-cell font-mono text-[10px] font-bold">{item.unit}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-500 text-xs">{item.parLevel}</td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                          item.currentStock < item.parLevel 
                          ? "bg-red-500/10 text-red-500 border-red-500/20" 
                          : "bg-slate-950 text-slate-400 border-slate-800"
                        )}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Input 
                          type="number"
                          className="h-11 text-right font-mono font-bold text-blue-500 focus-visible:ring-blue-500/30 rounded-xl bg-slate-950 border-slate-800 group-hover:border-slate-600 shadow-inner"
                          placeholder={counts[item.id] !== undefined ? '' : item.currentStock.toString()}
                          value={counts[item.id] === undefined ? '' : counts[item.id]}
                          onChange={(e) => handleCountChange(item.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-700 font-bold uppercase tracking-widest text-[10px]">No items matching search</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : activeTab === 'usage' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Usage Analysis (Selected Day)</h2>
              <CardDescription>Real-time calculation based on counts</CardDescription>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
              <table className="w-full text-[11px] sm:text-sm">
                <thead className="bg-slate-800/40 border-b border-slate-800">
                  <tr>
                    <th className="text-left p-3 font-bold text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Item</th>
                    <th className="text-right p-3 font-bold text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Opening (A)</th>
                    <th className="text-right p-3 font-bold text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Formula (B)</th>
                    <th className="text-right p-3 font-bold text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Closing (C)</th>
                    <th className="text-right p-3 font-bold text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Usage (A-C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {usageItemsReport.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-bold text-slate-200">
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          <span className="text-[8px] text-slate-600 font-bold uppercase">{item.unit}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">{item.opening.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono text-blue-400">-{item.theoreticalUsage.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{item.closing.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono font-bold text-red-500">
                        {item.totalUsage.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  {usageItemsReport.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center text-slate-700 font-bold uppercase tracking-widest text-[10px]">No usage detected for this date</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Sales Dashboard (Selected Day)</h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/40 border-b border-slate-800">
                  <tr>
                    <th className="text-left p-4 font-bold text-[9px] uppercase tracking-widest text-slate-500">Service SOP Item</th>
                    <th className="text-right p-4 font-bold text-[9px] uppercase tracking-widest text-slate-500">Quantity Sold</th>
                    <th className="text-right p-4 font-bold text-[9px] uppercase tracking-widest text-slate-500 w-[120px]">Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {salesItemsReport.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                        <div className="font-bold text-slate-200">{item.name}</div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-blue-400 text-lg">{item.sold}</td>
                      <td className="p-4 text-right text-[10px] text-slate-600 font-black uppercase">{item.unit}</td>
                    </tr>
                  ))}
                  {salesItemsReport.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-20 text-center text-slate-700 font-bold uppercase tracking-widest text-[10px]">No sales recorded for this date</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
