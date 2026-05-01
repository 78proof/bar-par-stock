import React, { useState, useEffect } from 'react';
import { auth, login, loginAnonymously } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { InventoryProvider } from './hooks/useInventory';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { RecipeList } from './components/RecipeList';
import { ParCutting } from './components/ParCutting';
import { Shortage } from './components/Shortage';
import { MinimumPar } from './components/MinimumPar';
import { History } from './components/History';
import { Toaster } from './components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        // Silently sign in if not logged in
        loginAnonymously().catch(console.error);
      }
      setUser(u);
      setReady(true);
    });
  }, []);

  if (!ready || !user) return null;

  return (
    <InventoryProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'inventory' && <InventoryList />}
            {activeTab === 'recipes' && <RecipeList />}
            {activeTab === 'par-cutting' && <ParCutting />}
            {activeTab === 'shortage' && <Shortage />}
            {activeTab === 'minimum-par' && <MinimumPar />}
            {activeTab === 'history' && <History />}
          </motion.div>
        </AnimatePresence>
      </Layout>
      <Toaster richColors position="top-center" />
    </InventoryProvider>
  );
}
