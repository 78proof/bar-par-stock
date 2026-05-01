import React from 'react';
import { useInventory } from '../hooks/useInventory';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { AlertTriangle, Package2 } from 'lucide-react';
import { Item } from '../types';

export const Shortage: React.FC = () => {
  const { items, categories } = useInventory();

  const shortageItems = items.filter(i => !i.isGlass && (i.currentStock || 0) < (i.parLevel || 0));

  const spiritsShort = shortageItems.filter(i => {
    const cat = categories.find(c => c.id === i.categoryId);
    return cat?.type !== 'wine' && cat?.type !== 'soft_drink';
  });

  const wineShort = shortageItems.filter(i => {
    const cat = categories.find(c => c.id === i.categoryId);
    return cat?.type === 'wine';
  });

  const ShortageList = ({ list, title }: { list: Item[], title: string }) => (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{title}</h3>
        <span className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full border border-red-500/20">
          {list.length} ITEMS
        </span>
      </div>
      <div className="grid gap-3">
        {list.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl group hover:border-red-500/30 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{item.name}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  {categories.find(c => c.id === item.categoryId)?.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-red-600 dark:text-red-400">
                -{((item.parLevel || 0) - (item.currentStock || 0)).toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">To Par</p>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="py-12 text-center bg-secondary/30 rounded-2xl border border-dashed border-border">
            <Package2 size={32} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Stock Optimized</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Shortage Report</h2>
        <p className="text-muted-foreground font-medium">Automatic calculation derived from Base Par levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ShortageList title="Liquor & Spirits" list={spiritsShort} />
        <ShortageList title="Wine Cellar" list={wineShort} />
      </div>
    </div>
  );
};
