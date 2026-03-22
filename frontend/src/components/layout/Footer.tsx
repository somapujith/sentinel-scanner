import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { ContactForm } from '../shared/ContactForm';
import { SentinelLogo } from '../branding/SentinelLogo';

export const Footer: React.FC = () => {
  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Stack', href: '#team' },
  ];

  const productLinks = [
    { label: 'Scanner', to: '/app' },
    { label: 'Documentation', to: '/docs' },
    { label: 'Security & trust', to: '/security' },
    { label: 'Scheduled scans', to: '/app/scheduled' },
  ];

  return (
    <footer className="bg-black border-t border-white/5">
      <div className="px-4 sm:px-8 md:px-16 pt-16 sm:pt-20 pb-12 sm:pb-16 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] tracking-[0.2em] text-primary font-semibold mb-6">GET STARTED</p>
          <h2
            className="font-sans text-[clamp(2.4rem,5.5vw,5rem)] font-bold leading-[1.05] tracking-tighter text-white mb-10 max-w-4xl"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
            }}
          >
            Run an authorized scan in minutes.
            <br />
            <span className="text-white/20">Export results your team can act on.</span>
          </h2>
          <ContactForm />
        </motion.div>
      </div>

      <div className="px-4 sm:px-8 md:px-16 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="col-span-1 sm:col-span-2 md:col-span-1"
        >
          <div className="mb-3">
            <SentinelLogo variant="lockup" size="sm" />
          </div>
          <p className="text-[12px] text-white/35 leading-[1.8] max-w-[220px]">
            Sentinel Scanner — lightweight vulnerability posture snapshots. FastAPI backend, React UI, SQLite history.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <p className="text-[10px] tracking-[0.15em] text-white/25 font-bold mb-4">PAGE</p>
          <div className="flex flex-col gap-2.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] text-white/45 hover:text-white transition-colors w-fit"
              >
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="text-[10px] tracking-[0.15em] text-white/25 font-bold mb-4">PRODUCT</p>
          <div className="flex flex-col gap-2.5">
            {productLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[13px] text-white/45 hover:text-white transition-colors w-fit"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[13px] text-white/45 hover:text-white transition-colors w-fit"
            >
              <Github size={13} className="text-white/30" />
              Source
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <p className="text-[10px] tracking-[0.15em] text-white/25 font-bold mb-4">TRUST</p>
          <p className="text-[12px] text-white/35 leading-[1.8]">
            Use only on systems you own or have written permission to test. Misuse is your responsibility.
          </p>
        </motion.div>
      </div>

      <div className="px-4 sm:px-8 md:px-16 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-white/20">
        <span>© {new Date().getFullYear()} Sentinel Scanner · Hackathon / coursework build</span>
        <div className="flex gap-6">
          <Link to="/security" className="hover:text-white/50 transition-colors">
            Legal &amp; ethics
          </Link>
          <Link to="/docs" className="hover:text-white/50 transition-colors">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
};
