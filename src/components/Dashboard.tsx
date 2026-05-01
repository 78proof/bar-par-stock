import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useDashboardData } from '../hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  Activity, 
  Package,
  GlassWater,
  ClipboardCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  StickyNote,
  ListTodo
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { items, recipes, categories } = useInventory();
  const { 
    reminders, notes, addReminder, toggleReminder, deleteReminder, 
    addNote, deleteNote 
  } = useDashboardData();

  const [newReminder, setNewReminder] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;

  const shortageProducingItems = items.filter(i => !i.isGlass && (i.parLevel || 0) > 0);
  const lowStockItems = shortageProducingItems.filter(i => (i.currentStock || 0) < i.parLevel);
  const stockHealth = shortageProducingItems.length > 0 
    ? ((shortageProducingItems.length - lowStockItems.length) / shortageProducingItems.length) * 100 
    : 100;

  const wineItems = items.filter(i => categories.find(c => c.id === i.categoryId)?.type === 'wine');
  const liquorItems = items.filter(i => {
    const type = categories.find(c => c.id === i.categoryId)?.type;
    return type !== 'wine' && type !== 'soft_drink';
  });

  const lowWine = wineItems.filter(i => !i.isGlass && (i.parLevel || 0) > 0 && (i.currentStock || 0) < i.parLevel);
  const lowLiquor = liquorItems.filter(i => !i.isGlass && (i.parLevel || 0) > 0 && (i.currentStock || 0) < i.parLevel);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReminder.trim()) {
      await addReminder(newReminder);
      setNewReminder('');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.content.trim()) {
      await addNote(newNote.content, newNote.title);
      setNewNote({ title: '', content: '' });
      setShowNoteForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Bar Analytics</h1>
        <p className="text-slate-500 font-medium">Snapshot of your currently separate bar and wine stock.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inventory Health</p>
              <Activity className="text-blue-500" size={16} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-3xl font-bold">{Math.round(stockHealth)}%</h2>
              <span className="text-xs text-blue-500 font-bold flex items-center">
                <ArrowUpRight size={12} />
                +2.5%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Status: Stable</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wine Shortage</p>
              <AlertTriangle className="text-red-500" size={16} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-3xl font-bold">{lowWine.length}</h2>
              <span className="text-[10px] text-red-500/80 font-bold flex items-center uppercase tracking-widest">
                Bottles
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Action: Reorder</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bar Shortage</p>
              <Package className="text-blue-500" size={16} />
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold">{lowLiquor.length}</h2>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Low par items</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Recipes</p>
              <GlassWater className="text-blue-500" size={16} />
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold">{recipes.length}</h2>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Standardized SOPs</p>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reminders - Todoist Style */}
        <Card className="lg:col-span-1 rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <ListTodo size={16} className="text-blue-500" /> Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[400px]">
            <form onSubmit={handleAddReminder} className="p-4 border-b border-border">
              <div className="relative">
                <Input 
                  placeholder="Add a reminder..." 
                  value={newReminder}
                  onChange={e => setNewReminder(e.target.value)}
                  className="pr-10 rounded-xl bg-secondary/50 border-transparent focus:border-blue-500/50"
                  id="reminder-input"
                />
                <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8 text-blue-500">
                  <Plus size={18} />
                </Button>
              </div>
            </form>
            <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
              {/* Pending Section */}
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {reminders.filter(r => !r.completed).map(rem => (
                    <motion.div 
                      key={rem.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-3 rounded-xl transition-all group hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleReminder(rem.id, true)} className="text-muted-foreground hover:text-blue-500 transition-colors">
                          <Circle size={18} />
                        </button>
                        <span className="text-xs font-medium">{rem.text}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteReminder(rem.id)}
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Checked Section */}
              {reminders.some(r => r.completed) && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 mb-2">Checked</p>
                  <div className="space-y-1">
                    {reminders.filter(r => r.completed).map(rem => (
                      <div 
                        key={rem.id}
                        className="flex items-center justify-between p-3 rounded-xl opacity-50 bg-secondary/20"
                      >
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleReminder(rem.id, false)} className="text-blue-500">
                            <CheckCircle2 size={18} />
                          </button>
                          <span className="text-xs font-medium line-through">{rem.text}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteReminder(rem.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reminders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-30">
                  <ClipboardCheck size={40} />
                  <p className="text-[10px] font-black uppercase mt-2">All tasks completed</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="lg:col-span-1 rounded-3xl border border-border bg-card shadow-sm flex flex-col">
          <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <StickyNote size={16} className="text-amber-500" /> Notes
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowNoteForm(!showNoteForm)} className="h-8 rounded-lg text-blue-500">
              <Plus size={16} />
            </Button>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto custom-scrollbar h-[400px]">
            {showNoteForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                onSubmit={handleAddNote} 
                className="mb-6 space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border"
              >
                <Input 
                  placeholder="Note Title (optional)" 
                  value={newNote.title}
                  onChange={e => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-card border-border"
                  id="note-title"
                />
                <Textarea 
                  placeholder="What's on your mind?" 
                  value={newNote.content}
                  onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-card border-border min-h-[80px]"
                  id="note-content"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowNoteForm(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-blue-600">Save Note</Button>
                </div>
              </motion.form>
            )}
            <div className="grid grid-cols-1 gap-3">
              {notes.map(note => (
                <div key={note.id} className="p-4 rounded-2xl bg-secondary/30 border border-border group relative">
                  {note.title && <h3 className="font-bold text-sm mb-1">{note.title}</h3>}
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 w-7 text-red-500"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
              {notes.length === 0 && !showNoteForm && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-30">
                  <StickyNote size={40} />
                  <p className="text-[10px] font-black uppercase mt-2">No notes yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attention Needed */}
        <Card className="lg:col-span-1 rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
              <AlertTriangle size={14} /> Low Par Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto custom-scrollbar h-[400px]">
            <div className="space-y-3">
              {lowStockItems.slice(0, 10).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center font-mono font-bold text-[10px] text-red-500">
                      {Math.round((item.currentStock / item.parLevel) * 100)}%
                    </div>
                    <div>
                      <p className="font-bold text-xs text-foreground">{item.name}</p>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{getCategoryName(item.categoryId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-bold text-muted-foreground">{item.currentStock} / {item.parLevel}</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <ClipboardCheck size={48} className="mb-4 opacity-10" />
                  <p className="text-xs font-medium uppercase tracking-[0.2em]">All levels optimal</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
