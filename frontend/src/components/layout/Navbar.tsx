import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { MagneticButton } from '../shared/MagneticButton';
import { SentinelLogo } from '../branding/SentinelLogo';

interface NavbarProps {
  transparent?: boolean;
  visible?: boolean;
}

type NavLinkItem =
  | { label: string; href: string }
  | { label: string; to: string };

const NAV_LINKS: NavLinkItem[] = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Scanner', to: '/app' },
];

export const Navbar: React.FC<NavbarProps> = ({ transparent = true, visible = true }) => {
  const { navOpen, setNavOpen } = useUIStore();
  const [scrolled, setScrolled] = useState(false);

  const rafRef = useRef<number | null>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const isScrolled = window.scrollY > 80;
        if (isScrolled !== scrolledRef.current) {
          scrolledRef.current = isScrolled;
          setScrolled(isScrolled);
        }
        rafRef.current = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: '-100%' }}
      animate={{
        y: visible ? '0%' : '-100%',
        backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.96)' : (transparent ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 1)'),
      }}
      transition={{
        y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
        backgroundColor: { duration: 0.3, ease: 'easeOut' },
      }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-[72px]"
    >
      <div className="flex items-center">
        <SentinelLogo
          variant="wordmark"
          href="#hero"
          aria-label="Sentinel Scanner — back to top"
        />
      </div>

      <div className="hidden lg:flex items-center gap-9">
        {NAV_LINKS.map((link, i) => (
          <MagneticButton key={link.label}>
            {'to' in link ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
              >
                <Link
                  to={link.to}
                  className="block relative text-[13px] font-medium text-white/75 hover:text-white tracking-[0.04em] pb-[3px] group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-primary scale-x-0 origin-left transition-transform duration-300 ease-out-expo group-hover:scale-x-100" />
                </Link>
              </motion.div>
            ) : (
              <motion.a
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                className="block relative text-[13px] font-medium text-white/75 hover:text-white tracking-[0.04em] pb-[3px] group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-primary scale-x-0 origin-left transition-transform duration-300 ease-out-expo group-hover:scale-x-100" />
              </motion.a>
            )}
          </MagneticButton>
        ))}
      </div>

      <div className="flex items-center">
        <button
          className="lg:hidden flex flex-col gap-[5px] p-2 z-50 relative"
          onClick={() => setNavOpen(!navOpen)}
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={navOpen}
        >
          <motion.span
            animate={{ rotate: navOpen ? 45 : 0, y: navOpen ? 6.5 : 0 }}
            className="block w-6 h-[1.5px] bg-white transition-transform"
          />
          <motion.span
            animate={{ opacity: navOpen ? 0 : 1 }}
            className="block w-6 h-[1.5px] bg-white transition-opacity"
          />
          <motion.span
            animate={{ rotate: navOpen ? -45 : 0, y: navOpen ? -6.5 : 0 }}
            className="block w-6 h-[1.5px] bg-white transition-transform"
          />
        </button>
      </div>
    </motion.nav>
  );
};
