import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { signUp } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthForm
      action={signUp}
      title="Create your Moffy account"
      submitLabel="Sign up"
      error={error}
      footer={
        <>
          Already have an account? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    />
  );
}
