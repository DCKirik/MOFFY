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
        "inline-flex items-center justify-center rounded-xl2 px-5 py-2.5 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "bg-brand-yellow text-brand-ink hover:bg-brand-yellow-dark",
        variant === "secondary" && "bg-brand-orange text-white hover:opacity-90",
        variant === "ghost" && "bg-transparent text-brand-ink hover:bg-black/5",
        className,
      )}
      {...props}
    />
  );
}
