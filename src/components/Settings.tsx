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
  Database,
  AlertCircle,
  Copy,
  ExternalLink,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const { categories, addCategory, deleteCategory, dbError, loading } = useInventory();
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium">Manage your app configuration and master data.</p>
      </div>

      <div className="grid gap-6">
        {/* Connection Debug Info */}
        {dbError && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle size={24} />
              <h3 className="font-bold text-lg">Firebase Connection Failed</h3>
            </div>
            <p className="text-sm text-slate-400">
              It looks like your Vercel/Production environment is missing information. 
              To fix this, you must add these <strong>Environment Variables</strong> in your Vercel dashboard:
            </p>
            
            <div className="grid gap-3">
              {[
                "VITE_FIREBASE_API_KEY",
                "VITE_FIREBASE_AUTH_DOMAIN",
                "VITE_FIREBASE_PROJECT_ID",
                "VITE_FIREBASE_STORAGE_BUCKET",
                "VITE_FIREBASE_MESSAGING_SENDER_ID",
                "VITE_FIREBASE_APP_ID",
                "VITE_FIREBASE_DATABASE_ID"
              ].map(v => (
                <div key={v} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <code className="text-xs text-blue-400">{v}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800" onClick={() => copyToClipboard(v)}>
                    <Copy size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-500">Where to find these?</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check the <strong>firebase-applet-config.json</strong> file in your project files (in the sidebar here) or go to 
                <strong> Firebase Console &gt; Project Settings &gt; General &gt; Your Apps</strong>.
              </p>
            </div>
          </div>
        )}

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
                  className="rounded-xl h-11"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
              </div>
              <Button 
                onClick={handleAddCategory}
                className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-lg shadow-blue-600/20"
              >
                <Plus size={18} />
                Add
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className="flex items-center justify-between p-3 px-4 rounded-xl bg-secondary/30 border border-transparent hover:border-border transition-all group"
                >
                  <span className="font-medium text-sm">{cat.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      isDeleting === cat.id ? "bg-red-500 text-white hover:bg-red-600 scale-110 shadow-lg shadow-red-500/20" : "text-slate-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isDeleting === cat.id ? <Check size={14} /> : <Trash2 size={14} />}
                  </Button>
                </div>
              ))}
              {categories.length === 0 && !loading && (
                <div className="col-span-full py-12 text-center text-slate-500 italic text-sm border-2 border-dashed border-slate-800 rounded-2xl">
                  No categories found. Add one above to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cloud Status */}
        {!dbError && (
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
              <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider text-nowrap">Active Online</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

