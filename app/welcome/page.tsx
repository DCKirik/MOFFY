import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMoviePool } from "@/lib/tmdb/cache";
import { tmdbImage } from "@/lib/tmdb/image";
import { getPreAuthLanguage } from "@/lib/i18n/get-language";
import { t } from "@/lib/i18n/dictionary";
import { LanguagePicker } from "./LanguagePicker";

// No auth/cookie-dependent branching here originally would make this
// eligible for build-time static generation, and getMoviePool would then
// run at BUILD time instead of request time (see commit 9b3962f for the
// production incident this exact pattern caused once already).
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  const pool = await getMoviePool(supabase, 24);
  const posters = pool.map((m) => tmdbImage(m.poster_path, "w500")).filter((p): p is string => Boolean(p));
  const lang = await getPreAuthLanguage();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-bg px-6">
      <div className="absolute inset-0 grid grid-cols-4 gap-1 opacity-25 sm:grid-cols-6">
        {posters.map((src, i) => (
          <div key={i} className="relative aspect-[2/3]">
            <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg/85 to-brand-bg" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <Image
          src="/moffy-logo.png"
          alt=""
          width={368}
          height={285}
          priority
          className="h-32 w-auto drop-shadow-[0_0_40px_rgba(255,199,44,0.35)]"
        />
        <h1 className="font-display text-5xl text-brand-ink">MOFFY</h1>
        <p className="max-w-sm text-brand-ink/70">{t(lang, "welcome_tagline")}</p>

        <LanguagePicker current={lang} />

        <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-xl2 bg-brand-yellow px-6 py-3 text-center font-semibold text-brand-bg transition-colors hover:bg-brand-yellow-dark"
          >
            {t(lang, "welcome_get_started")}
          </Link>
          <Link
            href="/login"
            className="rounded-xl2 border border-white/15 px-6 py-3 text-center font-semibold text-brand-ink transition-colors hover:border-brand-orange/50"
          >
            {t(lang, "welcome_log_in")}
          </Link>
        </div>
      </div>
    </div>
  );
}
