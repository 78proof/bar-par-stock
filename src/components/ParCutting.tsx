import React, { useState, useMemo } from 'react';
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
  TrendingDown
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
  const { items, categories, addLog } = useInventory();
  const [date, setDate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  
  const [mode, setMode] = useState<'count' | 'delivery'>('count');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.categoryId === filter;
    const itemCategoryName = categories.find(c => c.id === item.categoryId)?.name.toLowerCase() || '';
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          itemCategoryName.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSaveAll = async () => {
    const logEntries = Object.entries(counts).filter(([_, qty]) => qty !== undefined && qty > 0);
    if (logEntries.length === 0) {
      toast.error("No entries found");
      return;
    }

    setIsSaving(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      for (const [itemId, quantity] of logEntries) {
        const item = items.find(i => i.id === itemId);
        const isGlass = item?.isGlass || item?.name.toLowerCase().includes('(glass)');
        
        // If mode is 'count', and it's a glass item, we treat it as 'sales' (triggering deductions)
        // Otherwise it's a physical reconciliation 'count'
        const logType = mode === 'count' 
          ? (isGlass ? 'sales' : 'count') 
          : 'delivery';

        await addLog({
          itemId,
          quantity,
          date: dateStr,
          type: logType,
          notes: mode === 'count' 
            ? (isGlass ? `Daily Sales Entry (${dateStr})` : `Physical Inventory Count (${dateStr})`)
            : `Stock Delivery Received (${dateStr})`
        });
      }
      toast.success(`Successfully recorded ${logEntries.length} ${mode} records`);
      setCounts({});
    } catch (e) {
      toast.error("Failed to save records");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountChange = (itemId: string, value: string) => {
    const num = parseFloat(value);
    setCounts({ ...counts, [itemId]: isNaN(num) ? 0 : num });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Par Cutting</h1>
          <p className="text-slate-500 font-medium">Record current stock levels for {format(date, 'PPP')}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl h-11">
            <button 
              onClick={() => { setMode('count'); setCounts({}); }}
              className={cn(
                "px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                mode === 'count' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Par Cut (Night)
            </button>
            <button 
              onClick={() => { setMode('delivery'); setCounts({}); }}
              className={cn(
                "px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                mode === 'delivery' ? "bg-green-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Receiving (Day)
            </button>
          </div>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" className={cn("rounded-xl h-11 border-slate-800 bg-slate-900 justify-start font-normal px-4 min-w-[200px] text-slate-300 hover:bg-slate-800")} />}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className="bg-slate-900 text-slate-200"
              />
            </PopoverContent>
          </Popover>
          <Button 
            className={cn(
              "rounded-xl h-11 px-6 shadow-lg gap-2 font-bold",
              mode === 'count' ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20" : "bg-green-600 hover:bg-green-500 shadow-green-900/20"
            )}
            onClick={handleSaveAll}
            disabled={isSaving || Object.keys(counts).length === 0}
          >
            {isSaving ? <TrendingDown className="animate-pulse" /> : (mode === 'count' ? <Save size={18} /> : <Plus size={18} />)}
            {isSaving ? 'Saving...' : (mode === 'count' ? 'Finalize Night Cut' : 'Confirm Delivery')}
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
            <Input 
              className="pl-12 h-12 rounded-2xl bg-slate-950 border-slate-800 hover:border-slate-700 transition-all font-medium" 
              placeholder="Quick search items..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v)}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-2xl bg-slate-950 border-slate-800 font-medium text-slate-200">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/40 border-b border-slate-800">
              <tr>
                <th className="text-left p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Item</th>
                <th className="text-center p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 hidden sm:table-cell">Unit</th>
                <th className="text-center p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Base Par</th>
                <th className="text-center p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Last Stock</th>
                <th className="text-right p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 w-[140px]">
                  {mode === 'count' ? 'Final Stock' : 'Amount Received'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-slate-200">{item.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-600 sm:hidden font-bold">{item.unit}</div>
                  </td>
                  <td className="p-4 text-center text-slate-500 hidden sm:table-cell font-mono text-xs">{item.unit}</td>
                  <td className="p-4 text-center font-mono font-bold text-slate-400">{item.parLevel}</td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      item.currentStock < item.parLevel 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Input 
                      type="number"
                      className="h-10 text-right font-mono font-bold text-blue-400 focus-visible:ring-blue-500/50 rounded-xl bg-slate-950 border-slate-800 group-hover:border-slate-700 transition-all placeholder:text-slate-800"
                      placeholder={item.currentStock.toString()}
                      value={counts[item.id] === undefined ? '' : counts[item.id]}
                      onChange={(e) => handleCountChange(item.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
