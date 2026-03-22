import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MagneticButton } from '../shared/MagneticButton';

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState('');
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const fade = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const watermarkY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Bangkok',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative h-screen min-h-[600px] sm:min-h-[650px] md:min-h-[700px] flex flex-col justify-between overflow-x-hidden"
    >
      {/* Background SENTINEL watermark */}
      <motion.div
        style={{ y: watermarkY }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none will-change-transform"
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
        style={{ y: textY, opacity: fade }}
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

      {/* Bottom bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.5, ease: 'easeOut' }}
        className="relative z-10 border-t border-white/[0.06]"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-12 lg:px-16 py-3 sm:py-4">
          <div className="flex items-center gap-4 sm:gap-6 md:gap-10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] sm:text-[9px] tracking-[0.15em] text-white/25 font-semibold uppercase">
                Available
              </span>
            </div>
            <span className="hidden sm:block text-[9px] tracking-[0.15em] text-white/15 font-mono">
              BKK {time}
            </span>
          </div>

          <div className="hidden md:flex flex-col items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            <span className="text-[8px] tracking-[0.25em] text-white/15 font-semibold uppercase">
              Scroll
            </span>
            <div className="w-px h-7 bg-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-primary animate-scroll-line" />
            </div>
          </div>

          <Link
            to="/docs"
            className="group flex items-center gap-2 sm:gap-2.5 text-[8px] sm:text-[9px] tracking-[0.12em] text-white/30 font-semibold uppercase transition-colors duration-300 hover:text-white"
          >
            <span className="hidden sm:inline">Documentation</span>
            <span className="sm:hidden">Docs</span>
            <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none" className="transition-transform duration-300 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]">
                <path d="M1 7L7 1M7 1H2M7 1V6" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};
