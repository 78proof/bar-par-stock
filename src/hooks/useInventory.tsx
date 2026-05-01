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
import { onAuthStateChanged } from 'firebase/auth';
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
    // We listen to auth changes because some rules might depend on it
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

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
    });

    return () => unsubscribeAuth();
  }, []);

  const capitalize = (str: string) => str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

  const addItem = async (item: Omit<Item, 'id' | 'updatedAt' | 'createdBy'>) => {
    try {
      const cleanName = capitalize(item.name);
      
      const docRef = await addDoc(collection(db, 'items'), {
        ...item,
        name: cleanName,
        currentStock: item.currentStock || 0,
        parLevel: item.parLevel || 0,
        isGlass: item.isGlass || false,
        mlSize: item.mlSize || 750, // Default bottle size
        createdBy: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
      });

      // Auto-pairing logic: If we add a glass, ensure a bottle exists. If we add a bottle, ensure a glass exists.
      const pairSuffix = item.isGlass ? "" : " (Glass)";
      const oppositeName = item.isGlass 
        ? (cleanName.toLowerCase().endsWith(" (glass)") ? cleanName.slice(0, -8) : cleanName)
        : `${cleanName} (Glass)`;
      
      const existingPair = items.find(i => i.name.toLowerCase() === oppositeName.toLowerCase());
      
      if (!existingPair && !cleanName.toLowerCase().includes("mix") && !cleanName.toLowerCase().includes("juice")) {
        // Create the missing pair
        await addDoc(collection(db, 'items'), {
          name: oppositeName,
          categoryId: item.categoryId,
          unit: item.isGlass ? 'ml' : 'oz',
          parLevel: 0,
          currentStock: 0,
          isGlass: !item.isGlass,
          mlSize: item.mlSize || 750,
          targetBottleId: item.isGlass ? "" : docRef.id,
          createdBy: auth.currentUser?.uid,
          updatedAt: serverTimestamp(),
        });
      }

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
      const existingItem = items.find(i => i.name.toLowerCase() === recipe.name.toLowerCase());
      if (!existingItem) {
        await addItem({
          name: recipe.name,
          categoryId: recipe.categoryId || '',
          unit: 'oz',
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
        // Logic for stock adjustment
        if (log.type === 'count') newStock = log.quantity;
        else if (log.type === 'sales') {
          newStock = log.quantity;
        }
        else if (log.type === 'delivery') newStock += log.quantity;
        else if (log.type === 'usage') newStock -= log.quantity;
        
        await updateDoc(doc(db, 'items', log.itemId), { 
          currentStock: newStock, 
          updatedAt: serverTimestamp() 
        });

        // Automatic Recipe & Bottle Deduction
        if (log.type === 'sales' && log.quantity > 0) {
          // 1. Check for specific recipe deductions
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

          // 2. Cross-unit Bottle Deduction (oz sold -> ml bottle)
          // If this is a glass item, try to find the bottle item
          const parentName = item.name.toLowerCase().endsWith(" (glass)") 
            ? item.name.slice(0, -8) 
            : item.name;
          
          const bottleItem = items.find(i => 
            !i.isGlass && 
            (i.id === item.targetBottleId || i.name.toLowerCase() === parentName.toLowerCase())
          );

          if (bottleItem) {
            // Conversion: 1 oz of glass sales typically equals some amount of bottle usage
            // 2 oz per glass is standard, but since 'quantity' in sales log is glasses sold, 
            // we assume the sale is 'quantity' units of 'item.unit'.
            // If item.unit is 'oz', a sale of 2 units means 2 oz.
            
            const ozSold = log.quantity; 
            const mlUsage = ozSold * 29.57; // 1 oz = 29.57 ml
            
            await addLog({
              itemId: bottleItem.id,
              quantity: parseFloat(mlUsage.toFixed(2)),
              type: 'usage',
              date: log.date,
              notes: `Auto Deduction (Glass Sale): ${item.name}`
            });
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
          // Note: count/sales deletions are tricky to auto-reverse without historical snapshots
          
          await updateDoc(doc(db, 'items', log.itemId), { 
            currentStock: Math.max(0, newStock), 
            updatedAt: serverTimestamp() 
          });
        }
        await deleteDoc(doc(db, 'inventoryLogs', id));
      }
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
