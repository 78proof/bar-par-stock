import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Save, 
  TrendingDown,
  FlaskConical,
  ArrowDown
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
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const ParCutting: React.FC = () => {
  const { items, categories, recipes, logs, addLog } = useInventory();
  const [date, setDate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [mode, setMode] = useState<'count' | 'delivery'>('count');
  const [activeTab, setActiveTab] = useState<'entry' | 'usage' | 'sales'>('entry');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Other';

  const filteredSelectorItems = items.filter(item =>
    item.name.toLowerCase().includes(selectorSearch.toLowerCase())
  );

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.categoryId === filter;
    const itemCategoryName = categories.find(c => c.id === item.categoryId)?.name.toLowerCase() || '';
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          itemCategoryName.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // ── Usage Report: merges saved logs for the day + current unsaved counts ──
  const usageReport = useMemo(() => {
    const nonGlassItems = items.filter(i => !i.isGlass && !i.name.toLowerCase().includes('(glass)'));
    return nonGlassItems.map(item => {
      const savedCountLog = logs.find(l =>
        l.itemId === item.id && l.date === dateStr && l.type === 'count'
      );
      const savedUsageLogs = logs.filter(l =>
        l.itemId === item.id && l.date === dateStr && l.type === 'usage'
      );
      const totalRecipeDeducted = savedUsageLogs.reduce((s, l) => s + l.quantity, 0);

      const unsavedClosing = counts[item.id] !== undefined ? counts[item.id] : undefined;
      const closing = savedCountLog?.quantity ?? unsavedClosing;

      // Opening = most recent count log before today, fallback to currentStock
      const prevCountLog = logs
        .filter(l => l.itemId === item.id && l.date < dateStr && l.type === 'count')
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      const opening = prevCountLog?.quantity ?? (savedCountLog ? null : item.currentStock);
      const physicalUsage = (opening !== null && opening !== undefined && closing !== undefined)
        ? Math.max(0, opening - closing)
        : null;

      const hasData = closing !== undefined || totalRecipeDeducted > 0;
      return { item, opening, closing, physicalUsage, totalRecipeDeducted, hasData, isSaved: !!savedCountLog };
    }).filter(r => r.hasData);
  }, [items, logs, counts, dateStr]);

  // ── Sales Report: merges saved sales logs for the day + current unsaved counts ──
  const salesReport = useMemo(() => {
    const glassItems = items.filter(i => i.isGlass || i.name.toLowerCase().includes('(glass)'));
    return glassItems.map(item => {
      const savedSalesLog = logs.find(l =>
        l.itemId === item.id && l.date === dateStr && l.type === 'sales'
      );
      const unsavedCount = counts[item.id] !== undefined ? counts[item.id] : undefined;
      const unitsSold = savedSalesLog?.quantity ?? unsavedCount;

      const recipe = recipes.find(r => r.name.toLowerCase() === item.name.toLowerCase());
      const ingredientBreakdown = recipe
        ? recipe.ingredients.map(ing => {
            const ingItem = items.find(i => i.id === ing.itemId);
            const deducted = unitsSold !== undefined ? ing.amount * unitsSold : null;
            return {
              ingredientName: ingItem?.name ?? 'Unknown Ingredient',
              unitAmt: ing.amount,
              unit: ing.unit || ingItem?.unit || 'ml',
              deducted,
            };
          })
        : [];
      return { item, unitsSold, recipe, ingredientBreakdown, isSaved: !!savedSalesLog };
    }).filter(r => r.unitsSold !== undefined);
  }, [items, recipes, logs, counts, dateStr]);

  const handleSaveAll = async () => {
    const logEntries = Object.entries(counts).filter(([_, qty]) => qty !== undefined && qty > 0);
    if (logEntries.length === 0) { toast.error('No entries found'); return; }
    setIsSaving(true);
    try {
      for (const [itemId, quantity] of logEntries) {
        const item = items.find(i => i.id === itemId);
        const isGlass = item?.isGlass || item?.name.toLowerCase().includes('(glass)');
        const logType = mode === 'count' ? (isGlass ? 'sales' : 'count') : 'delivery';
        await addLog({
          itemId, quantity, date: dateStr, type: logType,
          notes: mode === 'count'
            ? (isGlass ? `Daily Sales Entry (${dateStr})` : `Physical Inventory Count (${dateStr})`)
            : `Stock Delivery Received (${dateStr})`
        });
      }
      toast.success(`Successfully recorded ${logEntries.length} ${mode} records`);
      setCounts({});
    } catch (e) {
      toast.error('Failed to save records');
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Par Cutting</h1>
          <p className="text-slate-500 font-medium">Record current stock levels for {format(date, 'PPP')}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl h-11">
            <button
              onClick={() => { setMode('count'); setCounts({}); }}
              className={cn('px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                mode === 'count' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300')}
            >Par Cut (Night)</button>
            <button
              onClick={() => { setMode('delivery'); setCounts({}); }}
              className={cn('px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                mode === 'delivery' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300')}
            >Receiving (Day)</button>
          </div>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" className="rounded-xl h-11 border-slate-800 bg-slate-900 justify-start font-normal px-4 min-w-[200px] text-slate-300 hover:bg-slate-800" />}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="end">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="bg-slate-900 text-slate-200" />
            </PopoverContent>
          </Popover>
          <Button
            className={cn('rounded-xl h-11 px-6 shadow-lg gap-2 font-bold',
              mode === 'count' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-green-600 hover:bg-green-500 shadow-green-900/20')}
            onClick={handleSaveAll}
            disabled={isSaving || Object.keys(counts).length === 0}
          >
            {isSaving ? <TrendingDown className="animate-pulse" /> : (mode === 'count' ? <Save size={18} /> : <Plus size={18} />)}
            {isSaving ? 'Saving...' : (mode === 'count' ? 'Finalize Night Cut' : 'Confirm Delivery')}
          </Button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-sm">

        {/* Sub-tabs (Par Cut mode only) */}
        {mode === 'count' && (
          <div className="flex border-b border-slate-800 -mx-6 px-6 mb-6">
            {(['entry', 'usage', 'sales'] as const).map(tab => {
              const badge = tab === 'usage' ? usageReport.length : tab === 'sales' ? salesReport.length : 0;
              const label = tab === 'entry' ? 'Entry' : tab === 'usage' ? 'Usage Report' : 'Sales Report';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn('px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative',
                    activeTab === tab ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300')}
                >
                  {label}
                  {badge > 0 && activeTab !== tab && (
                    <span className={cn('ml-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black',
                      tab === 'sales' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400')}>
                      {badge}
                    </span>
                  )}
                  {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── ENTRY ── */}
        {activeTab === 'entry' && (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <button
                    onClick={() => setSelectorOpen(!isSelectorOpen)}
                    className="w-full pl-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center text-slate-400 transition-all font-medium text-left"
                  >{search || 'Search items to count...'}</button>
                </div>
                {isSelectorOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSelectorOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[300px]">
                      <div className="p-3 border-b border-slate-800 bg-slate-950/50">
                        <Input autoFocus placeholder="Type to filter..." value={selectorSearch} onChange={e => setSelectorSearch(e.target.value)} className="h-9 bg-slate-950 border-slate-800 rounded-xl" />
                      </div>
                      <div className="overflow-y-auto p-1 custom-scrollbar">
                        {filteredSelectorItems.map(item => (
                          <button key={item.id} onClick={() => { setSearch(item.name); setSelectorOpen(false); setSelectorSearch(''); }}
                            className="w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between group">
                            <span>{item.name}</span>
                            <span className="text-[9px] text-slate-600 font-bold uppercase group-hover:text-blue-400">{getCategoryName(item.categoryId)}</span>
                          </button>
                        ))}
                        {filteredSelectorItems.length === 0 && <div className="p-8 text-center text-slate-600 text-[10px]">No matches for "{selectorSearch}"</div>}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v)}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-2xl bg-slate-950 border-slate-800 font-medium text-slate-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
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
                      {mode === 'count' ? 'Final Stock / Sold' : 'Amount Received'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-200">{item.name}</div>
                          {(item.isGlass || item.name.toLowerCase().includes('(glass)')) && (
                            <div className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[8px] font-black uppercase text-blue-500 border border-blue-500/20">SOP</div>
                          )}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-600 sm:hidden font-bold">{item.unit}</div>
                      </td>
                      <td className="p-4 text-center text-slate-500 hidden sm:table-cell font-mono text-xs">{item.unit}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-400">{item.parLevel}</td>
                      <td className="p-4 text-center">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                          item.currentStock < item.parLevel
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20')}>
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
          </>
        )}

        {/* ── USAGE REPORT ── */}
        {activeTab === 'usage' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Ingredient Usage — {format(date, 'EEE, MMM dd yyyy')}
              </p>
              {usageReport.some(r => r.isSaved) && (
                <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/20">✓ Saved to records</span>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/40 border-b border-slate-800">
                  <tr>
                    <th className="text-left p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Item</th>
                    <th className="text-right p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Opening</th>
                    <th className="text-right p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Closing Count</th>
                    <th className="text-right p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Physical Usage</th>
                    <th className="text-right p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Recipe Deducted</th>
                    <th className="text-right p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 w-[100px]">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {usageReport.map(({ item, opening, closing, physicalUsage, totalRecipeDeducted, isSaved }) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-200">{item.name}</div>
                        <div className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">{getCategoryName(item.categoryId)}</div>
                        {isSaved && <span className="text-[8px] text-green-500 font-black uppercase">✓ saved</span>}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-500">{opening !== null && opening !== undefined ? opening : <span className="text-slate-700">—</span>}</td>
                      <td className="p-4 text-right font-mono text-slate-300">{closing !== undefined ? closing : <span className="text-slate-700">—</span>}</td>
                      <td className="p-4 text-right font-mono font-bold text-red-400">
                        {physicalUsage !== null && physicalUsage !== undefined ? physicalUsage : <span className="text-slate-700">—</span>}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-orange-400">
                        {totalRecipeDeducted > 0 ? `-${totalRecipeDeducted}` : <span className="text-slate-700">—</span>}
                      </td>
                      <td className="p-4 text-right">
                        <Input type="number" className="h-8 text-right bg-slate-950 border-slate-800 text-xs font-mono"
                          value={counts[item.id] ?? ''} onChange={(e) => handleCountChange(item.id, e.target.value)} />
                      </td>
                    </tr>
                  ))}
                  {usageReport.length === 0 && (
                    <tr><td colSpan={6} className="p-12 text-center">
                      <div className="text-slate-600 italic text-xs">No usage data for {format(date, 'MMM dd, yyyy')}.</div>
                      <div className="text-slate-700 text-[10px] mt-1">Enter counts in the Entry tab and save, or select a different date.</div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── SALES REPORT ── */}
        {activeTab === 'sales' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Cocktail Sales & Ingredient Deductions — {format(date, 'EEE, MMM dd yyyy')}
              </p>
              {salesReport.some(r => r.isSaved) && (
                <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/20">✓ Saved to records</span>
              )}
            </div>
            <div className="space-y-3">
              {salesReport.map(({ item, unitsSold, recipe, ingredientBreakdown, isSaved }) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-slate-800/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <FlaskConical size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 flex items-center gap-2">
                          {item.name}
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[8px] font-black uppercase text-blue-500 border border-blue-500/20">SOP</span>
                          {isSaved && <span className="text-[8px] text-green-500 font-black uppercase">✓ saved</span>}
                        </div>
                        {recipe && (
                          <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                            {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''} per serve
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono font-bold text-2xl text-blue-400">{unitsSold ?? '—'}</div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">units sold</div>
                      </div>
                      <Input type="number" className="h-9 w-20 text-right bg-slate-950 border-slate-800 text-xs font-mono"
                        value={counts[item.id] ?? ''} onChange={(e) => handleCountChange(item.id, e.target.value)} />
                    </div>
                  </div>
                  {ingredientBreakdown.length > 0 && unitsSold !== undefined && (
                    <div className="border-t border-slate-800 bg-slate-950/40">
                      <div className="px-4 py-2 flex items-center gap-2">
                        <ArrowDown size={10} className="text-slate-700" />
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Ingredient Deductions × {unitsSold} serves</span>
                      </div>
                      <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {ingredientBreakdown.map((ing, idx) => (
                          <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800/50">
                            <span className="text-xs text-slate-400 font-medium">{ing.ingredientName}</span>
                            <span className="font-mono text-xs font-bold text-orange-400">-{ing.deducted !== null ? ing.deducted : ing.unitAmt} {ing.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!recipe && (
                    <div className="border-t border-slate-800 px-4 py-2 bg-slate-950/20">
                      <span className="text-[9px] text-slate-700 italic">No recipe linked — ingredient deductions not calculated</span>
                    </div>
                  )}
                </div>
              ))}
              {salesReport.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
                  <div className="text-slate-600 italic text-xs">No sales data for {format(date, 'MMM dd, yyyy')}.</div>
                  <div className="text-slate-700 text-[10px] mt-1">Enter SOP item counts in the Entry tab and save, or select a different date.</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
