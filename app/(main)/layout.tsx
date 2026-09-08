import { TopNav } from "@/components/nav/TopNav";
import { BottomNav } from "@/components/nav/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 md:pb-8">{children}</main>
      <BottomNav />
    </>
  );
}
