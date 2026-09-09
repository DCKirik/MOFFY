import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ReactNode } from "react";

export function AuthForm({
  action,
  title,
  submitLabel,
  error,
  notice,
  footer,
}: {
  action: (formData: FormData) => void;
  title: string;
  submitLabel: string;
  error?: string;
  notice?: string;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold text-brand-ink">{title}</h1>
        {notice && (
          <p className="mb-4 rounded-lg bg-brand-yellow/25 px-3 py-2 text-sm text-brand-ink">
            {notice}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <form action={action} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-orange"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-orange"
            />
          </label>
          <Button type="submit" className="mt-2">
            {submitLabel}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-brand-ink/70">{footer}</p>
      </Card>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand-orange hover:underline">
      {children}
    </Link>
  );
}
