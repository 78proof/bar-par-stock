import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  where,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Item, Recipe, InventoryLog, OperationType, Category } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

interface InventoryContextType {
  items: Item[];
  recipes: Recipe[];
  logs: InventoryLog[];
  categories: Category[];
  loading: boolean;
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

  useEffect(() => {
    if (!auth.currentUser) return;

    const itemsQuery = query(collection(db, 'items'), orderBy('name'));
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'items'));

    const categoriesQuery = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const recipesQuery = query(collection(db, 'recipes'), orderBy('name'));
    const unsubscribeRecipes = onSnapshot(recipesQuery, (snapshot) => {
      setRecipes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recipes'));

    const logsQuery = query(collection(db, 'inventoryLogs'), orderBy('createdAt', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryLog)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventoryLogs'));

    return () => {
      unsubscribeItems();
      unsubscribeCategories();
      unsubscribeRecipes();
      unsubscribeLogs();
    };
  }, [auth.currentUser]);

  const addItem = async (item: Omit<Item, 'id' | 'updatedAt' | 'createdBy'>) => {
    try {
      const docRef = await addDoc(collection(db, 'items'), {
        ...item,
        currentStock: item.currentStock || 0,
        parLevel: item.parLevel || 0,
        isGlass: item.isGlass || false,
        createdBy: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'items');
      throw error;
    }
  };

  const updateItem = async (id: string, data: Partial<Item>) => {
    try {
      await updateDoc(doc(db, 'items', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `items/${id}`);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'items', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `items/${id}`);
    }
  };

  const addCategory = async (name: string, type?: Category['type']) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name,
        type: type || 'other',
        createdBy: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
      throw error;
    }
  };

  const updateCategory = async (id: string, name: string, type?: Category['type']) => {
    try {
      await updateDoc(doc(db, 'categories', id), {
        name,
        ...(type && { type }),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'updatedAt' | 'createdBy'>) => {
    try {
      const docRef = await addDoc(collection(db, 'recipes'), {
        ...recipe,
        createdBy: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
      });

      // Automatically create a Glass item for this recipe if it doesn't exist
      // This ensures it shows up in "Par Cutting" for sales entry
      const existingItem = items.find(i => i.name.toLowerCase() === recipe.name.toLowerCase());
      if (!existingItem) {
        await addItem({
          name: recipe.name,
          categoryId: recipe.categoryId || '',
          unit: 'oz', // Standard for cocktail counts
          parLevel: 0,
          currentStock: 0,
          isGlass: true
        });
      }

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'recipes');
      throw error;
    }
  };

  const updateRecipe = async (id: string, data: Partial<Recipe>) => {
    try {
      await updateDoc(doc(db, 'recipes', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recipes/${id}`);
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recipes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recipes/${id}`);
    }
  };

  const addLog = async (log: Omit<InventoryLog, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      const logData = {
        ...log,
        createdBy: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      };
      const logRef = await addDoc(collection(db, 'inventoryLogs'), logData);
      
      const item = items.find(i => i.id === log.itemId);
      if (item) {
        let newStock = item.currentStock || 0;
        if (log.type === 'count' || log.type === 'sales') newStock = log.quantity;
        else if (log.type === 'delivery') newStock += log.quantity;
        else if (log.type === 'usage') newStock -= log.quantity;
        
        await updateDoc(doc(db, 'items', log.itemId), { 
          currentStock: newStock, 
          updatedAt: serverTimestamp() 
        });

        // Automatic Recipe Deduction
        if (log.type === 'sales' && log.quantity > 0) {
          const recipe = recipes.find(r => r.name.toLowerCase() === item.name.toLowerCase());
          if (recipe) {
            for (const ing of recipe.ingredients) {
              const usageAmount = ing.amount * log.quantity;
              await addLog({
                itemId: ing.itemId,
                quantity: usageAmount,
                type: 'usage',
                date: log.date,
                notes: `Deduction: ${item.name} x${log.quantity}`
              });
            }
          }
        }
      }
      return logRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inventoryLogs');
    }
  };

  const updateLog = async (id: string, data: Partial<InventoryLog>) => {
    try {
      // NOTE: Simple update for now. Does not auto-recalculate stock if quantity changes.
      // For accurate inventory, user should delete and re-add.
      await updateDoc(doc(db, 'inventoryLogs', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventoryLogs/${id}`);
    }
  };

  const deleteLog = async (id: string) => {
    try {
      const log = logs.find(l => l.id === id);
      if (log) {
        const item = items.find(i => i.id === log.itemId);
        if (item) {
          let newStock = item.currentStock || 0;
          if (log.type === 'delivery') newStock -= log.quantity;
          else if (log.type === 'usage') newStock += log.quantity;
          // 'count' and 'sales' are absolute points in time; deleting them 
          // doesn't automatically reveal the "previous" stock easily.
          
          await updateDoc(doc(db, 'items', log.itemId), { 
            currentStock: Math.max(0, newStock), 
            updatedAt: serverTimestamp() 
          });
        }
      }
      await deleteDoc(doc(db, 'inventoryLogs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventoryLogs/${id}`);
    }
  };

  return (
    <InventoryContext.Provider value={{
      items, recipes, logs, categories, loading,
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
