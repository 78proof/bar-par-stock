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
  Timestamp,
  increment
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Item, Recipe, InventoryLog, OperationType, Category } from '../types';
import { handleFirestoreError, sanitizeData, getCurrentUserId } from '../lib/firestoreUtils';

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

  useEffect(() => {
    if (!db) {
      console.warn("InventoryProvider: Database not initialized. Skipping listeners.");
      setDbError("Firebase configuration is missing or incomplete. Check your environment variables.");
      setLoading(false);
      return;
    }

    setDbError(null);
    // Start syncing immediately since rules are public
    const itemsQuery = query(collection(db, 'items'), orderBy('name'));
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Items sync error:", error);
      setLoading(false);
    });

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
  }, []);

  const capitalize = (str: string) => str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

  const addItem = async (item: Omit<Item, 'id' | 'updatedAt' | 'createdBy'>) => {
    if (!db) {
      alert("Database not connected. Please ensure you have added your Vercel Environment Variables (starting with VITE_FIREBASE_).");
      return "";
    }
    try {
      const cleanName = capitalize(item.name);
      
      const uid = getCurrentUserId();

      const payload = sanitizeData({
        ...item,
        name: cleanName,
        currentStock: item.currentStock || 0,
        parLevel: item.parLevel || 0,
        isGlass: item.isGlass || false,
        mlSize: item.mlSize || 750, 
        createdBy: uid,
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(collection(db, 'items'), payload);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'items');
      throw error;
    }
  };

  const updateItem = async (id: string, data: Partial<Item>) => {
    try {
      const updateData = sanitizeData({
        ...data,
        updatedAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, 'items', id), updateData);
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
    if (!db) return "";
    try {
      const uid = getCurrentUserId();
      
      const payload = sanitizeData({
        name,
        type: type || 'other',
        createdBy: uid,
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(collection(db, 'categories'), payload);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
      throw error;
    }
  };

  const updateCategory = async (id: string, name: string, type?: Category['type']) => {
    try {
      const updateData = sanitizeData({
        name,
        type: type || 'other',
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'categories', id), updateData);
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
    if (!db) return "";
    try {
      const uid = getCurrentUserId();

      const payload = sanitizeData({
        ...recipe,
        createdBy: uid,
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(collection(db, 'recipes'), payload);

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
      const updateData = sanitizeData({
        ...data,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'recipes', id), updateData);
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
    if (!db) return;
    try {
      const uid = getCurrentUserId();

      const payload = sanitizeData({
        ...log,
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const logRef = await addDoc(collection(db, 'inventoryLogs'), payload);
      
      const item = items.find(i => i.id === log.itemId);
      if (item) {
        let stockChange = 0;
        if (log.type === 'count') {
          // For 'count', we still have to set the absolute value
          await updateDoc(doc(db, 'items', log.itemId), sanitizeData({ 
            currentStock: log.quantity, 
            updatedAt: serverTimestamp() 
          }));
        } else {
          if (log.type === 'delivery') stockChange = log.quantity;
          else if (log.type === 'usage' || log.type === 'sales') stockChange = -log.quantity;
          
          if (stockChange !== 0) {
            await updateDoc(doc(db, 'items', log.itemId), sanitizeData({ 
              currentStock: increment(stockChange), 
              updatedAt: serverTimestamp() 
            }));
          }
        }

        // Automatic Recipe & Bottle Deduction (Interconnectivity)
        if ((log.type === 'sales' || (log.type === 'usage' && log.notes?.includes('Deduction'))) && log.quantity > 0) {
          // 1. Recipe Ingredient Deductions
          if (!log.notes?.includes('Recursive')) {
            const recipe = recipes.find(r => r.name.toLowerCase() === item.name.toLowerCase());
            if (recipe) {
              for (const ing of recipe.ingredients) {
                const targetItem = items.find(i => i.id === ing.itemId);
                let quantityToDeduct = ing.amount * log.quantity;

                if (targetItem && (targetItem.unit === 'bottle' || targetItem.unit === 'btl')) {
                  const conversionFactor = 29.57; // 1 oz = 29.57 ml
                  const mlUsage = ing.amount * conversionFactor * log.quantity;
                  const bottleSize = targetItem.mlSize || 750;
                  quantityToDeduct = mlUsage / bottleSize;
                }

                await addLog({
                  itemId: ing.itemId,
                  quantity: parseFloat(quantityToDeduct.toFixed(4)),
                  type: 'usage',
                  date: log.date,
                  notes: `Recursive Deduction: ${recipe.name} [Parent: ${logRef.id}]`
                });
              }
            }
          }

          // 2. Glass to Bottle Conversion (oz -> ml)
          if (item.isGlass && !log.notes?.includes('Bottle Deduction')) {
            const bottleItem = items.find(i => 
              (!i.isGlass && i.id === item.targetBottleId) || 
              (!i.isGlass && i.name.toLowerCase() === item.name.toLowerCase().replace(' (glass)', '').trim())
            );

            if (bottleItem) {
              const conversionFactor = 29.57; // 1 oz = 29.57 ml
              const mlUsage = log.quantity * conversionFactor;
              
              // If the bottle item is tracked in ml, we deduct ml.
              // If it's tracked in bottles, we deduct (ml / size).
              let quantityToDeduct = mlUsage;
              if (bottleItem.unit === 'bottle' || bottleItem.unit === 'btl') {
                const bottleSize = bottleItem.mlSize || 750;
                quantityToDeduct = mlUsage / bottleSize;
              }

              await addLog({
                itemId: bottleItem.id,
                quantity: parseFloat(quantityToDeduct.toFixed(4)),
                type: 'usage',
                date: log.date,
                notes: `Bottle Deduction (from Sale: ${item.name}) [Parent: ${logRef.id}]`
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
      const existingLog = logs.find(l => l.id === id);
      if (!existingLog) return;

      const item = items.find(i => i.id === existingLog.itemId);
      if (item && data.quantity !== undefined && data.quantity !== existingLog.quantity) {
        const diff = data.quantity - existingLog.quantity;
        
        if (existingLog.type === 'count') {
          await updateDoc(doc(db, 'items', item.id), sanitizeData({
            currentStock: data.quantity,
            updatedAt: serverTimestamp()
          }));
        } else {
          let stockAdjustment = 0;
          if (existingLog.type === 'delivery') stockAdjustment = diff;
          else if (existingLog.type === 'usage' || existingLog.type === 'sales') stockAdjustment = -diff;

          if (stockAdjustment !== 0) {
            await updateDoc(doc(db, 'items', item.id), sanitizeData({
              currentStock: increment(stockAdjustment),
              updatedAt: serverTimestamp()
            }));
          }
        }

        // RECURSIVE UPDATE: If this was a sales log, update all related deductions (ingredients, bottles)
        if (existingLog.type === 'sales' && !existingLog.notes?.includes('Recursive')) {
          // Identify children using the unique Parent tag
          const parentTag = `[Parent: ${id}]`;
          const childLogs = logs.filter(l => l.notes?.includes(parentTag));
          
          for (const child of childLogs) {
            // Calculate ratio based on originally recorded values
            // Use 1 as fallback to prevent NaN if original quantity was 0
            const originalParentQty = existingLog.quantity || 1;
            const ratio = child.quantity / originalParentQty;
            const newChildQty = parseFloat((data.quantity * ratio).toFixed(2));
            
            // We use updateLog recursively - it will handle stock adjustments for the children too!
            await updateLog(child.id, { quantity: newChildQty });
          }
        }
      }

      const updateData = sanitizeData({
        updatedAt: serverTimestamp(),
        quantity: data.quantity,
        notes: data.notes
      });

      await updateDoc(doc(db, 'inventoryLogs', id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventoryLogs/${id}`);
    }
  };

  const deleteLog = async (id: string) => {
    try {
      // Find the log in the latest state
      const logToDelete = logs.find(l => l.id === id);
      if (!logToDelete) return;

      // 1. RECURSIVE DELETE: First find and delete children (ingredients/bottle deductions)
      const parentTag = `[Parent: ${id}]`;
      const childLogs = logs.filter(l => l.notes?.includes(parentTag));
      
      for (const child of childLogs) {
        await deleteLog(child.id);
      }

      // 2. Revert Stock for the current log
      const item = items.find(i => i.id === logToDelete.itemId);
      if (item) {
        if (logToDelete.type === 'count') {
          // Reverting a 'count' is complex, no action for now
        } else {
          let revertAdjustment = 0;
          if (logToDelete.type === 'delivery') revertAdjustment = -logToDelete.quantity;
          else if (logToDelete.type === 'usage' || logToDelete.type === 'sales') revertAdjustment = logToDelete.quantity;
          
          if (revertAdjustment !== 0) {
            await updateDoc(doc(db, 'items', item.id), sanitizeData({ 
              currentStock: increment(revertAdjustment), 
              updatedAt: serverTimestamp() 
            }));
          }
        }
      }


      // 3. Delete the log itself
      await deleteDoc(doc(db, 'inventoryLogs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventoryLogs/${id}`);
    }
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
