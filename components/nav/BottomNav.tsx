import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/reels", label: "Reels" },
  { href: "/discover", label: "Discover" },
  { href: "/groups", label: "Groups" },
  { href: "/friends", label: "Friends" },
  { href: "/search", label: "Search" },
  { href: "/profile", label: "Profile" },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-white/10 bg-brand-bg/95 backdrop-blur md:hidden">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex-1 py-3 text-center text-xs font-semibold text-brand-ink/60 transition-colors active:scale-95 hover:text-brand-orange"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
