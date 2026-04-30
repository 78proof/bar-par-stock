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
import { AdminSeeder } from './AdminSeeder';

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
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setDarkMode(!isDarkMode);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-slate-900 flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic">BAR PAR PRO</h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-bold">Inventory Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest px-3 mb-2">Controls</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === item.id ? 'bg-blue-400 animate-pulse' : 'bg-transparent'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <AdminSeeder />
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl">
             <span className="text-xs text-slate-400">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
             <button 
               onClick={toggleTheme}
               className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-700'}`}
             >
               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
             </button>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden bg-slate-950">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-30">
          <div className="md:hidden flex items-center gap-2">
            <Beer className="text-blue-400" size={24} />
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic">BAR PAR PRO</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Cloud Connected</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">{auth.currentUser?.email}</div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden text-slate-400" onClick={() => setSidebarOpen(true)}>
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
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 p-6 md:hidden flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                   <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic">BAR PAR PRO</h1>
                  <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => setSidebarOpen(false)}>
                    <X size={24} />
                  </Button>
                </div>

                <nav className="flex-1 space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                        activeTab === item.id 
                        ? 'bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20' 
                        : 'text-slate-400'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-auto space-y-2 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl mb-4">
                    <span className="text-xs text-slate-400">Dark Mode</span>
                    <button 
                      onClick={toggleTheme}
                      className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl h-12 text-destructive" onClick={() => logout()}>
                    <LogOut size={20} />
                    Sign Out
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex items-center justify-around p-3 border-t border-slate-800 bg-slate-900 pb-safe">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 group transition-all ${
                activeTab === item.id ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${activeTab === item.id ? 'bg-blue-500/10' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
