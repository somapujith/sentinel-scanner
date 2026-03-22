import { cn } from "../../lib/cn.js";

export function Card({ className, children, padding = "p-6", ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-[16px]",
        "transition-all duration-500 hover:border-white/[0.08] hover:bg-white/[0.03]",
        padding,
        className,
      )}
      {...props}
    >
      {/* Subtle inner top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent opacity-50" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("mb-6 flex flex-col gap-1.5", className)}>{children}</div>;
}
