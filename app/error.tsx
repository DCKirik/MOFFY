"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold text-brand-ink">Something went wrong</h1>
        <p className="mb-6 text-sm text-brand-ink/70">
          Moffy hit an unexpected error. You can try again, or head back home.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/")}>
            Go home
          </Button>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </Card>
    </div>
  );
}
