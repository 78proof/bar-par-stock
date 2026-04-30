import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Button } from './ui/button';
import { 
  Trash2, 
  Calendar as CalendarIcon,
  Search,
  Edit3,
  FlaskConical,
  ArrowDown,
  ChevronRight
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Input } from './ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { InventoryLog } from '../types';

export const History: React.FC = () => {
  const { logs, items, recipes, deleteLog, updateLog } = useInventory();
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'usage' | 'delivery'>('sales');
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Set initial date to most recent log date
  useEffect(() => {
    if (logs.length > 0) {
      const dates = Array.from(new Set(logs.map(l => l.date))).sort((a, b) => b.localeCompare(a));
      if (dates[0]) {
        const d = new Date(dates[0] + 'T00:00:00');
        if (isValid(d)) setSelectedDate(d);
      }
    }
  }, []); // only on mount

  // Dates that have records (for calendar highlighting)
  const datesWithData = useMemo(() => {
    return new Set(logs.map(l => l.date));
  }, [logs]);

  // Helper: resolve item name from log
  const resolveItemName = (log: InventoryLog): string => {
    const item = items.find(i => i.id === log.itemId);
    if (item) return item.name;
    // Try to extract name from notes (e.g. "Deduction: Moscow Mule x3" → "Moscow Mule")
    if (log.notes) {
      const deductionMatch = log.notes.match(/Deduction:\s*(.+?)\s*x\d+/i);
      if (deductionMatch) return `${deductionMatch[1]} (ingredient)`;
      const countMatch = log.notes.match(/Physical Inventory Count/i);
      if (countMatch) return 'Deleted Item';
      const salesMatch = log.notes.match(/Daily Sales Entry/i);
      if (salesMatch) return 'Deleted Item';
    }
    return 'Deleted Item';
  };

  // ── SALES view: type='sales' + their ingredient deductions grouped ──
  const salesView = useMemo(() => {
    const salesLogs = logs.filter(l =>
      l.date === selectedDateStr && l.type === 'sales' &&
      (search === '' || resolveItemName(l).toLowerCase().includes(search.toLowerCase()))
    );

    return salesLogs.map(sLog => {
      const salesItem = items.find(i => i.id === sLog.itemId);
      const salesName = salesItem?.name ?? resolveItemName(sLog);
      const recipe = recipes.find(r => r.name.toLowerCase() === salesName.toLowerCase());

      // Find related ingredient deductions for this date
      // They will have notes like "Deduction: [salesName] x[qty]"
      const deductionLogs = logs.filter(l =>
        l.date === selectedDateStr &&
        l.type === 'usage' &&
        l.notes?.toLowerCase().includes(`deduction: ${salesName.toLowerCase()}`)
      );

      const ingredientBreakdown = recipe
        ? recipe.ingredients.map(ing => {
            const ingItem = items.find(i => i.id === ing.itemId);
            // Find actual deduction log for this ingredient
            const deductLog = deductionLogs.find(dl => dl.itemId === ing.itemId);
            return {
              ingredientName: ingItem?.name ?? `Unknown (${ing.itemId.slice(0, 6)})`,
              deducted: deductLog?.quantity ?? (ing.amount * sLog.quantity),
              unit: ing.unit || ingItem?.unit || '',
            };
          })
        : deductionLogs.map(dl => {
            const ingItem = items.find(i => i.id === dl.itemId);
            return {
              ingredientName: ingItem?.name ?? resolveItemName(dl),
              deducted: dl.quantity,
              unit: ingItem?.unit ?? '',
            };
          });

      return { sLog, salesName, salesItem, recipe, ingredientBreakdown };
    });
  }, [logs, items, recipes, selectedDateStr, search]);

  // ── USAGE view: type='usage' (recipe deductions) ──
  const usageView = useMemo(() => {
    return logs.filter(l =>
      l.date === selectedDateStr && l.type === 'usage' &&
      (search === '' || resolveItemName(l).toLowerCase().includes(search.toLowerCase()))
    );
  }, [logs, items, selectedDateStr, search]);

  // ── DELIVERY view: type='delivery' ──
  const deliveryView = useMemo(() => {
    return logs.filter(l =>
      l.date === selectedDateStr && l.type === 'delivery' &&
      (search === '' || resolveItemName(l).toLowerCase().includes(search.toLowerCase()))
    );
  }, [logs, items, selectedDateStr, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log? This might affect current stock.')) return;
    try {
      await deleteLog(id);
      toast.success('Log entry deleted');
    } catch (e) {
      toast.error('Failed to delete log');
    }
  };

  const handleUpdate = async () => {
    if (!editingLog) return;
    try {
      await updateLog(editingLog.id, { quantity: editingLog.quantity, notes: editingLog.notes });
      setEditingLog(null);
      toast.success('Log updated successfully');
    } catch (e) {
      toast.error('Failed to update log');
    }
  };

  const tabCounts = {
    sales: logs.filter(l => l.date === selectedDateStr && l.type === 'sales').length,
    usage: logs.filter(l => l.date === selectedDateStr && l.type === 'usage').length,
    delivery: logs.filter(l => l.date === selectedDateStr && l.type === 'delivery').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Report History</h1>
          <p className="text-slate-500 font-medium">Review and audit your daily stock records.</p>
        </div>
        {/* Calendar date picker */}
        <Popover>
          <PopoverTrigger render={<Button variant="outline" className="rounded-xl h-11 border-slate-800 bg-slate-900 justify-start font-normal px-4 min-w-[220px] text-slate-300 hover:bg-slate-800" />}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, 'EEE, MMM dd yyyy') : <span>Pick a date</span>}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              initialFocus
              className="bg-slate-900 text-slate-200"
              modifiers={{ hasData: (day) => datesWithData.has(format(day, 'yyyy-MM-dd')) }}
              modifiersClassNames={{ hasData: 'font-bold underline decoration-blue-500 underline-offset-2' }}
            />
            <div className="px-4 pb-3 border-t border-slate-800 pt-3">
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                <span className="underline decoration-blue-500 underline-offset-2">Underlined</span> dates have records
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick date chips for recent dates with data */}
      {(() => {
        const recentDates = Array.from(datesWithData)
          .sort((a, b) => b.localeCompare(a))
          .slice(0, 7);
        return recentDates.length > 0 ? (
          <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
            {recentDates.map(dateStr => (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(new Date(dateStr + 'T00:00:00'))}
                className={cn(
                  'px-4 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                  selectedDateStr === dateStr
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                )}
              >
                {format(new Date(dateStr + 'T00:00:00'), 'EEE, MMM dd')}
              </button>
            ))}
          </div>
        ) : null;
      })()}

      {/* Main card */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['sales', 'usage', 'delivery'] as const).map(tab => {
              const count = tabCounts[tab];
              const colors = {
                sales: 'text-blue-400',
                usage: 'text-orange-400',
                delivery: 'text-green-400',
              };
              const labels = { sales: 'Sales', usage: 'Usage', delivery: 'Receiving' };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5',
                    activeSubTab === tab ? `bg-slate-800 ${colors[tab]}` : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {labels[tab]}
                  {count > 0 && (
                    <span className={cn('px-1.5 py-0.5 rounded-full text-[8px] font-black',
                      activeSubTab === tab ? 'bg-slate-700' : 'bg-slate-800')}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400" size={14} />
            <Input className="pl-9 h-10 w-full sm:w-[250px] bg-slate-950 border-slate-800 text-xs rounded-xl"
              placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ── SALES TAB ── */}
        {activeSubTab === 'sales' && (
          <div className="space-y-3">
            {salesView.map(({ sLog, salesName, recipe, ingredientBreakdown }) => (
              <div key={sLog.id} className="rounded-2xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-slate-800/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <FlaskConical size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        {salesName}
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[8px] font-black uppercase text-blue-500 border border-blue-500/20">SOP</span>
                      </div>
                      <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                        {format(new Date(sLog.date + 'T00:00:00'), 'EEE, MMM dd yyyy')} · {sLog.notes || 'Daily Sales Entry'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-2xl text-blue-400">{sLog.quantity}</div>
                      <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">units sold</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-blue-400 rounded-lg" onClick={() => setEditingLog(sLog)}>
                        <Edit3 size={12} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-red-400 rounded-lg" onClick={() => handleDelete(sLog.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Ingredient breakdown */}
                {ingredientBreakdown.length > 0 && (
                  <div className="border-t border-slate-800 bg-slate-950/40">
                    <div className="px-4 py-2 flex items-center gap-2">
                      <ArrowDown size={10} className="text-slate-700" />
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                        Ingredient Deductions × {sLog.quantity} serves
                      </span>
                    </div>
                    <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {ingredientBreakdown.map((ing, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800/50">
                          <span className="text-xs text-slate-400 font-medium">{ing.ingredientName}</span>
                          <span className="font-mono text-xs font-bold text-orange-400">-{ing.deducted} {ing.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!recipe && ingredientBreakdown.length === 0 && (
                  <div className="border-t border-slate-800 px-4 py-2 bg-slate-950/20">
                    <span className="text-[9px] text-slate-700 italic">No recipe linked — ingredient deductions not available</span>
                  </div>
                )}
              </div>
            ))}
            {salesView.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
                <div className="text-slate-600 italic text-xs">No sales records for {format(selectedDate, 'MMM dd, yyyy')}.</div>
              </div>
            )}
          </div>
        )}

        {/* ── USAGE TAB ── */}
        {activeSubTab === 'usage' && (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <Table>
              <TableHeader className="bg-slate-800/40">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4">Ingredient</TableHead>
                  <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4">Triggered By</TableHead>
                  <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4 text-right">Amount Deducted</TableHead>
                  <TableHead className="w-[100px] p-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageView.map((log) => {
                  const item = items.find(i => i.id === log.itemId);
                  const itemName = item?.name ?? resolveItemName(log);
                  // Parse recipe name from notes: "Deduction: Moscow Mule x3"
                  const triggerMatch = log.notes?.match(/Deduction:\s*(.+?)\s*x(\d+)/i);
                  const triggeredBy = triggerMatch ? `${triggerMatch[1]} ×${triggerMatch[2]}` : log.notes || '—';
                  return (
                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors">
                      <TableCell className="p-4">
                        <div className="font-bold text-slate-200">{itemName}</div>
                        {!item && <div className="text-[9px] text-yellow-600 font-bold uppercase tracking-widest">Item deleted</div>}
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <FlaskConical size={11} className="text-blue-500/60 flex-shrink-0" />
                          {triggeredBy}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <span className="font-mono font-bold text-orange-400">-{log.quantity} {item?.unit ?? ''}</span>
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-blue-400 rounded-lg" onClick={() => setEditingLog(log)}>
                            <Edit3 size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-red-400 rounded-lg" onClick={() => handleDelete(log.id)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {usageView.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-600 italic text-xs">
                      No ingredient usage records for {format(selectedDate, 'MMM dd, yyyy')}. Usage is auto-generated when sales are recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── RECEIVING TAB ── */}
        {activeSubTab === 'delivery' && (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <Table>
              <TableHeader className="bg-slate-800/40">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4">Item</TableHead>
                  <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4 text-right">Qty Received</TableHead>
                  <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4">Notes</TableHead>
                  <TableHead className="w-[100px] p-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryView.map((log) => {
                  const item = items.find(i => i.id === log.itemId);
                  return (
                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors">
                      <TableCell className="p-4">
                        <div className="font-bold text-slate-200">{item?.name ?? resolveItemName(log)}</div>
                        {!item && <div className="text-[9px] text-yellow-600 font-bold uppercase tracking-widest">Item deleted</div>}
                      </TableCell>
                      <TableCell className="p-4 text-right font-mono font-bold text-green-400">+{log.quantity}</TableCell>
                      <TableCell className="p-4">
                        <div className="text-[10px] text-slate-600 italic max-w-[300px] truncate">{log.notes || '—'}</div>
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-blue-400 rounded-lg" onClick={() => setEditingLog(log)}>
                            <Edit3 size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-red-400 rounded-lg" onClick={() => handleDelete(log.id)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {deliveryView.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-600 italic text-xs">
                      No receiving records for {format(selectedDate, 'MMM dd, yyyy')}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle>Edit Log Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-500 font-bold">Quantity</label>
              <Input
                type="number"
                value={editingLog?.quantity || 0}
                onChange={e => setEditingLog(prev => prev ? { ...prev, quantity: parseFloat(e.target.value) } : null)}
                className="bg-slate-950 border-slate-800"
              />
              <p className="text-[10px] text-slate-500 italic">Note: Changing quantity here will NOT automatically re-adjust current item stock levels.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-500 font-bold">Notes</label>
              <Input
                value={editingLog?.notes || ''}
                onChange={e => setEditingLog(prev => prev ? { ...prev, notes: e.target.value } : null)}
                className="bg-slate-950 border-slate-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingLog(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 font-bold">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
