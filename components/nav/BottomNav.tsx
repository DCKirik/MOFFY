import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/groups", label: "Groups" },
  { href: "/search", label: "Search" },
  { href: "/profile", label: "Profile" },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-black/5 bg-brand-bg/95 backdrop-blur md:hidden">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex-1 py-3 text-center text-xs font-semibold text-brand-ink/70 hover:text-brand-orange"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
