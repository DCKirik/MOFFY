import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold text-brand-ink">Page not found</h1>
        <p className="mb-6 text-sm text-brand-ink/70">
          This page doesn&apos;t exist, or it moved.
        </p>
        <Link href="/">
          <Button>Go home</Button>
        </Link>
      </Card>
    </div>
  );
}
