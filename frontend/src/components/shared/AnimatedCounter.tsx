import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  duration?: number;
  triggerOnce?: boolean;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  suffix = '',
  duration = 2000,
  triggerOnce = true,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: triggerOnce, amount: 0.5 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      let startTimestamp: number | null = null;
      
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // easeOutExpo
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setCount(Math.floor(ease * target));
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setCount(target);
        }
      };
      
      window.requestAnimationFrame(step);
    }
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className="inline-flex items-start gap-[3px]">
      {count}
      {suffix && <span className="text-[0.5em] text-primary font-extrabold self-start mt-1">{suffix}</span>}
    </span>
  );
};
