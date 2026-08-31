import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navbar />
      <main className={cn("flex-grow flex flex-col", location.pathname !== '/' && "pt-16")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex-grow flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
