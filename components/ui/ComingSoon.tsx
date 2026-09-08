import { Card } from "@/components/ui/Card";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <h1 className="text-2xl font-bold text-brand-ink">{title}</h1>
      <p className="mt-2 text-brand-ink/70">{description}</p>
      <span className="mt-4 inline-block rounded-full bg-brand-yellow/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-ink">
        Coming soon
      </span>
    </Card>
  );
}
