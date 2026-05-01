import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  Wine,
  GlassWater,
  Plus,
  Database,
  Scissors,
  AlertTriangle,
  FileText,
  ClipboardList,
  Beer,
  BookOpen,
  Target
} from 'lucide-react';
import { Button } from './ui/button';
import { auth, logout } from '../lib/firebase';
import { useInventory } from '../hooks/useInventory';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'inventory', label: 'Beverage Bar', icon: <GlassWater size={20} /> },
  { id: 'shortage', label: 'Shortage', icon: <AlertTriangle size={20} /> },
  { id: 'minimum-par', label: 'Minimum Par', icon: <Target size={20} /> },
  { id: 'par-cutting', label: 'Par Cutting', icon: <Scissors size={20} /> },
  { id: 'recipes', label: 'Cocktail SOP', icon: <FileText size={20} /> },
  { id: 'history', label: 'History', icon: <History size={20} /> },
];

export const Layout: React.FC<{ 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}> = ({ activeTab, setActiveTab, children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Check local storage or system preference on first load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setDarkMode(!isDarkMode);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card dark:bg-slate-900 flex-shrink-0">
        <div className="p-6 border-b border-border dark:border-slate-800">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent italic">BAR PAR PRO</h1>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.2em] font-bold">Inventory Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest px-3 mb-2">Controls</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <div className="transition-transform group-hover:scale-110">
                {item.icon}
              </div>
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between px-3 py-2 bg-secondary rounded-xl">
             <span className="text-[10px] uppercase font-bold text-muted-foreground">Appearance</span>
             <button 
               onClick={toggleTheme}
               className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
             >
               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${isDarkMode ? 'right-1' : 'left-1'}`} />
             </button>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="md:hidden flex items-center gap-2">
            <Beer className="text-blue-600 dark:text-blue-400" size={24} />
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent italic">BAR PAR PRO</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-[9px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">Cloud Connected</span>
            </div>
            <div className="text-muted-foreground font-medium">{auth.currentUser?.email}</div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:bg-secondary rounded-xl" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </Button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 p-6 md:hidden flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                   <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent italic">BAR PAR PRO</h1>
                  <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl" onClick={() => setSidebarOpen(false)}>
                    <X size={24} />
                  </Button>
                </div>

                <nav className="flex-1 space-y-1.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                        activeTab === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {item.icon}
                      <span className="font-semibold text-sm">{item.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="mt-auto space-y-2 pt-6 border-t border-border">
                  <div className="flex items-center justify-between px-3 py-2 bg-secondary rounded-xl mb-4">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Dark Mode</span>
                    <button 
                      onClick={toggleTheme}
                      className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl h-12 text-destructive hover:bg-destructive/10" onClick={() => logout()}>
                    <LogOut size={20} />
                    <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto pb-24">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex items-center justify-around p-3 border-t border-border bg-card/80 backdrop-blur-md pb-safe fixed bottom-0 left-0 right-0 z-40">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === item.id ? 'text-blue-600' : 'text-muted-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${activeTab === item.id ? 'bg-blue-600/10' : ''}`}>
                {React.cloneElement(item.icon as React.ReactElement<{ size?: number }>, { size: 18 })}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
