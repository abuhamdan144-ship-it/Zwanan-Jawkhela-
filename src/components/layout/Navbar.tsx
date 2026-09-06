import { Logo } from "../ui/LogoFallback";
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Users, Activity, Heart, Contact, Home, Newspaper, Settings, MenuSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navLinks = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'News', path: '/news', icon: Newspaper },
  { name: 'Events', path: '/events', icon: Activity },
  { name: 'Membership', path: '/membership', icon: Users },
  { name: 'Donations', path: '/donations', icon: Heart },
  { name: 'Blood Bank', path: '/blood-bank', icon: Contact },
  { name: 'Cabinet', path: '/cabinet', icon: Users },
  { name: 'Voting', path: '/voting', icon: MenuSquare, reqAuth: true },
];

export function Navbar() {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [loginCnic, setLoginCnic] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // init
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginCnic) {
      login(loginCnic, loginPassword);
    }
  };

  const visibleLinks = navLinks.filter(link => !link.reqAuth || (link.reqAuth && user));

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isHome && !scrolled
        ? "bg-transparent border-transparent py-3"
        : "bg-primary-950/95 backdrop-blur-md shadow-lg py-1 border-b border-white/10"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <img src="/zwanan-jawkhela-3d-logo.png" alt="Zwanan Jawkhela — Together We Thrive" className="h-12 w-auto max-w-[190px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,.35)]" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                    isActive 
                      ? "text-accent-500 bg-white/10" 
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
            
            {user?.role === 'admin' || user?.role === 'superadmin' ? (
              <Link to="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-amber-500/90 hover:bg-amber-500 text-white transition-colors ml-2 shadow-sm">
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            ) : null}

            {user ? (
              <button onClick={logout} className="ml-4 px-4 py-2 bg-white/10 rounded-lg text-sm font-semibold hover:text-accent-500 bg-white/10 transition-colors">
                Logout
              </button>
            ) : (
              <form onSubmit={handleLogin} className="flex items-center gap-2 ml-4">
                <input 
                  type="text" 
                  placeholder="Username..." 
                  value={loginCnic}
                  onChange={e => setLoginCnic(e.target.value)}
                  className="px-3 py-1.5 text-sm text-gray-900 bg-white/90 focus:bg-white rounded-lg outline-none w-36 transition-colors font-medium border border-transparent focus:border-primary-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="px-3 py-1.5 text-sm text-gray-900 bg-white/90 focus:bg-white rounded-lg outline-none w-28 transition-colors font-medium border border-transparent focus:border-primary-500"
                />
                <button type="submit" className="px-4 py-1.5 bg-primary-600 rounded-lg text-sm font-bold text-white hover:bg-primary-500 transition-colors shadow-sm">
                  Login
                </button>
              </form>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-primary-950/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-primary-950 shadow-2xl z-50 flex flex-col border-l border-white/10 md:hidden overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 h-20 border-b border-white/10">
              <span className="text-xl font-bold font-urdu text-white">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="px-4 py-6 space-y-2 flex-grow">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-semibold transition-colors",
                      isActive ? "bg-white/10 text-accent-400" : "text-white/80 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
              
              {user?.role === 'admin' || user?.role === 'superadmin' ? (
                <Link 
                  to="/admin" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-semibold text-accent-400 hover:bg-white/5 mt-4"
                >
                  <Settings className="w-5 h-5" />
                  Admin Dashboard
                </Link>
              ) : null}

              <div className="pt-6 mt-6 border-t border-white/10">
                {user ? (
                  <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold text-red-400 hover:bg-white/5">
                    Logout ({user.name})
                  </button>
                ) : (
                  <form onSubmit={handleLogin} className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      placeholder="Username..." 
                      value={loginCnic}
                      onChange={e => setLoginCnic(e.target.value)}
                      className="px-4 py-3.5 text-base text-gray-900 bg-white rounded-xl outline-none w-full font-medium shadow-inner"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="px-4 py-3.5 text-base text-gray-900 bg-white rounded-xl outline-none w-full font-medium shadow-inner"
                    />
                    <button type="submit" className="w-full px-4 py-3.5 bg-primary-600 rounded-xl text-base text-white font-bold hover:bg-primary-500 transition-colors shadow-md mt-2">
                      Login
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
