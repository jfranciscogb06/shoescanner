import type { Comp, ConditionGrade, PriceEstimate, ShoeAnalysis } from "./types";

// Platform fees as of 2026. Update when they change.
// stockx: 9% transaction + 3% payment processing, no flat fee
// goat:   9.5% commission + $5 cashout fee
// ebay:   13% final value fee (sneakers >$100 get reduced rates in some categories)
// depop:  10% platform fee (Depop fee was removed then partially reinstated; verify current)
const FEES = {
  stockx: (sale: number) => sale * (1 - 0.09 - 0.03),
  goat: (sale: number) => sale * (1 - 0.095) - 5,
  ebay: (sale: number) => sale * (1 - 0.13),
  depop: (sale: number) => sale * (1 - 0.1),
} as const;

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Matches comps to the detected condition tier. Broader matches for sparse data.
function matchCondition(comps: Comp[], grade: ConditionGrade): Comp[] {
  // Direct match first
  const direct = comps.filter((c) => c.condition === grade);
  if (direct.length >= 3) return direct;
  // Fall back to adjacent tiers
  const tierOrder: ConditionGrade[] = ["DS", "VNDS", "USED", "BEAT"];
  const idx = tierOrder.indexOf(grade);
  const adjacent = comps.filter(
    (c) =>
      c.condition === tierOrder[Math.max(0, idx - 1)] ||
      c.condition === tierOrder[Math.min(3, idx + 1)]
  );
  if (direct.length + adjacent.length >= 3) return [...direct, ...adjacent];
  // Last resort: all comps (condition UNKNOWN counts here)
  return comps;
}

function demandScore(comps: Comp[]): number {
  // Simple heuristic: more comps = higher demand. Cap at 100.
  // Will be upgraded when we wire in eBay sold-listing volume.
  const n = comps.length;
  if (n >= 30) return 95;
  if (n >= 20) return 80;
  if (n >= 10) return 60;
  if (n >= 5) return 40;
  return 20;
}

function daysToSell(comps: Comp[], grade: ConditionGrade): number {
  // Heuristic: DS on StockX/GOAT clears fast; used on eBay/Depop slower.
  const score = demandScore(comps);
  const conditionPenalty = { DS: 0, VNDS: 2, USED: 7, BEAT: 21 }[grade];
  // Baseline: 95 demand → 3 days, 20 demand → 30 days
  const base = Math.round(33 - score * 0.3);
  return Math.max(1, base + conditionPenalty);
}

function bestPlatform(
  grade: ConditionGrade,
  recommended: number
): PriceEstimate["best_platform"] {
  // DS / VNDS: StockX for popular, GOAT a close second
  // USED: eBay (broadest buyer pool)
  // BEAT: Depop (style-conscious buyers tolerate condition)
  if (grade === "DS") return recommended > 300 ? "stockx" : "goat";
  if (grade === "VNDS") return "goat";
  if (grade === "USED") return "ebay";
  return "depop";
}

export function priceFromComps(
  comps: Comp[],
  analysis: ShoeAnalysis
): PriceEstimate {
  const matched = matchCondition(comps, analysis.condition_grade);
  const prices = matched.map((c) => c.price).filter((p) => p > 0 && p < 10_000);

  const sorted = [...prices].sort((a, b) => a - b);
  const recommended = Math.round(median(prices));
  const floor = sorted.length ? Math.round(sorted[Math.floor(sorted.length * 0.1)]) : 0;
  const ceiling = sorted.length ? Math.round(sorted[Math.floor(sorted.length * 0.9)]) : 0;

  const platform_fees = {
    stockx: Math.round(FEES.stockx(recommended)),
    goat: Math.round(FEES.goat(recommended)),
    ebay: Math.round(FEES.ebay(recommended)),
    depop: Math.round(FEES.depop(recommended)),
  };

  return {
    floor,
    recommended,
    ceiling,
    currency: "USD",
    comps_used: matched.length,
    platform_fees,
    best_platform: bestPlatform(analysis.condition_grade, recommended),
    demand_score: demandScore(comps),
    days_to_sell: daysToSell(comps, analysis.condition_grade),
  };
}
