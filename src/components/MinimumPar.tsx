import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Save, Search, Target, Wine, GlassWater } from 'lucide-react';
import { toast } from 'sonner';

export const MinimumPar: React.FC = () => {
  const { items, categories, updateItem } = useInventory();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  // Filter out Glass items as per request: "for glass we dont need minimum par"
  const nonGlassItems = items.filter(i => {
    const isAlcohol = i.name.toLowerCase().includes('(glass)') || i.name.toLowerCase().includes('(bottle)');
    // If it's a glass item, skip it
    return !i.isGlass;
  });

  const filteredItems = nonGlassItems.filter(i => {
    const itemCat = categories.find(c => c.id === i.categoryId);
    return i.name.toLowerCase().includes(search.toLowerCase()) || 
           itemCat?.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleUpdatePar = async (id: string, par: number) => {
    setSaving(id);
    try {
      await updateItem(id, { parLevel: par });
      toast.success("Par level updated");
    } catch (e) {
      toast.error("Failed to update");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Minimum Par Settings</h1>
        <p className="text-slate-500 font-medium font-medium">Standardize your baseline stock requirements for bottles and soft drinks.</p>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
        <Input 
          className="pl-12 h-14 rounded-2xl bg-card border-border hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-500/50 transition-all font-medium" 
          placeholder="Search items to set par..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <Card key={item.id} className="rounded-2xl border border-border bg-card overflow-hidden group shadow-sm transition-all hover:shadow-md">
            <CardHeader className="p-4 pb-2">
               <div className="flex justify-between items-start">
                <div className="p-2.5 bg-secondary rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                  {categories.find(c => c.id === item.categoryId)?.type === 'wine' ? <Wine size={16} className="text-red-500" /> : <GlassWater size={16} className="text-blue-500" />}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Category</p>
                  <p className="text-[10px] text-foreground font-bold truncate max-w-[100px] mt-1">{categories.find(c => c.id === item.categoryId)?.name}</p>
                </div>
              </div>
              <CardTitle className="mt-2 text-sm font-bold text-foreground">{item.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="mt-4 space-y-2">
                <label className="text-[10px] uppercase text-muted-foreground tracking-widest font-black">Base Par Level ({item.unit})</label>
                <div className="flex gap-2">
                  <ItemParInput 
                    parLevel={item.parLevel}
                    onSave={(val) => handleUpdatePar(item.id, val)}
                  />
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <Target size={16} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-20 text-center bg-secondary/30 rounded-3xl border border-dashed border-border">
          <Target size={48} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No matches found</p>
        </div>
      )}
    </div>
  );
};

const ItemParInput = ({ parLevel, onSave }: { parLevel: number, onSave: (val: number) => void }) => {
  const [val, setVal] = useState(parLevel.toString());

  React.useEffect(() => {
    setVal(parLevel.toString());
  }, [parLevel]);

  return (
    <Input 
      type="number"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        const num = parseFloat(val);
        if (!isNaN(num) && num !== parLevel) {
          onSave(num);
        }
      }}
      className="h-10 bg-background border-border font-mono font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/20 text-center"
    />
  );
};
