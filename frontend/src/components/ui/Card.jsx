import { cn } from "../../lib/cn.js";

export function Card({ className, children, padding = "p-6", ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800/50 bg-surface-850/75 shadow-card backdrop-blur-xl",
        "transition-shadow duration-300 hover:border-slate-700/55 hover:shadow-card-hover",
        padding,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("mb-5", className)}>{children}</div>;
}
