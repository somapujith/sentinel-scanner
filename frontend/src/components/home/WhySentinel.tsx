import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255,255,255,0.06)',
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-4xl border border-white/10 bg-white/2 transition-colors duration-500 hover:border-white/20 hover:bg-white/5 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px z-0 transition-opacity duration-500 ease-out"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
};

const STEPS = [
  {
    n: '01',
    title: 'Confirm authorization',
    desc: 'Required consent before launch; server stores consent time and client IP (trusted proxies when configured).',
  },
  {
    n: '02',
    title: 'Choose modules',
    desc: 'Port scan, HTTP headers, TLS review, and optional reflection probes — intrusive options are clearly labeled.',
  },
  {
    n: '03',
    title: 'Watch live status',
    desc: 'Background job with queued → running per module → complete or failed. SSE plus polling keeps the UI responsive.',
  },
  {
    n: '04',
    title: 'Export & compare',
    desc: 'PDF, JSON, or CSV exports; compare two runs for only-left, only-right, and unchanged findings.',
  },
];

const PILLARS = [
  {
    num: '01',
    title: 'Observable runs',
    desc: 'Queued → running per module → complete or failed. Live status via Server-Sent Events and polling so you always know what the engine is doing.',
    keyword: 'LIVE',
    span: 'lg:col-span-12',
  },
  {
    num: '02',
    title: 'Explainable findings',
    desc: 'Each item maps to ports, headers, TLS, or reflection checks with remediation hints. Optional AI explanations when ANTHROPIC_API_KEY is configured; otherwise a local fallback.',
    keyword: 'CLEAR',
    span: 'lg:col-span-7',
  },
  {
    num: '03',
    title: 'Responsible by design',
    desc: 'Consent and client IP are stored with the scan. Intrusive modules are marked; reflection results report echoes of test strings, not confirmed exploit chains.',
    keyword: 'TRUST',
    span: 'lg:col-span-5',
  },
];

export const WhySentinel: React.FC = () => {
  return (
    <section id="how" className="relative mb-12 w-full border-t border-white/5 bg-black text-white lg:mb-24">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:px-8 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 flex items-center gap-3 opacity-90"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.3em]">How it works</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4 max-w-3xl text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight"
        >
          From consent to exportable report
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mb-12 max-w-2xl text-[15px] leading-relaxed text-white/45 md:text-base"
        >
          Fast feedback for a single URL or IP you are authorized to test. Findings tie to each module; aggregate risk
          scoring and exports support coursework, staging checks, and repeat assessments — not unauthorized scanning.
        </motion.p>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6"
            >
              <span className="font-mono text-[10px] tracking-widest text-primary/80">{s.n}</span>
              <h3 className="mt-3 text-sm font-semibold tracking-tight text-white md:text-[15px]">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/40">{s.desc}</p>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Why Sentinel Scanner</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
          {PILLARS.map((pillar, idx) => (
            <SpotlightCard
              key={pillar.num}
              className={`${pillar.span} group flex min-h-[280px] flex-col p-8 md:min-h-[320px] md:p-12 lg:p-16`}
            >
              {idx === 0 && (
                <div className="pointer-events-none absolute inset-0 opacity-[0.02] transition-opacity duration-700 group-hover:opacity-[0.05] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_70%)]">
                  <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-size-[40px_40px]" />
                </div>
              )}
              {idx === 1 && (
                <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/20 opacity-40 blur-[100px] transition-opacity duration-700 group-hover:opacity-80" />
              )}
              {idx === 2 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-white/5 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              )}

              <div className="relative z-10 flex h-full flex-1 flex-col justify-between">
                <div className="flex w-full items-start justify-between">
                  <span className="font-mono text-xs tracking-widest text-white/40">/{pillar.num}</span>
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
                    {pillar.keyword}
                  </span>
                </div>

                <div className="mt-12 w-full md:mt-16">
                  <h3 className="mb-6 text-[clamp(22px,3vw,38px)] font-semibold leading-tight tracking-tight text-white transition-colors duration-500 group-hover:text-primary md:mb-8">
                    {pillar.title}
                  </h3>
                  <p className="max-w-xl text-[14px] leading-[1.8] text-white/40 transition-colors duration-500 group-hover:text-white/70 md:text-[16px]">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
};
