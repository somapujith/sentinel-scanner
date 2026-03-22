import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';

export const NavOverlay: React.FC = () => {
  const { navOpen, setNavOpen } = useUIStore();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && navOpen) setNavOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [navOpen, setNavOpen]);

  type OverlayItem =
    | { label: string; to: string; tag: string }
    | { label: string; href: string; tag: string };

  const navItems: OverlayItem[] = [
    { label: 'Scanner', to: '/app', tag: 'PRODUCT' },
    { label: 'About', href: '#about', tag: 'OVERVIEW' },
    { label: 'Stack', href: '#team', tag: 'TECH' },
  ];

  return (
    <AnimatePresence>
      {navOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-40 bg-black flex flex-col will-change-transform"
          role="dialog"
          aria-label="Navigation menu"
        >
          <nav className="flex-1 flex overflow-hidden pt-[72px]">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 sm:p-6 lg:p-12 gap-2 sm:gap-3">
              {navItems.map((item, i) =>
                'to' in item ? (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
                    className="relative overflow-hidden border border-white/5 flex flex-col justify-end p-5 sm:p-6 group transition-colors duration-300 hover:border-primary/30 hover:bg-white/[0.02] min-h-[120px] sm:min-h-[160px]"
                  >
                    <Link
                      to={item.to}
                      onClick={() => setNavOpen(false)}
                      className="absolute inset-0 z-20"
                      aria-label={item.label}
                    />
                    <div className="relative z-10 text-[9px] sm:text-[10px] text-primary tracking-[0.15em] font-semibold mb-1.5 opacity-80">
                      {item.tag}
                    </div>
                    <div className="relative z-10 text-[18px] sm:text-[20px] font-bold text-white tracking-[-0.02em] border-l-2 border-transparent pl-0 transition-all duration-300 group-hover:border-primary group-hover:pl-3">
                      {item.label}
                    </div>
                  </motion.div>
                ) : (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
                    className="relative overflow-hidden border border-white/5 flex flex-col justify-end p-5 sm:p-6 group transition-colors duration-300 hover:border-primary/30 hover:bg-white/[0.02] min-h-[120px] sm:min-h-[160px]"
                  >
                    <div className="relative z-10 text-[9px] sm:text-[10px] text-primary tracking-[0.15em] font-semibold mb-1.5 opacity-80">
                      {item.tag}
                    </div>
                    <div className="relative z-10 text-[18px] sm:text-[20px] font-bold text-white tracking-[-0.02em] border-l-2 border-transparent pl-0 transition-all duration-300 group-hover:border-primary group-hover:pl-3">
                      {item.label}
                    </div>
                  </motion.a>
                ),
              )}
            </div>
            <div className="hidden lg:flex w-[220px] border-l border-white/10 p-12 flex-col gap-10 text-white/50 text-xs leading-[1.8]">
              <div>
                <div className="text-[10px] tracking-[0.15em] text-white/30 font-semibold mb-2">PRODUCT</div>
                <Link to="/docs" onClick={() => setNavOpen(false)} className="block hover:text-primary transition-colors">
                  Documentation
                </Link>
                <Link to="/security" onClick={() => setNavOpen(false)} className="mt-2 block hover:text-primary transition-colors">
                  Security &amp; trust
                </Link>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.15em] text-white/30 font-semibold mb-2">USE</div>
                <span className="block text-white/40">Authorized targets only.</span>
                <span className="block text-white/40 mt-1">Not a full pentest.</span>
              </div>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
