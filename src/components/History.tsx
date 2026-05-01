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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
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
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { InventoryLog } from '../types';

export const History: React.FC = () => {
  const { logs, items, deleteLog, updateLog } = useInventory();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'usage' | 'delivery'>('usage');
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const selectedDateStr = format(date, 'yyyy-MM-dd');

  const filteredLogs = logs.filter(log => {
    const item = items.find(i => i.id === log.itemId);
    const matchesDate = log.date === selectedDateStr;
    const matchesSubTab = 
      (activeSubTab === 'sales' && log.type === 'sales') ||
      (activeSubTab === 'usage' && (log.type === 'count' || log.type === 'usage')) ||
      (activeSubTab === 'delivery' && log.type === 'delivery');

    const matchesSearch = item?.name.toLowerCase().includes(search.toLowerCase()) || 
                          log.notes?.toLowerCase().includes(search.toLowerCase());

    return matchesDate && matchesSubTab && matchesSearch;
  });

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteLog(deleteConfirmId);
      setDeleteConfirmId(null);
      toast.success("Log entry deleted successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete log entry");
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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Report History</h1>
          <p className="text-muted-foreground font-medium">Review and audit your daily stock records.</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger render={
              <Button 
                variant="outline" 
                className={cn(
                  "h-12 px-6 rounded-2xl bg-card border-border text-foreground hover:bg-secondary transition-all font-bold gap-3 min-w-[240px] justify-start shadow-sm",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon size={18} className="text-blue-600 dark:text-blue-400" />
                {date ? format(date, "EEEE, MMMM do") : <span>Select Date</span>}
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
          <div className="flex gap-1 bg-card border border-border p-1 rounded-2xl h-12 shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-full w-10 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const newDate = new Date(date);
                newDate.setDate(date.getDate() - 1);
                setDate(newDate);
              }}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-full w-10 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const newDate = new Date(date);
                newDate.setDate(date.getDate() + 1);
                setDate(newDate);
              }}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card p-4 sm:p-6 rounded-3xl border border-border space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border overflow-x-auto w-full sm:w-auto">
            <button 
              onClick={() => setActiveSubTab('usage')}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeSubTab === 'usage' ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Usage Report
            </button>
            <button 
              onClick={() => setActiveSubTab('sales')}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeSubTab === 'sales' ? "bg-card text-purple-600 dark:text-purple-400 shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sales Report
            </button>
            <button 
              onClick={() => setActiveSubTab('delivery')}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeSubTab === 'delivery' ? "bg-card text-green-600 dark:text-green-400 shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Receiving
            </button>
          </div>
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500" size={14} />
            <Input 
              className="pl-9 h-10 w-full sm:w-[250px] bg-background border-border text-xs rounded-xl focus:border-blue-500/50 transition-all font-bold"
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-black uppercase text-[8px] sm:text-[9px] tracking-widest p-4">Item Name</TableHead>
                <TableHead className="text-muted-foreground font-black uppercase text-[8px] sm:text-[9px] tracking-widest p-4 text-right">Quantity</TableHead>
                <TableHead className="text-muted-foreground font-black uppercase text-[8px] sm:text-[9px] tracking-widest p-4 group">
                  Notes
                </TableHead>
                <TableHead className="w-[100px] p-4 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const item = items.find(i => i.id === log.itemId);
                const itemName = item?.name || (log.notes?.includes('Deduction') ? log.notes.split(': ')[1] : 'Archived Item');
                
                return (
                  <TableRow key={log.id} className="border-border hover:bg-secondary/20 transition-colors group">
                    <TableCell className="p-4">
                      <div className="font-bold text-sm sm:text-base text-foreground">{itemName}</div>
                      <div className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{log.type}</div>
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <span className={cn(
                        "font-mono font-bold text-sm",
                        log.type === 'delivery' ? 'text-green-600 dark:text-green-400' : 'text-foreground'
                      )}>
                        {log.type === 'delivery' ? '+' : ''}{log.quantity}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1 font-bold uppercase">{item?.unit}</span>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="text-[10px] text-muted-foreground italic max-w-[200px] truncate">
                        {log.notes || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all rounded-lg" onClick={() => setEditingLog(log)}>
                          <Edit3 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg" onClick={() => setDeleteConfirmId(log.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HistoryIcon size={32} className="text-muted-foreground opacity-20 mb-2" />
                      <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">No entries found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent className="bg-card border-border text-foreground rounded-[32px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest px-1">Quantity</label>
              <Input 
                type="number"
                value={editingLog?.quantity || 0}
                onChange={e => setEditingLog(prev => prev ? {...prev, quantity: parseFloat(e.target.value)} : null)}
                className="h-14 bg-background border-border rounded-2xl text-lg font-mono font-bold text-blue-600 dark:text-blue-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest px-1">Audit Notes</label>
              <Input 
                value={editingLog?.notes || ''}
                onChange={e => setEditingLog(prev => prev ? {...prev, notes: e.target.value} : null)}
                className="h-14 bg-background border-border rounded-2xl text-sm"
                placeholder="Reason for change..."
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setEditingLog(null)} className="h-12 w-full sm:flex-1 rounded-2xl font-bold text-muted-foreground hover:bg-secondary">Cancel</Button>
            <Button onClick={handleUpdate} className="h-12 w-full sm:flex-[2] bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-lg shadow-blue-600/20">Update Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="bg-card border-border text-foreground rounded-[32px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-muted-foreground font-medium">Are you sure you want to delete this record? This will also revert the stock level of the item.</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="h-12 w-full sm:flex-1 rounded-2xl font-bold text-muted-foreground hover:bg-secondary">Cancel</Button>
            <Button onClick={handleDelete} className="h-12 w-full sm:flex-[2] bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-600/20">Delete Forever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
