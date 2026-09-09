import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { signUp } from "../actions";
import { getPreAuthLanguage } from "@/lib/i18n/get-language";
import { t } from "@/lib/i18n/dictionary";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const lang = await getPreAuthLanguage();
  return (
    <AuthForm
      action={signUp}
      title={t(lang, "auth_signup_title")}
      submitLabel={t(lang, "auth_signup_button")}
      error={error}
      lang={lang}
      footer={
        <>
          {t(lang, "auth_has_account")} <AuthLink href="/login">{t(lang, "auth_login_button")}</AuthLink>
        </>
      }
    />
  );
}
