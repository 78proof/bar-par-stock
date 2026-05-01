import React from 'react';
import { useInventory } from '../hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Package,
  GlassWater,
  ClipboardCheck,
  Calendar
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const Dashboard: React.FC = () => {
  const { items, logs, recipes, categories } = useInventory();

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;

  // Statistics
  const shortageProducingItems = items.filter(i => !i.isGlass && (i.parLevel || 0) > 0);
  const lowStockItems = shortageProducingItems.filter(i => (i.currentStock || 0) < i.parLevel);
  const stockHealth = shortageProducingItems.length > 0 
    ? ((shortageProducingItems.length - lowStockItems.length) / shortageProducingItems.length) * 100 
    : 100;
  
  // Data for Category breakdown
  const categoryData = Object.entries(
    items.reduce((acc, item) => {
      const cat = categories.find(c => c.id === item.categoryId);
      const catName = cat?.name || 'Other';
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3b82f6', '#1e40af', '#475569', '#1e293b', '#0f172a'];

  const wineItems = items.filter(i => categories.find(c => c.id === i.categoryId)?.type === 'wine');
  const liquorItems = items.filter(i => {
    const type = categories.find(c => c.id === i.categoryId)?.type;
    return type !== 'wine' && type !== 'soft_drink';
  });

  const lowWine = wineItems.filter(i => !i.isGlass && (i.parLevel || 0) > 0 && (i.currentStock || 0) < i.parLevel);
  const lowLiquor = liquorItems.filter(i => !i.isGlass && (i.parLevel || 0) > 0 && (i.currentStock || 0) < i.parLevel);

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


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden text-card-foreground">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Stock Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
              <AlertTriangle size={14} /> Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border group hover:border-red-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center font-mono font-bold text-xs text-red-500">
                      {Math.round((item.currentStock / item.parLevel) * 100)}%
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{getCategoryName(item.categoryId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-muted-foreground">{item.currentStock} / {item.parLevel}</p>
                    <p className="text-[10px] text-red-500/50 font-bold uppercase tracking-widest">Short: {item.parLevel - item.currentStock}</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <ClipboardCheck size={48} className="mb-4 opacity-10" />
                  <p className="text-sm font-medium uppercase tracking-[0.2em]">Inventory Level Optimized</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
