"use client";

import { useState, useTransition } from "react";
import { UI_LANGUAGES, type UiLanguage } from "@/lib/i18n/dictionary";
import { setPreAuthLanguage } from "./actions";

export function LanguagePicker({ current }: { current: UiLanguage }) {
  const [lang, setLang] = useState(current);
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {UI_LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => {
            setLang(l.code);
            startTransition(() => {
              setPreAuthLanguage(l.code);
            });
          }}
          className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            lang === l.code
              ? "border-brand-orange bg-brand-orange text-white"
              : "border-white/15 text-brand-ink/60 hover:border-brand-orange/40"
          }`}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}
