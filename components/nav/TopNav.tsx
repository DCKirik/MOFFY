import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { t, type UiLanguage } from "@/lib/i18n/dictionary";

const LINKS = [
  { href: "/", key: "nav_home" },
  { href: "/reels", key: "nav_reels" },
  { href: "/discover", key: "nav_discover" },
  { href: "/groups", key: "nav_groups" },
  { href: "/pathways", key: "nav_pathways" },
  { href: "/friends", key: "nav_friends" },
  { href: "/search", key: "nav_search" },
  { href: "/profile", key: "nav_profile" },
] as const;

export function TopNav({ lang }: { lang: UiLanguage }) {
  return (
    <header className="sticky top-0 z-10 hidden border-b border-white/10 bg-brand-bg/90 backdrop-blur md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="shrink-0">
          <Image src="/moffy-logo.png" alt="Moffy" width={57} height={44} priority className="h-11 w-auto" />
        </Link>
        <nav className="flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-brand-ink/70 transition-colors hover:text-brand-orange"
            >
              {t(lang, link.key)}
            </Link>
          ))}
        </nav>
        <form action={signOut}>
          <button className="cursor-pointer text-sm font-semibold text-brand-ink/50 transition-colors hover:text-brand-orange">
            {t(lang, "profile_log_out")}
          </button>
        </form>
      </div>
    </header>
  );
}
