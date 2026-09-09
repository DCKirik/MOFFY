import Link from "next/link";
import { t, type UiLanguage } from "@/lib/i18n/dictionary";

const LINKS = [
  { href: "/", key: "nav_home" },
  { href: "/reels", key: "nav_reels" },
  { href: "/discover", key: "nav_discover" },
  { href: "/groups", key: "nav_groups" },
  { href: "/friends", key: "nav_friends" },
  { href: "/search", key: "nav_search" },
  { href: "/profile", key: "nav_profile" },
] as const;

export function BottomNav({ lang }: { lang: UiLanguage }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-white/10 bg-brand-bg/95 backdrop-blur md:hidden">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex-1 py-3 text-center text-xs font-semibold text-brand-ink/60 transition-colors active:scale-95 hover:text-brand-orange"
        >
          {t(lang, link.key)}
        </Link>
      ))}
    </nav>
  );
}
