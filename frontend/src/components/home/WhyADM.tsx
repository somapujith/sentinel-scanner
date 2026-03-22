import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

const Word = ({ children, progress, range }: { children: React.ReactNode, progress: MotionValue<number>, range: [number, number] }) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return <motion.span style={{ opacity }} className="relative inline-block mr-[1.5vw] mt-2">{children}</motion.span>;
};

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = '', spotlightColor = 'rgba(255,255,255,0.06)' }) => {
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
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 ease-out z-0"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
};

export const WhyADM: React.FC = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: textRef,
    offset: ['start 60%', 'end 50%'],
  });

  const text =
    'Fast feedback from a single URL or IP. Explainable findings tied to each module. Responsible defaults: consent, logging, and clear labels for intrusive probes.';
  const words = text.split(' ');

  const pillars = [
    {
      num: '01',
      title: 'Observable runs',
      desc: 'Queued → running per module → complete or failed. Live status via SSE and polling so you always know what the engine is doing.',
      keyword: 'LIVE',
      span: 'lg:col-span-12',
    },
    {
      num: '02',
      title: 'Explainable findings',
      desc: 'Each item maps to ports, headers, TLS, or reflection checks with remediation hints. Optional AI explain when the server is configured for it.',
      keyword: 'CLEAR',
      span: 'lg:col-span-7',
    },
    {
      num: '03',
      title: 'Responsible by design',
      desc: 'Consent and client IP are stored with the scan. Intrusive modules are marked; reflection results report echoes, not exploit chains.',
      keyword: 'TRUST',
      span: 'lg:col-span-5',
    },
  ];

  return (
    <section id="why" className="relative bg-black text-white w-full border-t border-white/5 mb-12 lg:mb-24">
      {/* Scroll-Reveal Scrollytelling Section */}
      <div ref={textRef} className="relative h-[120vh] md:h-[150vh] w-full">
        <div className="sticky top-0 h-screen flex flex-col justify-center max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-10 opacity-70"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[11px] tracking-[0.3em] font-bold uppercase">Why Sentinel Scanner</span>
          </motion.div>
          
          <h2 className="text-[clamp(1.75rem,4vw,5rem)] font-sans font-medium leading-[1.15] tracking-tight flex flex-wrap w-full max-w-[95%]">
            {words.map((word, i) => {
              const start = i / words.length;
              const end = start + 1 / words.length;
              return (
                <Word key={i} progress={scrollYProgress} range={[start, end]}>
                  {word}
                </Word>
              );
            })}
          </h2>
        </div>
      </div>

      {/* Futuristic Spotlight Bento Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {pillars.map((pillar, idx) => (
            <SpotlightCard
              key={idx}
              className={`${pillar.span} flex flex-col p-8 md:p-12 lg:p-16 min-h-[40vh] md:min-h-[50vh] group`}
            >
              {/* Decorative Backgrounds per card */}
              {idx === 0 && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] group-hover:opacity-5 transition-opacity duration-700 mask-[radial-gradient(ellipse_at_center,black_20%,transparent_70%)]">
                  <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-size-[40px_40px]" />
                </div>
              )}
              {idx === 1 && (
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-700" />
              )}
              {idx === 2 && (
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              )}

              {/* Card Content */}
              <div className="relative z-10 flex flex-col h-full justify-between flex-1">
                <div className="flex justify-between items-start w-full">
                  <span className="font-mono text-xs tracking-widest text-white/40">/{pillar.num}</span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-primary/80 uppercase px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5">
                    {pillar.keyword}
                  </span>
                </div>

                <div className="mt-16 md:mt-24 w-full">
                  <h3 className="text-[clamp(24px,3vw,42px)] font-sans font-semibold tracking-tight text-white mb-6 md:mb-8 leading-tight group-hover:text-primary transition-colors duration-500">
                    {pillar.title}
                  </h3>
                  <p className="text-white/40 text-[14px] md:text-[16px] leading-[1.8] max-w-xl group-hover:text-white/70 transition-colors duration-500">
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
