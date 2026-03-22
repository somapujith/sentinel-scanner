import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AnimatedCounter } from '../shared/AnimatedCounter';
import { TextScrub } from '../shared/TextScrub';

export const AboutSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineWidth = useTransform(scrollYProgress, [0.15, 0.5], ['0%', '100%']);

  const stats = [
    { value: 4, suffix: '', label: 'Selectable modules' },
    { value: 3, suffix: '', label: 'Export formats (PDF, JSON, CSV)' },
    { value: 2, suffix: '', label: 'Scans in compare' },
  ];

  return (
    <section
      ref={containerRef}
      id="about"
      className="bg-black relative py-20 sm:py-[140px] md:py-[180px] px-4 sm:px-6 md:px-12 lg:px-16 overflow-hidden"
    >
      {/* Top: Headline layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 mb-20 md:mb-32">
        {/* Left: Label + Headline */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex items-center gap-2.5 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-spin-slow" />
            <span className="text-[10px] tracking-[0.25em] text-primary font-bold uppercase">
              About the product
            </span>
          </motion.div>

          <h2 className="text-[clamp(36px,5.5vw,90px)] font-sans font-extrabold tracking-tighter leading-[0.92] mb-8">
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                Surface risk.
              </motion.span>
            </div>
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="block font-serif italic font-medium text-primary tracking-normal"
              >
                Test responsibly.
              </motion.span>
            </div>
          </h2>
        </div>

        {/* Right: Abstract Tech Orb Visual */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end items-center mt-16 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[320px] aspect-square flex items-center justify-center group"
            aria-hidden="true"
          >
            {/* Grid background inside */}
            <div className="absolute inset-8 rounded-full border border-white/5 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[20px_20px] overflow-hidden opacity-50 mask-[radial-gradient(circle,black,transparent_70%)]" />

            {/* Architectural orbital rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-white/10 border-t-primary/50 border-r-transparent" 
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-4 rounded-full border border-white/5 border-b-primary/30 border-l-transparent" 
            />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-8 rounded-full border border-white/5 border-t-white/30" 
            />
            
            {/* Center spark/core */}
            <div className="absolute w-32 h-32 bg-primary/10 rounded-full blur-[40px] group-hover:bg-primary/20 group-hover:blur-[50px] transition-all duration-700" />
            
            {/* Animated crosshair lines */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-[120%] h-[1px] bg-linear-to-r from-transparent via-white/40 to-transparent" />
              <div className="absolute h-[120%] w-[1px] bg-linear-to-b from-transparent via-white/40 to-transparent" />
            </div>

            {/* Center glowing dot */}
            <div className="absolute w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_rgba(220,38,38,1)]" />

            {/* Circular Text */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
            >
              <svg className="w-full h-full p-2" viewBox="0 0 100 100">
                <path id="circlePath" d="M 50, 50 m -46, 0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0" fill="none" />
                <text className="text-[6.5px] uppercase tracking-[0.24em] fill-white/50 font-mono font-semibold">
                  <textPath href="#circlePath" startOffset="0%">
                    • PORTS • HEADERS • TLS • REFLECTION • EXPORTS • CONSENT •
                  </textPath>
                </text>
              </svg>
            </motion.div>
            
          </motion.div>
        </div>
      </div>

      {/* Text scrub paragraph */}
      <div className="relative z-10 max-w-[900px] mb-20 md:mb-28">
        <TextScrub
          text="Sentinel Scanner is a browser-based security posture snapshot for a URL or IP you are allowed to test: TCP port discovery, HTTP headers, TLS review, and optional reflection-style probes. Consent is required before any run; findings include severity-style labels, mitigations, and PDF, JSON, or CSV exports. It is not a replacement for full penetration testing, bug bounty triage, or compliance certification."
          className="text-[clamp(18px,2.2vw,28px)] text-white leading-[1.6] font-medium tracking-[-0.01em]"
          customWordStyles={{
            Sentinel: 'font-display text-primary tracking-normal font-normal opacity-100',
            Scanner: 'font-display text-primary tracking-normal font-normal opacity-100',
          }}
        />
      </div>

      {/* Animated divider */}
      <motion.div
        className="h-px bg-white/10 mb-0 relative z-10"
        style={{ width: lineWidth }}
      />

      {/* Stats — horizontal editorial band */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 border-b border-white/8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: 'easeOut' }}
            className="group py-12 md:py-16 md:px-8 first:md:pl-0 last:md:pr-0 border-b md:border-b-0 md:border-r border-white/8 last:border-0 cursor-default"
          >
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-[clamp(48px,5vw,72px)] font-sans font-black text-white tracking-tighter leading-none tabular-nums">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </span>
            </div>
            <span className="text-[11px] tracking-[0.15em] text-white/30 font-semibold uppercase group-hover:text-white/50 transition-colors duration-500">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
