import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl2 bg-brand-surface border border-white/10 p-4 transition-shadow duration-300 shadow-[0_0_18px_2px_rgba(245,183,34,0.10),0_10px_25px_-5px_rgba(0,0,0,0.35)] hover:shadow-[0_0_34px_8px_rgba(245,183,34,0.28),0_14px_30px_-5px_rgba(0,0,0,0.4)]",
        className,
      )}
      {...props}
    />
  );
}
