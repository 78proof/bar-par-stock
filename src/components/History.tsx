import React, { useState } from 'react';
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
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);

  const filteredLogs = logs.filter(log => {
    const item = items.find(i => i.id === log.itemId);
    return item?.name.toLowerCase().includes(search.toLowerCase()) || 
           log.date.includes(search) ||
           log.notes?.toLowerCase().includes(search.toLowerCase());
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Inventory History</h1>
          <p className="text-slate-500 font-medium">Historical audit log of all stock movements.</p>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
        <Input 
          className="pl-12 h-12 rounded-2xl bg-slate-900 border-slate-800 hover:border-slate-700 transition-all font-medium text-slate-200" 
          placeholder="Search by name, date or notes..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card className="rounded-3xl border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-800/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest p-4">Snapshot</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest p-4">Component / Action</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest p-4 text-center">Protocol</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest p-4 text-right">Qty</TableHead>
                <TableHead className="w-[120px] p-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const item = items.find(i => i.id === log.itemId);
                return (
                  <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <CalendarIcon size={14} className="text-slate-600" />
                        <span className="font-mono text-xs">{format(new Date(log.date), 'MMM dd')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      <p className="font-bold text-slate-200">{item?.name || 'Archived'}</p>
                      <p className="text-[10px] text-slate-500 italic max-w-[200px] truncate">{log.notes || '-'}</p>
                    </TableCell>
                    <TableCell className="p-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                        log.type === 'count' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        log.type === 'delivery' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        log.type === 'sales' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      )}>
                        {log.type}
                      </span>
                    </TableCell>
                    <TableCell className="p-4 text-right font-mono font-bold text-slate-300">
                      {log.quantity}
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg" onClick={() => setEditingLog(log)}>
                          <Edit3 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg" onClick={() => handleDelete(log.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && (
            <div className="py-24 text-center text-slate-600">
              <HistoryIcon size={64} className="mx-auto mb-4 opacity-5" />
              <p className="text-sm font-medium">No movement data found for current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
