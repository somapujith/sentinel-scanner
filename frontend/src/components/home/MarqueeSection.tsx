import React from 'react';

export const MarqueeSection: React.FC = () => {
  return (
    <div className="bg-black py-8 md:py-10 overflow-x-hidden relative border-y border-white/5 flex items-center">
      <div className="flex w-[200%] animate-marquee-left whitespace-nowrap">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-6 md:gap-10 px-3 md:px-4 text-[clamp(3rem,8vw,6rem)] font-sans font-extrabold tracking-tight leading-[1.05] py-1"
          >
            <span
              className="font-['Franie'] font-bold tracking-normal uppercase inline-block pb-[0.06em] pt-[0.04em]"
              style={{
                WebkitTextStroke: '1.5px rgba(255,255,255,0.15)',
                color: 'transparent',
              }}
            >
              SENTINEL
            </span>
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-white/90">WEB SECURITY AUDIT</span>
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="font-serif italic font-medium text-primary/80">
              AUTHORIZED TESTING ONLY
            </span>
            <span className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
