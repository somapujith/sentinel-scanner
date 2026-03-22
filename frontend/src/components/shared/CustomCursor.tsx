import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const anim = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;
      }
      
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
      }
      rafId = requestAnimationFrame(anim);
    };

    const onMouseOver = (e: MouseEvent) => {
        if (ringRef.current && cursorRef.current) {
            if ((e.target as Element).closest('a, button')) {
                cursorRef.current.style.backgroundColor = '#ffffff';
                ringRef.current.style.borderColor = '#dc2626';
                ringRef.current.style.transform = `translate(${rx - 24}px, ${ry - 24}px) scale(1.5)`;
            } else {
                cursorRef.current.style.backgroundColor = '#dc2626';
                ringRef.current.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                ringRef.current.style.transform = `translate(${rx - 18}px, ${ry - 18}px) scale(1)`;
            }
        }
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    rafId = requestAnimationFrame(anim);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div id="cursor" ref={cursorRef} />
      <div id="cursor-ring" ref={ringRef} />
    </>
  );
};

export default CustomCursor;
