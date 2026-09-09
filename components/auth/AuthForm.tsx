import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { t, type UiLanguage } from "@/lib/i18n/dictionary";

export function AuthForm({
  action,
  title,
  submitLabel,
  error,
  notice,
  footer,
  lang,
}: {
  action: (formData: FormData) => void;
  title: string;
  submitLabel: string;
  error?: string;
  notice?: string;
  footer: ReactNode;
  lang: UiLanguage;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <Image src="/moffy-logo.png" alt="Moffy" width={368} height={285} priority className="mx-auto mb-4 h-24 w-auto" />
        <h1 className="mb-6 text-center font-display text-2xl text-brand-ink">{title}</h1>
        {notice && (
          <p className="mb-4 rounded-lg bg-brand-yellow/15 px-3 py-2 text-sm text-brand-yellow">
            {notice}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <form action={action} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink/80">
            {t(lang, "auth_email")}
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-white/15 bg-brand-surface-2 px-3 py-2 text-brand-ink outline-none focus:border-brand-orange"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink/80">
            {t(lang, "auth_password")}
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="rounded-lg border border-white/15 bg-brand-surface-2 px-3 py-2 text-brand-ink outline-none focus:border-brand-orange"
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
