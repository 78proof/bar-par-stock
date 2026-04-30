import React, { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  CircleDot,
  FlaskConical,
  Grape,
  GlassWater,
  Wine,
  Tag,
  FolderPlus,
  ArrowRight
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from './ui/dialog';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Item, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const InventoryList: React.FC = () => {
  const { items, categories, addItem, updateItem, deleteItem, addCategory, deleteCategory } = useInventory();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isAddOpen, setAddOpen] = useState(false);
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');

  const [newItem, setNewItem] = useState<Omit<Item, 'id' | 'updatedAt' | 'createdBy'>>({
    name: '',
    categoryId: '',
    unit: 'oz',
    parLevel: 1,
    currentStock: 0
  });

  // Effect to set initial category
  useEffect(() => {
    if (categories.length > 0 && !newItem.categoryId) {
      setNewItem(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories]);

  const liquorItems = items.filter(item => {
    const cat = categories.find(c => c.id === item.categoryId);
    return cat?.type !== 'wine' && cat?.type !== 'soft_drink';
  });

  const wineItems = items.filter(item => {
    const cat = categories.find(c => c.id === item.categoryId);
    return cat?.type === 'wine';
  });

  const getFilteredItems = (baseItems: Item[]) => {
    return baseItems.filter(item => {
      const matchesFilter = filter === 'all' || item.categoryId === filter;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  };

  const filteredLiquor = getFilteredItems(liquorItems);
  const filteredWine = getFilteredItems(wineItems);

  const handleSave = async () => {
    if (!newItem.name || !newItem.categoryId) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (editingItem) {
      await updateItem(editingItem.id, newItem);
      setEditingItem(null);
    } else {
      await addItem(newItem);
    }
    setAddOpen(false);
    setNewItem({ name: '', categoryId: categories[0]?.id || '', unit: 'oz', parLevel: 4, currentStock: 0 });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    await addCategory(newCategoryName);
    setNewCategoryName('');
    toast.success("Category added");
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-slate-500 font-medium">Manage your bar stock and par levels.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 gap-2 h-11" onClick={() => setCategoryOpen(true)}>
            <FolderPlus size={18} />
            Categories
          </Button>
          <Dialog open={isAddOpen || !!editingItem} onOpenChange={(open) => {
            if (!open) {
              setAddOpen(false);
              setEditingItem(null);
            }
          }}>
            <DialogTrigger render={<Button className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 gap-2 h-11" onClick={() => setAddOpen(true)} />}>
              <Plus size={18} />
              Add Item
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-200">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Item Name</Label>
                  <Input 
                    id="name" 
                    value={newItem.name} 
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="bg-slate-950 border-slate-800"
                    placeholder="e.g. Patron Silver"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Category</Label>
                    <Select value={newItem.categoryId} onValueChange={(v) => setNewItem({...newItem, categoryId: v})}>
                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-200">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        {categories.length > 0 ? (
                          categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-xs text-slate-500 text-center">
                            No categories found.
                            <br />
                            Please add a category first.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Unit</Label>
                    <Select value={newItem.unit} onValueChange={(v) => setNewItem({...newItem, unit: v})}>
                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        <SelectItem value="oz">Ounces (oz)</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="shot">Shot</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="par" className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Par Level (Quantity Needed)</Label>
                  <Input 
                    id="par" 
                    type="number" 
                    value={newItem.parLevel}
                    onChange={e => setNewItem({...newItem, parLevel: parseFloat(e.target.value)})}
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Management Dialog */}
      <Dialog open={isCategoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input 
                value={newCategoryName} 
                onChange={e => setNewCategoryName(e.target.value)} 
                placeholder="New Category Name"
                className="bg-slate-950 border-slate-800"
              />
              <Button onClick={handleAddCategory} className="bg-blue-600 font-bold text-xs uppercase px-4"><Plus size={16} /></Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-blue-400" />
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => deleteCategory(cat.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-center text-slate-600 text-xs py-4">No categories added yet.</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={`rounded-full whitespace-nowrap gap-2 font-medium transition-all ${
            filter === 'all' 
            ? 'bg-blue-600 border-blue-600 text-white' 
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search size={16} />
          All Items
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={filter === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat.id)}
            className={`rounded-full whitespace-nowrap gap-2 font-medium transition-all ${
              filter === cat.id 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag size={14} />
            {cat.name}
          </Button>
        ))}
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
        <Input 
          className="pl-12 h-14 rounded-2xl bg-slate-900 border-slate-800 hover:border-slate-700 focus:border-blue-500/50 transition-all font-medium" 
          placeholder="Search items..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="liquor" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-900 border-slate-800 h-12 p-1 rounded-2xl">
            <TabsTrigger value="liquor" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">Beverage Inventory</TabsTrigger>
            <TabsTrigger value="wine" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">Wine Cellar</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="liquor" className="space-y-6 m-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLiquor.map((item) => (
              <InventoryCard 
                key={item.id} 
                item={item} 
                onEdit={() => {
                  setEditingItem(item);
                  setNewItem({
                    name: item.name,
                    categoryId: item.categoryId,
                    unit: item.unit,
                    parLevel: item.parLevel,
                    currentStock: item.currentStock || 0
                  });
                }}
              />
            ))}
          </div>
          {filteredLiquor.length === 0 && (
            <div className="py-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
              <GlassWater size={48} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Beverage Items Found</h3>
              <p className="text-slate-600 text-xs mt-2">Try adjusting your filters or search.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="wine" className="space-y-6 m-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWine.map((item) => (
              <InventoryCard 
                key={item.id} 
                item={item} 
                onEdit={() => {
                  setEditingItem(item);
                  setNewItem({
                    name: item.name,
                    categoryId: item.categoryId,
                    unit: item.unit,
                    parLevel: item.parLevel,
                    currentStock: item.currentStock || 0
                  });
                }}
              />
            ))}
          </div>
          {filteredWine.length === 0 && (
            <div className="py-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
              <Wine size={48} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Wine Cellar is Empty</h3>
              <p className="text-slate-600 text-xs mt-2">Add items with wine-type categories to see them here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const InventoryCard: React.FC<{ item: Item; onEdit: () => void }> = ({ item, onEdit }) => {
  const { categories, deleteItem } = useInventory();

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="rounded-2xl border border-slate-800 hover:border-blue-500/30 bg-slate-900 transition-all group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-6 space-y-0 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-xl transition-colors group-hover:bg-slate-700">
              {categories.find(c => c.id === item.categoryId)?.type === 'wine' ? (
                <Wine size={20} className="text-red-400" />
              ) : (
                <GlassWater size={20} className="text-blue-400" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-200">{item.name}</CardTitle>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{getCategoryName(item.categoryId)}</p>
            </div>
          </div>
          <div className="flex gap-1 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-white" onClick={onEdit}>
              <Edit3 size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-red-400" onClick={() => deleteItem(item.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Quantity</p>
              <p className="text-2xl font-mono font-bold text-blue-400 flex items-baseline gap-1">
                {item.currentStock || 0}
                <span className="text-xs font-medium text-slate-600">{item.unit}</span>
              </p>
            </div>
            {!item.isGlass && (
              <div className="text-right space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Par</p>
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-sm font-mono font-bold text-slate-300">{item.parLevel} <span className="text-xs text-slate-600">{item.unit}</span></p>
                </div>
              </div>
            )}
          </div>
          {!item.isGlass && (
            <>
              <div className="mt-6 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((item.currentStock || 0) / (item.parLevel || 1)) * 100, 100)}%` }}
                  className={`h-full transition-all duration-1000 ${
                    (item.currentStock || 0) < (item.parLevel || 1) * 0.33 
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                    : (item.currentStock || 0) < (item.parLevel || 1) 
                    ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]'
                    : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]'
                  }`} 
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${(item.currentStock || 0) < (item.parLevel || 1) ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${(item.currentStock || 0) < (item.parLevel || 1) ? 'text-red-400' : 'text-green-400'}`}>
                    {(item.currentStock || 0) < (item.parLevel || 1) ? 'Shortage' : 'In Stock'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-600">
                  {Math.round(((item.currentStock || 0) / (item.parLevel || 1)) * 100)}%
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

