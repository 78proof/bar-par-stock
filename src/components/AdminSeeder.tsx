import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Button } from './ui/button';
import { salesData } from '../data/initialData';
import { toast } from 'sonner';
import { Database, Loader2, CheckCircle2 } from 'lucide-react';
import { Category } from '../types';

export const AdminSeeder: React.FC = () => {
  const { categories, items, recipes, addCategory, addItem, addRecipe, updateCategory, deleteItem, deleteCategory, deleteRecipe } = useInventory();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const runSeed = async () => {
    setLoading(true);
    try {
      // 1. Wipe everything sequentially to avoid "Category has items" errors
      toast.info("Clearing items...");
      for (const item of items) await deleteItem(item.id);
      
      toast.info("Clearing recipes...");
      for (const rec of recipes) await deleteRecipe(rec.id);
      
      toast.info("Clearing categories...");
      for (const cat of categories) await deleteCategory(cat.id);

      // 2. Define our core structure
      const alcGroups = ['WHISKY', 'GIN', 'VODKA', 'TEQUILA', 'RUM', 'COGNAC', 'LIQUR', 'LIQUEUR', 'BOURBON', 'COGNAC/BRANDY', 'BEER'];
      const wineGroups = ['W/W GLASS', 'W/W NEW ZEALAND', 'W/W TRENTINO', 'CHAMPAGNE GLASS', 'CHAMPAGNE MEZ', 'R/W GLASS', 'ROSE/W GLASS'];
      
      const categoryMap: Record<string, string> = {};
      
      // Get unique category names from raw data
      const rawCategories = Array.from(new Set(salesData.map(s => s.categoryName)));

      toast.info("Building new category architecture...");
      for (const catName of rawCategories) {
        const lowerCat = catName.toLowerCase();
        const isWine = lowerCat.includes('wine') || lowerCat.includes('champagne');
        const isSoft = lowerCat.includes('soft') || lowerCat.includes('water') || lowerCat.includes('juice');
        const type: Category['type'] = isWine ? 'wine' : (isSoft ? 'soft_drink' : 'spirit');

        if (type === 'spirit' || type === 'wine') {
          categoryMap[`${catName} (Glass)`] = await addCategory(`${catName} (Glass)`, type);
          categoryMap[`${catName} (Bottle)`] = await addCategory(`${catName} (Bottle)`, type);
        } else {
          categoryMap[catName] = await addCategory(catName, type);
        }
      }

      toast.info("Seeding mirrored inventory items...");
      for (const sale of salesData) {
        const lowerCat = sale.categoryName.toLowerCase();
        const lowerGroup = sale.group.toLowerCase();
        
        const isWine = lowerCat.includes('wine') || lowerCat.includes('champagne') || lowerGroup.includes('wine') || lowerGroup.includes('champagne');
        const isSoft = lowerCat.includes('soft') || lowerCat.includes('water') || lowerCat.includes('juice') || lowerCat.includes('mixer');
        const isSpirit = !isWine && !isSoft;

        let baseName = sale.name
          .replace(/ BTL$/i, '')
          .replace(/^G\./i, '')
          .replace(/ \(GLASS\)$/i, '')
          .replace(/ \(BOTTLE\)$/i, '')
          .trim();

        if (isSpirit || isWine) {
          const type: 'spirit' | 'wine' = isWine ? 'wine' : 'spirit';
          
          // 1. Add Glass version
          const glassName = `${baseName} (Glass)`;
          const glassCatId = categoryMap[`${sale.categoryName} (Glass)`];
          if (glassCatId) {
            await addItem({
              name: glassName,
              categoryId: glassCatId,
              unit: isWine ? 'glass' : 'oz',
              isGlass: true,
              type: type,
              parLevel: 0, // ready for user to fill
              currentStock: 0
            });
            // Recipe shell
            await addRecipe({
              name: glassName,
              categoryId: glassCatId,
              ingredients: []
            });
          }

          // 2. Add Bottle version
          const bottleName = `${baseName} (Bottle)`;
          const bottleCatId = categoryMap[`${sale.categoryName} (Bottle)`];
          if (bottleCatId) {
            await addItem({
              name: bottleName,
              categoryId: bottleCatId,
              unit: 'bottle',
              isGlass: false,
              type: type,
              parLevel: 0, // ready for user to fill
              currentStock: 0
            });
          }
        } else {
          // Soft drinks
          const catId = categoryMap[sale.categoryName];
          if (catId) {
            await addItem({
              name: sale.name,
              categoryId: catId,
              unit: 'piece',
              isGlass: false,
              type: 'soft_drink',
              parLevel: 0, 
              currentStock: 0
            });
          }
        }
      }

      setCompleted(true);
      toast.success("Cleanup and re-seed successful. All par levels at 0.");
    } catch (e) {
      console.error(e);
      toast.error("Process failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-green-400 font-bold p-2 bg-green-400/10 rounded-xl">
        <CheckCircle2 size={16} />
        Database Seeded
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/20 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
          <Database size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-200">System Seeder</h3>
          <p className="text-xs text-slate-500">Import initial sales mix items and categories.</p>
        </div>
      </div>
      <Button 
        onClick={runSeed} 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-11"
      >
        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {loading ? 'Seeding...' : 'Run Initial Seed'}
      </Button>
      <p className="text-[10px] text-slate-600 text-center">
        This will create ~100 items and categories from your report.
      </p>
    </div>
  );
};
