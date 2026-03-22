import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagneticButton } from '../shared/MagneticButton';

export const HeroSection: React.FC = () => {
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] flex-col overflow-x-hidden"
    >
      {/* Background SENTINEL watermark */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
          className="text-[clamp(80px,16vw,320px)] text-center font-sans md:font-['Franie'] font-bold tracking-tight leading-[0.95] text-white/[0.03] uppercase pb-[0.08em] pt-[0.04em]"
        >
          SENTINEL
        </motion.span>
      </motion.div>

      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[150px]" />
      </div>

      {/* Main content — centered */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 md:px-12"
      >
        {/* Eyebrow */}
        <div className="overflow-hidden mb-8 md:mb-10">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.8, delay: 1.0, ease }}
            className="flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] md:text-[11px] tracking-[0.3em] text-white/30 font-semibold uppercase">
              Sentinel Scanner · security posture snapshot
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </motion.div>
        </div>

        {/* Brand name — hero centerpiece (extra vertical padding inside clip so display caps aren't cut off) */}
        <div className="overflow-hidden mb-4 py-2 md:py-3">
          <motion.div
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.2, delay: 1.1, ease }}
          >
            <span
              className="block text-[clamp(80px,18vw,280px)] font-sans md:font-['Franie'] font-bold tracking-tight leading-[0.95] text-white pb-[0.1em] pt-[0.05em]"
            >
              SENTINEL
            </span>
          </motion.div>
        </div>

        {/* Tagline */}
        <div className="overflow-hidden mb-6">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.8, delay: 1.4, ease }}
          >
            <p className="text-base md:text-lg text-white/60 max-w-md mx-auto">
              Configure deep scans, track findings in real time, and export reports — all in one Sentinel flow.
            </p>
          </motion.div>
        </div>

        {/* CTA Button */}
        <div className="overflow-hidden mt-4">
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.6, ease }}
            >
                <Link to="/app">
                    <MagneticButton className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-primary/90">
                        <span>Open Scanner</span>
                        <svg
                            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </MagneticButton>
                </Link>
            </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
