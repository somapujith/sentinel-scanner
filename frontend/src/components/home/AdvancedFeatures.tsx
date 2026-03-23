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
  // No feature cards are currently enabled, so return nothing to avoid
  // leaving an empty padded section (which causes visible blank space).
  return null;
};
