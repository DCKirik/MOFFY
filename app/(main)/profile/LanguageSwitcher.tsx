"use client";

import { useState, useTransition } from "react";
import { UI_LANGUAGES, type UiLanguage } from "@/lib/i18n/dictionary";
import { setUiLanguage } from "./actions";

export function LanguageSwitcher({ current }: { current: UiLanguage }) {
  const [lang, setLang] = useState(current);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {UI_LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          disabled={isPending}
          onClick={() => {
            setLang(l.code);
            startTransition(() => {
              setUiLanguage(l.code);
            });
          }}
          className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default ${
            lang === l.code
              ? "border-brand-orange bg-brand-orange text-white"
              : "border-white/15 bg-brand-surface-2 text-brand-ink/80 hover:border-brand-orange/40"
          }`}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}
