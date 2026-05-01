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

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';

export const ParCutting: React.FC = () => {
  const { items, categories, addLog, updateLog, logs, recipes, addItem } = useInventory();
  const [date, setDate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  
  const [mode, setMode] = useState<'count' | 'delivery'>('count');
  const [activeTab, setActiveTab] = useState<'entry' | 'usage' | 'sales'>('entry');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // For new item dialog
  const [isAddOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', categoryId: '', unit: 'bottle', parLevel: 0, currentStock: 0, isGlass: false, mlSize: 750 });
  const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemCategoryName = categories.find(c => c.id === item.categoryId)?.name.toLowerCase() || '';
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            itemCategoryName.includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Filter by mode
      if (mode === 'count') {
        // Show BOTH bottles and glass items for the daily count/sales entry
        return true; 
      }
      if (mode === 'delivery') {
        // Usually only bottles are received
        return !item.isGlass;
      }
      return true;
    });
  }, [items, categories, search, mode]);

  const filteredSelectorItems = items.filter(item => 
    item.name.toLowerCase().includes(selectorSearch.toLowerCase())
  );

  // Calculate usage and sales items including recipe deductions formulas
  const salesItemsReport = useMemo(() => {
    return items
      .map(item => ({
        ...item,
        sold: counts[item.id] || 0
      }))
      .filter(i => i.sold > 0);
  }, [items, counts]);

  const receivingSummary = useMemo(() => {
    return items
      .map(item => {
        const itemLogs = logs.filter(l => l.itemId === item.id && l.date === selectedDateStr && l.type === 'delivery');
        const qty = itemLogs.reduce((sum, l) => sum + l.quantity, 0);
        return { item, qty };
      })
      .filter(entry => entry.qty > 0);
  }, [items, logs, selectedDateStr]);

  const usageItemsReport = useMemo(() => {
    // 1. Combine current counts with saved logs for this date
    const dailyLogs = logs.filter(l => l.date === selectedDateStr);
    const savedGlassSales = dailyLogs.filter(l => {
      const item = items.find(i => i.id === l.itemId);
      return item?.isGlass === true && (l.type === 'sales' || (l.type === 'usage' && l.notes?.includes('Sale')));
    });

    return items
      .filter(i => !i.isGlass)
      .map(item => {
        // Net change for the selected date
        const todayLogs = logs.filter(l => l.itemId === item.id && l.date === selectedDateStr);
        const deliveriesToday = todayLogs.filter(l => l.type === 'delivery').reduce((sum, l) => sum + l.quantity, 0);
        const recordedUsageToday = todayLogs.filter(l => l.type === 'usage' || l.type === 'sales').reduce((sum, l) => sum + l.quantity, 0);
        
        // Net change AFTER the selected date (to work back to the opening of selected date)
        const logsAfterToday = logs.filter(l => l.itemId === item.id && l.date > selectedDateStr);
        const netChangeAfter = logsAfterToday.reduce((sum, l) => {
          if (l.type === 'delivery') return sum + l.quantity;
          if (l.type === 'usage' || l.type === 'sales') return sum - l.quantity;
          // Count logs are tricky - if a count happened after selectedDate, 
          // the currentStock is effectively disconnected from the chain unless we work backwards.
          // For simplicity in this inventory model, we assume the latest stock is the anchor.
          return sum;
        }, 0);

        // Opening(SelectedDate) = CurrentStock - ChangeAfterToday - ChangeToday
        // ChangeToday (net) = deliveriesToday - recordedUsageToday
        const netChangeToday = deliveriesToday - recordedUsageToday;
        const opening = (item.currentStock || 0) - netChangeAfter - netChangeToday;
        
        const closing = counts[item.id] !== undefined ? counts[item.id] : (opening + netChangeToday);

        let theoreticalUsage = 0;
        
        // Calculate Theoretical from both active state AND saved logs
        // This ensures the summary updates as you type AND after you save
        
        // 1. Theoretical from unsaved counts (for glass items)
        items.filter(i => i.isGlass).forEach(glassItem => {
          const sold = counts[glassItem.id] || 0;
          if (sold <= 0) return;

          const isLinked = glassItem.targetBottleId === item.id || 
                           glassItem.name.toLowerCase().replace(' (glass)', '').trim() === item.name.toLowerCase().trim();
          
          if (isLinked) {
            const recipe = recipes.find(r => r.name.toLowerCase() === glassItem.name.toLowerCase());
            if (recipe) {
              const ingredient = recipe.ingredients.find(ing => ing.itemId === item.id);
              if (ingredient) theoreticalUsage += (ingredient.amount * sold);
            } else {
              const conversionFactor = 29.57; 
              theoreticalUsage += (sold * conversionFactor);
            }
          }
        });

        // 2. Theoretical from saved sales logs (if they aren't already covered by counts)
        const savedGlassSales = logs.filter(l => {
          if (l.date !== selectedDateStr) return false;
          if (l.type !== 'sales' && !(l.type === 'usage' && l.notes?.includes('Sale'))) return false;
          const item = items.find(i => i.id === l.itemId);
          return item?.isGlass === true;
        });

        savedGlassSales.forEach(log => {
          // Only add if not already in counts (to avoid doubling up during entry)
          if (counts[log.itemId] !== undefined) return;

          const glassItem = items.find(i => i.id === log.itemId);
          if (!glassItem) return;

          const isLinked = glassItem.targetBottleId === item.id || 
                           glassItem.name.toLowerCase().replace(' (glass)', '').trim() === item.name.toLowerCase().trim();
          
          if (isLinked) {
            const recipe = recipes.find(r => r.name.toLowerCase() === glassItem.name.toLowerCase());
            if (recipe) {
              const ingredient = recipe.ingredients.find(ing => ing.itemId === item.id);
              if (ingredient) theoreticalUsage += (ingredient.amount * log.quantity);
            } else {
              const conversionFactor = 29.57;
              theoreticalUsage += (log.quantity * conversionFactor);
            }
          }
        });

        const totalUsage = (opening + deliveriesToday) - closing;
        const variance = theoreticalUsage - totalUsage;

        return {
          ...item,
          opening,
          closing,
          theoreticalUsage,
          totalUsage,
          deliveriesToday,
          variance
        };
      })
      .filter(i => 
        i.totalUsage !== 0 || 
        i.theoreticalUsage > 0 || 
        counts[i.id] !== undefined || 
        logs.some(l => l.itemId === i.id && l.date === selectedDateStr)
      );
  }, [items, counts, recipes, logs, selectedDateStr]);

  const handleSaveAll = async () => {
    const logEntries = Object.entries(counts).filter(([_, qty]) => qty !== undefined);
    if (logEntries.length === 0) {
      toast.error("No entries found");
      return;
    }

    setIsSaving(true);
    try {
      let savedCount = 0;
      for (const [itemId, quantity] of logEntries) {
        const item = items.find(i => i.id === itemId);
        const isGlass = item?.isGlass || item?.name.toLowerCase().includes('(glass)');
        
        const logType = mode === 'count' 
          ? (isGlass ? 'sales' : 'count') 
          : 'delivery';

        // Check for existing log to prevent duplicates
        const existingLog = logs.find(l => 
          l.itemId === itemId && 
          l.date === selectedDateStr && 
          l.type === logType &&
          !l.notes?.includes('Recursive') // Don't manually touch recursive deductions here
        );

        if (existingLog) {
          // If quantity is different, update it
          if (existingLog.quantity !== quantity) {
            await updateLog(existingLog.id, { quantity });
            savedCount++;
          }
        } else if (quantity > 0) {
          // Only add new log if quantity > 0
          await addLog({
            itemId,
            quantity,
            date: selectedDateStr,
            type: logType,
            notes: mode === 'count' 
              ? (isGlass ? `Daily Sales (${selectedDateStr})` : `Inventory Count (${selectedDateStr})`)
              : `Delivery Received (${selectedDateStr})`
          });
          savedCount++;
        }
      }
      if (savedCount > 0) {
        toast.success(`Synchronized ${savedCount} records for ${selectedDateStr}`);
        // Clear internal counts after save to show updated DB values
        setCounts({});
      } else {
        toast.info("No changes to sync");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to sync records");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountChange = (itemId: string, value: string) => {
    const num = parseFloat(value);
    setCounts(prev => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.categoryId) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await addItem(newItem);
      toast.success("Item added and cross-linked!");
      setAddOpen(false);
      setNewItem({ name: '', categoryId: '', unit: 'bottle', parLevel: 0, currentStock: 0, isGlass: false, mlSize: 750 });
    } catch (e) {
      toast.error("Failed to add item");
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

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
          <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="rounded-xl h-11 border-border bg-card text-blue-500 hover:text-blue-600 gap-2 font-bold px-4 shadow-sm">
                <Plus size={18} />
                <span className="hidden sm:inline">Add Item</span>
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-200">
              <DialogHeader>
                <DialogTitle>Add to Bar Catalog</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Item Name</Label>
                  <Input 
                    value={newItem.name} 
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="e.g. Patron Silver"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Category</Label>
                    <div className="relative">
                      <button 
                        onClick={() => setCategorySelectorOpen(!isCategorySelectorOpen)}
                        className="w-full flex items-center justify-between px-3 h-10 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 transition-colors text-sm"
                      >
                        <span className={newItem.categoryId ? "text-slate-200" : "text-slate-500"}>
                          {categories.find(c => c.id === newItem.categoryId)?.name || "Select..."}
                        </span>
                        <Search size={14} className="text-slate-500" />
                      </button>

                      {isCategorySelectorOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setCategorySelectorOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
                            <div className="p-2 border-b border-slate-800 bg-slate-950/50">
                              <Input 
                                autoFocus
                                placeholder="Search..."
                                value={categorySearch}
                                onChange={e => setCategorySearch(e.target.value)}
                                className="h-8 bg-slate-950 border-slate-800 text-xs"
                              />
                            </div>
                            <div className="overflow-y-auto p-1 custom-scrollbar">
                              {filteredCategories.map(cat => (
                                <button
                                  key={cat.id}
                                  onClick={() => {
                                    setNewItem({...newItem, categoryId: cat.id});
                                    setCategorySelectorOpen(false);
                                    setCategorySearch('');
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg text-xs transition-all",
                                    newItem.categoryId === cat.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                                  )}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Basis</Label>
                    <Select value={newItem.unit} onValueChange={(v) => setNewItem({...newItem, unit: v, isGlass: v === 'oz' || v === 'shot'})}>
                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-200 h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="ml">ml (Inventory)</SelectItem>
                        <SelectItem value="oz">Ounces (Glass)</SelectItem>
                        <SelectItem value="shot">Shot (Glass)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mlSize" className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Bottle Size (ml)</Label>
                    <Input 
                      id="mlSize" 
                      type="number" 
                      value={newItem.mlSize}
                      onChange={e => setNewItem({...newItem, mlSize: parseFloat(e.target.value)})}
                      className="bg-slate-950 border-slate-800"
                      placeholder="750"
                    />
                  </div>
                </div>
                <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-bold shadow-lg">
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Popover>
            <PopoverTrigger render={
              <Button variant="outline" className={cn("rounded-xl h-11 border-border bg-card justify-start font-bold px-4 min-w-[200px] text-foreground hover:bg-secondary shadow-sm")}>
                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                {format(date, "PPP")}
              </Button>
            } />
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
                <thead className="bg-secondary/30 border-b border-border">
                  <tr>
                    <th className="text-left p-3 font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Item</th>
                    <th className="text-right p-3 font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Opening</th>
                    <th className="text-right p-3 font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Theoretical</th>
                    <th className="text-right p-3 font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Closing</th>
                    <th className="text-right p-3 font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Usage</th>
                    <th className="text-right p-3 font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap text-blue-500">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usageItemsReport.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-bold text-foreground">
                        <div className="flex flex-col">
                          <span className="text-sm">{item.name}</span>
                          <span className="text-[8px] text-muted-foreground font-black uppercase">{item.unit}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground text-xs">{item.opening.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400 text-xs">{item.theoreticalUsage.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono text-foreground text-xs">{item.closing.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono font-bold text-foreground text-xs">
                        {item.totalUsage.toFixed(1)}
                      </td>
                      <td className={cn(
                        "p-3 text-right font-mono font-bold text-xs border-l border-border/50 bg-slate-800/5",
                        item.variance < -0.1 ? "text-red-500" : item.variance > 0.1 ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {item.variance > 0 ? '+' : ''}{item.variance.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  {usageItemsReport.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <History size={40} className="text-muted-foreground opacity-20 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">No usage records for this date</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Separate Receiving Summary Section */}
            {receivingSummary.length > 0 && (
              <div className="mt-8 space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between">
                   <h2 className="text-xs font-black uppercase tracking-[0.2em] text-green-500">Receiving Logs (Today)</h2>
                   <span className="text-[9px] uppercase font-bold text-slate-500">Separated Summary</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-green-500/[0.02]">
                  <table className="w-full text-xs">
                    <thead className="bg-green-500/10 border-b border-slate-800">
                      <tr>
                        <th className="text-left p-3 font-bold uppercase tracking-widest text-slate-500 text-[9px]">Item Name</th>
                        <th className="text-right p-3 font-bold uppercase tracking-widest text-slate-500 text-[9px]">Amount Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {receivingSummary.map((entry) => (
                        <tr key={entry.item.id}>
                          <td className="p-3 text-slate-200 font-bold">{entry.item.name}</td>
                          <td className="p-3 text-right font-mono text-green-500 font-black">+{entry.qty} <span className="text-[8px] text-slate-600 uppercase">{entry.item.unit}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
