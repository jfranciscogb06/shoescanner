import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConditionBadge } from "@/components/ConditionBadge";
import { PriceCard } from "@/components/PriceCard";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: scan } = await supabase.from("scans").select("*").eq("id", id).single();
  if (!scan) notFound();

  if (scan.status === "failed") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Scan failed</h1>
        <p className="mt-2 text-muted">{scan.error ?? "Unknown error"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {scan.brand} {scan.model}
          </h1>
          <p className="mt-1 text-muted">
            {scan.colorway}{scan.size ? ` · Size ${scan.size}` : ""}{scan.sku ? ` · ${scan.sku}` : ""}
          </p>
        </div>
        <ConditionBadge grade={scan.condition_grade} score={scan.condition_score} />
      </div>

      <PriceCard
        floor={scan.price_floor}
        recommended={scan.price_recommended}
        ceiling={scan.price_ceiling}
        daysToSell={scan.days_to_sell}
        demandScore={scan.demand_score}
        fees={scan.net_profit_estimate}
        bestPlatform={scan.best_platform}
      />

      {scan.flaws && scan.flaws.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-medium">Flaws detected</h2>
          <ul className="space-y-2">
            {scan.flaws.map((f: { type: string; severity: string; location: string }, i: number) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-border bg-panel px-4 py-2 text-sm">
                <span>{f.type.replace(/_/g, " ")} on {f.location}</span>
                <span className="text-muted">{f.severity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
