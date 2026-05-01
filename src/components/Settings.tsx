import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  FolderPlus, 
  Trash2, 
  Settings as SettingsIcon,
  Save,
  Check,
  ChevronRight,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  const { categories, addCategory, deleteCategory } = useInventory();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      await addCategory(trimmed);
      setNewCategoryName('');
      toast.success(`Category "${trimmed}" created`);
    } catch (e) {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (isDeleting !== id) {
      setIsDeleting(id);
      setTimeout(() => setIsDeleting(null), 3000);
      return;
    }

    try {
      await deleteCategory(id);
      toast.success(`Category "${name}" deleted`);
      setIsDeleting(null);
    } catch (e) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium whitespace-pre-line">Manage your app configuration and master data.</p>
      </div>

      <div className="grid gap-6">
        {/* Category Management */}
        <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 rounded-xl">
                <FolderPlus className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold">Categories</h3>
                <p className="text-xs text-slate-500">Manage beverage classifications</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input 
                  placeholder="New category name..." 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
              </div>
              <Button 
                onClick={handleAddCategory}
                className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={18} />
                Add
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-transparent hover:border-border transition-all group"
                >
                  <span className="font-medium text-sm">{cat.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-colors",
                      isDeleting === cat.id ? "bg-red-500 text-white hover:bg-red-600" : "text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isDeleting === cat.id ? <Check size={14} /> : <Trash2 size={14} />}
                  </Button>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500 italic text-sm">
                  No categories found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cloud Status */}
        <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl">
              <Database className="text-green-500" size={24} />
            </div>
            <div>
              <h3 className="font-bold">Cloud Synced</h3>
              <p className="text-sm text-slate-500">Your data is securely stored in your Firestore database.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Plus: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

import { cn } from '../lib/utils';
