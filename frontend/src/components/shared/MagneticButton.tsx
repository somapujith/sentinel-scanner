import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{left: number, top: number, width: number, height: number} | null>(null);

  // Use MotionValues to bypass React re-renders on mousemove
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      rectRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
  };

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rectRef.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = rectRef.current;
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * 0.2);
    y.set(middleY * 0.2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
    rectRef.current = null;
  };

  return (
    <motion.div
      className={className}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
};
