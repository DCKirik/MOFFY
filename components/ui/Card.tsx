import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl2 bg-brand-surface border border-white/10 shadow-lg shadow-black/20 p-4",
        className,
      )}
      {...props}
    />
  );
}
