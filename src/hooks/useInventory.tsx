import React, { createContext, useContext, useEffect, useState } from 'react';
import { Item, Recipe, InventoryLog, Category } from '../types';

interface InventoryContextType {
  items: Item[];
  recipes: Recipe[];
  logs: InventoryLog[];
  categories: Category[];
  loading: boolean;
  dbError: string | null;
  addItem: (item: Omit<Item, 'id' | 'updatedAt' | 'createdBy'>) => Promise<string>;
  updateItem: (id: string, data: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'updatedAt' | 'createdBy'>) => Promise<string>;
  updateRecipe: (id: string, data: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  addCategory: (name: string, type?: Category['type']) => Promise<string>;
  updateCategory: (id: string, name: string, type?: Category['type']) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addLog: (log: Omit<InventoryLog, 'id' | 'createdAt' | 'createdBy'>) => Promise<string | undefined>;
  updateLog: (id: string, data: Partial<InventoryLog>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [itemsRes, catRes, recRes, logsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/categories'),
        fetch('/api/recipes'),
        fetch('/api/logs')
      ]);
      setItems(await itemsRes.json());
      setCategories(await catRes.json());
      setRecipes(await recRes.json());
      setLogs(await logsRes.json());
      setLoading(false);
    } catch (e) {
      console.error("Failed to fetch inventory data:", e);
      setDbError("Failed to fetch data from server.");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const addItem = async (item: any) => {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    fetchData();
    return data.id;
  };

  const updateItem = async (id: string, data: any) => {
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchData();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addCategory = async (name: string, type?: string) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    });
    const data = await res.json();
    fetchData();
    return data.id;
  };

  const updateCategory = async (id: string, name: string, type?: string) => {
    await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    });
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addRecipe = async (recipe: any) => {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe)
    });
    const data = await res.json();
    fetchData();
    return data.id;
  };

  const updateRecipe = async (id: string, data: any) => {
    await fetch(`/api/recipes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchData();
  };

  const deleteRecipe = async (id: string) => {
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addLog = async (log: any) => {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    const data = await res.json();
    fetchData();
    return data.id;
  };

  const updateLog = async (id: string, data: any) => {
    await fetch(`/api/logs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    fetchData();
  };

  const deleteLog = async (id: string) => {
    await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <InventoryContext.Provider value={{
      items, recipes, logs, categories, loading, dbError,
      addItem, updateItem, deleteItem,
      addRecipe, updateRecipe, deleteRecipe,
      addCategory, updateCategory, deleteCategory,
      addLog, updateLog, deleteLog
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
