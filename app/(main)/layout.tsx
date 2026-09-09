import { TopNav } from "@/components/nav/TopNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { getUiLanguage } from "@/lib/i18n/get-language";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = await getUiLanguage(supabase, user?.id);

  return (
    <>
      <TopNav lang={lang} />
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 md:pb-8">{children}</main>
      <BottomNav lang={lang} />
    </>
  );
}
