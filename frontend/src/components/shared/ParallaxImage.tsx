import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxImageProps {
  src: string;
  alt?: string;
  speed?: number; // 0 to 1, higher = faster relative scroll
  className?: string;
  containerClassName?: string;
}

export const ParallaxImage: React.FC<ParallaxImageProps> = ({ 
  src, 
  alt = "", 
  speed = 0.2,
  className = "",
  containerClassName = "" 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Moves the image from -speed% to +speed% of its own height
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 100}%`, `${speed * 100}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${containerClassName}`}>
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        className={`absolute inset-0 w-full h-[150%] object-cover -top-[25%] ${className}`}
        style={{ y }}
      />
    </div>
  );
};
