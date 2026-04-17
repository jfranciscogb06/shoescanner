import { TrendingUp, Clock, Target } from "lucide-react";

type Fees = Record<string, number> | null;

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

const PLATFORM_LABEL: Record<string, string> = {
  stockx: "StockX",
  goat: "GOAT",
  ebay: "eBay",
  depop: "Depop",
};

export function PriceCard({
  floor,
  recommended,
  ceiling,
  daysToSell,
  demandScore,
  fees,
  bestPlatform,
}: {
  floor: number | null;
  recommended: number | null;
  ceiling: number | null;
  daysToSell: number | null;
  demandScore: number | null;
  fees: Fees;
  bestPlatform: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-panel p-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-bg/40 p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Floor</div>
          <div className="mt-1 text-2xl font-semibold">{fmt(floor)}</div>
        </div>
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-4">
          <div className="text-xs uppercase tracking-wider text-accent">Recommended</div>
          <div className="mt-1 text-2xl font-semibold text-accent">{fmt(recommended)}</div>
        </div>
        <div className="rounded-lg border border-border bg-bg/40 p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Ceiling</div>
          <div className="mt-1 text-2xl font-semibold">{fmt(ceiling)}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-5">
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-4 w-4 text-muted" />
          <div>
            <div className="text-xs text-muted">Best platform</div>
            <div className="text-sm font-medium">
              {bestPlatform ? PLATFORM_LABEL[bestPlatform] ?? bestPlatform : "—"}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <TrendingUp className="mt-0.5 h-4 w-4 text-muted" />
          <div>
            <div className="text-xs text-muted">Demand</div>
            <div className="text-sm font-medium">
              {demandScore !== null && demandScore !== undefined ? `${demandScore}/100` : "—"}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 text-muted" />
          <div>
            <div className="text-xs text-muted">Est. days to sell</div>
            <div className="text-sm font-medium">
              {daysToSell !== null && daysToSell !== undefined ? `${daysToSell}d` : "—"}
            </div>
          </div>
        </div>
      </div>

      {fees && Object.keys(fees).length > 0 && (
        <div className="mt-5 border-t border-border pt-5">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted">Net after fees</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(fees).map(([platform, net]) => (
              <div
                key={platform}
                className={`rounded-md border px-3 py-2 text-sm ${
                  platform === bestPlatform
                    ? "border-accent/40 bg-accent/5"
                    : "border-border bg-bg/40"
                }`}
              >
                <div className="text-xs text-muted">{PLATFORM_LABEL[platform] ?? platform}</div>
                <div className="font-medium">{fmt(net)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
