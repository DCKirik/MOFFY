import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-xl2 px-5 py-2.5 font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
        variant === "primary" && "bg-brand-yellow text-brand-bg hover:bg-brand-yellow-dark",
        variant === "secondary" && "bg-brand-orange text-white hover:bg-brand-orange-dark",
        variant === "ghost" && "bg-transparent text-brand-ink hover:bg-white/10",
        className,
      )}
      {...props}
    />
  );
}
