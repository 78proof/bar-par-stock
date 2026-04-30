import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  History as HistoryIcon, 
  Trash2, 
  Calendar as CalendarIcon,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Edit3,
  X
} from 'lucide-react';
import { format } from 'date-fns';
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
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { InventoryLog } from '../types';

export const History: React.FC = () => {
  const { logs, items, deleteLog, updateLog } = useInventory();
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(logs.length > 0 ? logs[0].date : format(new Date(), 'yyyy-MM-dd'));
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'usage' | 'delivery'>('usage');
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);

  // Group unique dates from logs
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(logs.map(log => log.date)));
    return dates.sort((a, b) => b.localeCompare(a));
  }, [logs]);

  // If selectedDate is not in uniqueDates and uniqueDates has items, default to first
  useEffect(() => {
    if (uniqueDates.length > 0 && !uniqueDates.includes(selectedDate)) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDate]);

  const filteredLogs = logs.filter(log => {
    const item = items.find(i => i.id === log.itemId);
    const matchesDate = log.date === selectedDate;
    const matchesSubTab = 
      (activeSubTab === 'sales' && log.type === 'sales') ||
      (activeSubTab === 'usage' && log.type === 'count') ||
      (activeSubTab === 'delivery' && log.type === 'delivery');

    const matchesSearch = item?.name.toLowerCase().includes(search.toLowerCase()) || 
                          log.notes?.toLowerCase().includes(search.toLowerCase());

    return matchesDate && matchesSubTab && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log? This might affect current stock.")) return;
    try {
      await deleteLog(id);
      toast.success("Log entry deleted");
    } catch (e) {
      toast.error("Failed to delete log");
    }
  };

  const handleUpdate = async () => {
    if (!editingLog) return;
    try {
      await updateLog(editingLog.id, {
        quantity: editingLog.quantity,
        notes: editingLog.notes
      });
      setEditingLog(null);
      toast.success("Log updated successfully");
    } catch (e) {
      toast.error("Failed to update log");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Report History</h1>
          <p className="text-slate-500 font-medium">Review and audit your daily stock records.</p>
        </div>
      </div>

      {/* Date Tabs */}
      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
        {uniqueDates.map(dateStr => (
          <button
            key={dateStr}
            onClick={() => setSelectedDate(dateStr)}
            className={cn(
              "px-6 py-3 rounded-2xl border text-sm font-bold whitespace-nowrap transition-all",
              selectedDate === dateStr 
                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
            )}
          >
            {format(new Date(dateStr), 'EEE, MMM dd')}
          </button>
        ))}
        {uniqueDates.length === 0 && (
          <div className="px-6 py-3 rounded-2xl border border-dashed border-slate-800 text-slate-600 text-sm">
            No history records yet
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveSubTab('usage')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                activeSubTab === 'usage' ? "bg-slate-800 text-blue-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Usage
            </button>
            <button 
              onClick={() => setActiveSubTab('sales')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                activeSubTab === 'sales' ? "bg-slate-800 text-purple-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Sales
            </button>
            <button 
              onClick={() => setActiveSubTab('delivery')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                activeSubTab === 'delivery' ? "bg-slate-800 text-green-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Receiving
            </button>
          </div>
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400" size={14} />
            <Input 
              className="pl-9 h-10 w-full sm:w-[250px] bg-slate-950 border-slate-800 text-xs rounded-xl"
              placeholder="Search in records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <Table>
            <TableHeader className="bg-slate-800/40">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4">Item Name</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4 text-right">Quantity</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-widest p-4">Notes</TableHead>
                <TableHead className="w-[100px] p-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const item = items.find(i => i.id === log.itemId);
                return (
                  <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors">
                    <TableCell className="p-4">
                      <div className="font-bold text-slate-200">{item?.name || 'Archived Item'}</div>
                    </TableCell>
                    <TableCell className="p-4 text-right font-mono font-bold text-slate-400">
                      {log.quantity}
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="text-[10px] text-slate-600 italic max-w-[300px] truncate">{log.notes || '-'}</div>
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
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-600 italic text-xs">
                    No records found for this category on {format(new Date(selectedDate), 'MMM dd')}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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
                onChange={e => setEditingLog(prev => prev ? {...prev, quantity: parseFloat(e.target.value)} : null)}
                className="bg-slate-950 border-slate-800"
              />
              <p className="text-[10px] text-slate-500 italic">Note: Changing quantity here will NOT automatically re-adjust current item stock levels.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-500 font-bold">Notes</label>
              <Input 
                value={editingLog?.notes || ''}
                onChange={e => setEditingLog(prev => prev ? {...prev, notes: e.target.value} : null)}
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
