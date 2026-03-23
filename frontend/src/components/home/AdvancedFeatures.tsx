import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lightbulb, SplitSquareVertical } from 'lucide-react';

const CheckItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-4">
    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
      <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
    </div>
    <p className="text-[15px] font-medium leading-relaxed text-slate-600">{text}</p>
  </div>
);

export const AdvancedFeatures: React.FC = () => {
  return (
    <section className="relative w-full bg-[#626de4] py-20 lg:py-32">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 md:px-8">
        {/*
         * Removed feature cards per request.
         * Keeping section wrapper so the background styling remains consistent.
         */}

      </div>
    </section>
  );
};
