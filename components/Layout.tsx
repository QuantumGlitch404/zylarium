import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Wrench, Briefcase, FileText, DollarSign, Home, Activity, Server } from 'lucide-react';
import { LiquidEffectAnimation } from './ui/LiquidEffectAnimation';
import { PremiumCursor } from './ui/PremiumCursor';

const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'UniToolBox', path: '/unitoolbox', icon: <Wrench className="w-4 h-4" /> },
    { label: 'HustleFinder', path: '/hustlefinder', icon: <Briefcase className="w-4 h-4" /> },
    { label: 'Resume', path: '/resume-builder', icon: <FileText className="w-4 h-4" /> },
    { label: 'Finance', path: '/finance-tools', icon: <DollarSign className="w-4 h-4" /> },
    { label: 'Code X-Ray', path: '/code-xray', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Liquid Metal Background Effect */}
      <LiquidEffectAnimation />

      {/* Premium Custom Cursor */}
      <PremiumCursor />

      <div className="min-h-screen flex flex-col bg-transparent relative z-10">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-2">

              {/* Logo */}
              <NavLink to="/" className="flex items-center gap-3 font-bold text-xl group">
                <img src="/logo-full.png" alt="Zylarium" className="h-24 md:h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]" />
              </NavLink>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    ${isActive
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                  `}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-3">

                <button
                  className="md:hidden p-2.5 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/10"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-black/60 backdrop-blur-xl border-t border-white/10">
              <div className="px-3 pt-3 pb-4 space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300
                    ${isActive
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                  `}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}

              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="flex-grow">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-black/40 backdrop-blur-xl border-t border-white/10 py-8 no-print">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">
              Made With <span className="text-red-400">❤️</span> By <span className="font-signature text-xl text-primary-400">QuantumGlitch404</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;