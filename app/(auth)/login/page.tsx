import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { signIn } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  return (
    <AuthForm
      action={signIn}
      title="Log in to Moffy"
      submitLabel="Log in"
      error={error}
      notice={notice}
      footer={
        <>
          No account yet? <AuthLink href="/signup">Sign up</AuthLink>
        </>
      }
    />
  );
}
