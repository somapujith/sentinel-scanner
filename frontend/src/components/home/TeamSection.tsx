import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, Layers, Server } from 'lucide-react';

const STACK = [
  {
    title: 'FastAPI backend',
    desc: 'Async jobs, optional API keys, CORS and rate limits — see Security for operations.',
    Icon: Server,
  },
  {
    title: 'React + Vite',
    desc: 'Scanner shell with live SSE and polling, exports, compare, and scheduled jobs UI.',
    Icon: Layers,
  },
  {
    title: 'SQLite history',
    desc: 'Scan metadata, findings, consent timestamps, and client IP (with trusted proxy support).',
    Icon: Database,
  },
];

export const TeamSection: React.FC = () => {
  return (
    <section id="team" className="bg-black py-20 sm:py-[120px] md:py-[160px] px-4 sm:px-6 md:px-12 lg:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 mb-16 md:mb-20">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-2.5 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-spin-slow" />
            <span className="text-[10px] tracking-[0.25em] text-primary font-bold uppercase">
              Implementation
            </span>
          </motion.div>
          <h2 className="text-[clamp(36px,5vw,80px)] font-sans font-extrabold tracking-tighter leading-[0.92]">
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                The stack
              </motion.span>
            </div>
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="block font-serif italic font-medium text-white/40 tracking-normal"
              >
                behind Sentinel Scanner
              </motion.span>
            </div>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-[14px] md:text-[16px] text-white/50 leading-[1.8] max-w-[520px] mt-6"
          >
            Built for coursework, labs, and authorized assessments — not for scanning targets without permission. Read{' '}
            <Link to="/security" className="text-primary/90 hover:text-primary underline-offset-4 hover:underline">
              Security &amp; trust
            </Link>{' '}
            before deploying.
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {STACK.map((item, index) => {
          const Icon = item.Icon;
          return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 hover:border-primary/25 hover:bg-white/[0.04] transition-colors"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-white mb-3">{item.title}</h3>
            <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
          </motion.div>
          );
        })}
      </div>
    </section>
  );
};
