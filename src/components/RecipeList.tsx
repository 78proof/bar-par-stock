import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  GlassWater,
  PlusCircle,
  X,
  FolderPlus,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from './ui/dialog';
import { Label } from './ui/label';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectLabel, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Recipe, Ingredient, Item } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const RecipeList: React.FC = () => {
  const { recipes, items, addRecipe, updateRecipe, deleteRecipe, categories, addCategory, deleteCategory } = useInventory();
  const [search, setSearch] = useState('');
  const [isAddOpen, setAddOpen] = useState(false);
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);

  const [newRecipe, setNewRecipe] = useState<Omit<Recipe, 'id' | 'updatedAt' | 'createdBy'>>({
    name: '',
    categoryId: '',
    ingredients: [{ itemId: '', amount: 0, unit: 'oz' }]
  });

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, { itemId: '', amount: 0, unit: 'oz' }]
    });
  };

  const handleRemoveIngredient = (index: number) => {
    const nextIds = [...newRecipe.ingredients];
    nextIds.splice(index, 1);
    setNewRecipe({ ...newRecipe, ingredients: nextIds });
  };

  const handleIngredientChange = (index: number, key: keyof Ingredient, value: string | number) => {
    const nextIngredients = [...newRecipe.ingredients];
    nextIngredients[index] = { ...nextIngredients[index], [key]: value };
    
    // If itemId changed, default to oz for recipes unless user changes it
    if (key === 'itemId') {
      nextIngredients[index].unit = 'oz';
    }
    
    setNewRecipe({ ...newRecipe, ingredients: nextIngredients });
  };

  const handleSave = async () => {
    // Basic validation
    if (!newRecipe.name || newRecipe.ingredients.some(ing => !ing.itemId || ing.amount <= 0)) {
      toast.error("Please fill all fields with valid data");
      return;
    }

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, {
          ...newRecipe,
          categoryId: newRecipe.categoryId || 'uncategorized'
        });
        toast.success("Build SOP Updated");
        setEditingRecipe(null);
      } else {
        await addRecipe({
          ...newRecipe,
          categoryId: newRecipe.categoryId || 'uncategorized'
        });
        toast.success("New SOP Committed to Library");
      }
      setAddOpen(false);
      setNewRecipe({ 
        name: '', 
        categoryId: '', 
        ingredients: [{ itemId: '', amount: 0, unit: 'oz' }]
      });
    } catch (e) {
      console.error(e);
      toast.error("Cloud Error: Could not save SOP");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    await addCategory(newCategoryName);
    setNewCategoryName('');
    toast.success("Category added");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cocktail Library</h1>
          <p className="text-slate-500 font-medium">Standardized SOPs and ingredient builds.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-border bg-card text-muted-foreground hover:text-foreground gap-2 h-11" onClick={() => setCategoryOpen(true)}>
            <FolderPlus size={18} />
            Categories
          </Button>
          <Dialog open={isAddOpen || !!editingRecipe} onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false);
            setEditingRecipe(null);
          }
        }}>
          <DialogTrigger render={<Button className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 gap-2 h-11" onClick={() => setAddOpen(true)} />}>
            <PlusCircle size={18} />
            New Recipe
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {editingRecipe ? 'Modify SOP' : 'Create New SOP'}
                {editingRecipe && <span className="text-slate-500 font-normal text-sm">/ {editingRecipe.name}</span>}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
              <div className="lg:col-span-4 space-y-6">
                <div className="p-4 bg-slate-800/20 rounded-2xl border border-slate-800 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Cocktail Name</Label>
                    <Input 
                      id="name" 
                      value={newRecipe.name} 
                      onChange={e => setNewRecipe({...newRecipe, name: e.target.value})}
                      className="bg-slate-950 border-slate-800 h-11"
                      placeholder="e.g. Ardbeg Sour"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Menu Category</Label>
                    <div className="relative">
                      <button 
                        onClick={() => setCategorySelectorOpen(!isCategorySelectorOpen)}
                        className="w-full flex items-center justify-between px-3 h-11 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 transition-colors text-sm"
                      >
                        <span className={newRecipe.categoryId ? "text-slate-200" : "text-slate-500"}>
                          {categories.find(c => c.id === newRecipe.categoryId)?.name || "Select Category"}
                        </span>
                        <Search size={14} className="text-slate-500" />
                      </button>

                      {isCategorySelectorOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setCategorySelectorOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
                            <div className="p-2 border-b border-slate-800 bg-slate-950/50">
                              <Input 
                                autoFocus
                                placeholder="Search categories..."
                                value={categorySearch}
                                onChange={e => setCategorySearch(e.target.value)}
                                className="h-8 bg-slate-950 border-slate-800 text-xs"
                              />
                            </div>
                            <div className="overflow-y-auto p-1 custom-scrollbar">
                              {categories
                                .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                .map(cat => (
                                  <button
                                    key={cat.id}
                                    onClick={() => {
                                      setNewRecipe({...newRecipe, categoryId: cat.id});
                                      setCategorySelectorOpen(false);
                                      setCategorySearch('');
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-2 rounded-lg text-xs transition-all",
                                      newRecipe.categoryId === cat.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                                    )}
                                  >
                                    {cat.name}
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Build Components (SOP Ingredients)</Label>
                  <span className="text-[10px] text-blue-400 font-mono">Standardized in OZ</span>
                </div>
                
                <div className="space-y-3">
                  {newRecipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-3 items-center p-3 bg-slate-950 rounded-2xl border border-slate-800 group transition-all hover:border-slate-700">
                      <div className="flex-1">
                        <IngredientSearch 
                          items={items} 
                          categories={categories}
                          value={ing.itemId} 
                          onSelect={(v) => handleIngredientChange(idx, 'itemId', v)} 
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                        <Input 
                          type="number" 
                          value={ing.amount === 0 ? '' : ing.amount} 
                          onChange={e => {
                            const val = e.target.value;
                            handleIngredientChange(idx, 'amount', val === '' ? 0 : parseFloat(val));
                          }}
                          className="bg-transparent border-none text-right font-mono text-blue-400 h-8 w-14 p-0 focus-visible:ring-0"
                        />
                        <select 
                          value={ing.unit} 
                          onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
                          className="bg-transparent border-none text-[10px] font-bold text-slate-500 uppercase focus:ring-0 cursor-pointer"
                        >
                          <option value="oz">oz</option>
                          <option value="bottle">btl</option>
                          <option value="ml">ml</option>
                          <option value="shot">shot</option>
                        </select>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-600 hover:text-red-400 h-10 w-10 shrink-0"
                        onClick={() => handleRemoveIngredient(idx)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full h-12 border border-dashed border-slate-800 gap-2 rounded-2xl text-blue-400 hover:bg-blue-400/5 hover:border-blue-400/30 transition-all font-bold" onClick={handleAddIngredient}>
                    <Plus size={18} /> Add Component
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-8 border-t border-slate-800 pt-6">
              <Button onClick={handleSave} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-lg shadow-xl shadow-blue-900/20">
                {editingRecipe ? 'Update SOP' : 'Commit to SOP Library'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <Dialog open={isCategoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle>Manage SOP Categories</DialogTitle>
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

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
        <Input 
          className="pl-12 h-14 rounded-2xl bg-card border-border hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-500/50 transition-all font-medium" 
          placeholder="Search recipes..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="rounded-3xl border border-border bg-card overflow-hidden group hover:border-blue-500/30 transition-all shadow-sm">
              <CardHeader className="bg-secondary/30 p-6">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-card border border-border rounded-2xl flex items-center justify-center text-2xl group-hover:bg-secondary transition-all">
                    🍸
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => {
                      setEditingRecipe(recipe);
                      setNewRecipe({
                        name: recipe.name,
                        categoryId: recipe.categoryId || '',
                        ingredients: recipe.ingredients
                      });
                    }}>
                      <Edit3 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500" onClick={() => deleteRecipe(recipe.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl font-bold text-foreground">{recipe.name}</CardTitle>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 italic">
                  {categories.find(c => c.id === recipe.categoryId)?.name || 'House Standard'}
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-0 mt-6 text-foreground">
                <div className="space-y-4">
                   <div className="space-y-2">
                    {recipe.ingredients.map((ing, idx) => {
                      const item = items.find(i => i.id === ing.itemId);
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-secondary/50 border border-border/50 rounded-xl group/item hover:border-blue-500/20 transition-colors">
                          <span className="text-sm font-medium text-muted-foreground group-hover/item:text-foreground">{item?.name || 'Unknown Item'}</span>
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                            {ing.amount} <span className="text-muted-foreground text-[10px] uppercase">{ing.unit}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Validated Build</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Glass Vol</p>
                      <p className="text-sm font-mono font-bold text-foreground opacity-70">
                        {recipe.ingredients.reduce((acc, curr) => acc + curr.amount, 0)} {recipe.ingredients[0]?.unit || 'OZ'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const IngredientSearch = ({ items, categories, value, onSelect }: { items: Item[], categories: any[], value: string, onSelect: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = items.find(i => i.id === value);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    categories.find(c => c.id === i.categoryId)?.name.toLowerCase().includes(search.toLowerCase())
  );

  const uncategorizedItems = filteredItems.filter(i => !categories.find(c => c.id === i.categoryId));

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors text-sm"
      >
        <span className={selectedItem ? "text-slate-200 font-medium" : "text-slate-500"}>
          {selectedItem?.name || "Search Spirit / Component..."}
        </span>
        <Search size={14} className="text-slate-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-80 flex flex-col">
            <div className="p-3 border-b border-slate-800 bg-slate-950/50">
              <Input 
                autoFocus
                placeholder="Type to search spirits..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 bg-slate-950 border-slate-800 rounded-xl focus-visible:ring-blue-500/30"
              />
            </div>
            <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {categories.map(cat => {
                const catItems = filteredItems.filter(i => i.categoryId === cat.id);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-800/10 rounded-lg">
                      {cat.name}
                    </div>
                    {catItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelect(item.id);
                          setOpen(false);
                          setSearch('');
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between group",
                          value === item.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        )}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{item.name}</span>
                          {!item.isGlass && item.mlSize && (
                            <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                              {item.mlSize}ml Bottle
                            </span>
                          )}
                        </div>
                        {item.isGlass && <GlassWater size={12} className="text-blue-400 group-hover:text-blue-300" />}
                      </button>
                    ))}
                  </div>
                );
              })}

              {uncategorizedItems.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-800/10 rounded-lg">
                    Other Components
                  </div>
                  {uncategorizedItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelect(item.id);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between group",
                        value === item.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      )}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.name}</span>
                        {!item.isGlass && item.mlSize && (
                          <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                            {item.mlSize}ml Bottle
                          </span>
                        )}
                      </div>
                      {item.isGlass && <GlassWater size={12} className="text-blue-400 group-hover:text-blue-300" />}
                    </button>
                  ))}
                </div>
              )}

              {filteredItems.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  No components found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
