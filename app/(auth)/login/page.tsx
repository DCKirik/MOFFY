import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { signIn } from "../actions";
import { getPreAuthLanguage } from "@/lib/i18n/get-language";
import { t } from "@/lib/i18n/dictionary";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const lang = await getPreAuthLanguage();
  return (
    <AuthForm
      action={signIn}
      title={t(lang, "auth_login_title")}
      submitLabel={t(lang, "auth_login_button")}
      error={error}
      notice={notice}
      lang={lang}
      footer={
        <>
          {t(lang, "auth_no_account")} <AuthLink href="/signup">{t(lang, "auth_signup_button")}</AuthLink>
        </>
      }
    />
  );
}
