import React, { useState, useEffect } from 'react';
import { auth, login } from './lib/firebase';
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
import { Button } from './components/ui/button';
import { Beer, Lock } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-3xl mb-4">
            <Beer className="text-black" size={48} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Bar Par Pro</h1>
          <p className="mt-2 text-zinc-400">Professional inventory & par analytics.</p>
        </div>
        
        <div className="bg-zinc-900 p-8 rounded-3xl space-y-4 border border-zinc-800 shadow-2xl">
          <div className="space-y-2">
            <p className="text-sm font-medium">Collaborative Access</p>
            <p className="text-xs text-zinc-500">Sign in with your Google account to access your bar database.</p>
          </div>
          <Button 
            className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all font-bold text-lg gap-3"
            onClick={() => login()}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
        </div>
        
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
          <Lock size={10} /> Secure Cloud Storage
        </p>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  if (!user) return <LoginPage />;

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
