import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/groups", label: "Groups" },
  { href: "/pathways", label: "Pathways" },
  { href: "/friends", label: "Friends" },
  { href: "/search", label: "Search" },
  { href: "/profile", label: "Profile" },
];

export function TopNav() {
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
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={signOut}>
          <button className="cursor-pointer text-sm font-semibold text-brand-ink/50 transition-colors hover:text-brand-orange">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
