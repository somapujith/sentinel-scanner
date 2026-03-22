import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <span className="text-[clamp(100px,25vw,300px)] font-['Franie'] font-bold tracking-tight leading-none text-white/[0.04] select-none">
        404
      </span>
      <h1 className="text-[clamp(24px,4vw,48px)] font-sans font-extrabold tracking-tighter text-white -mt-8 mb-4">
        Page Not Found
      </h1>
      <p className="text-[14px] text-white/35 max-w-[400px] leading-[1.8] mb-10">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="group inline-flex items-center gap-3 text-[11px] tracking-[0.15em] text-white/50 font-semibold uppercase transition-colors duration-300 hover:text-white"
      >
        <span className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500">
          <ArrowUpRight size={14} className="rotate-[-135deg]" />
        </span>
        Back to Home
      </Link>
    </div>
  );
};
