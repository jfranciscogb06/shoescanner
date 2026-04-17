import { z } from "zod";

export const ConditionGrade = z.enum(["DS", "VNDS", "USED", "BEAT"]);
export type ConditionGrade = z.infer<typeof ConditionGrade>;

// What the vision model returns
export const ShoeAnalysisSchema = z.object({
  identified: z.boolean().describe("Whether the shoe model could be confidently identified"),
  brand: z.string().describe("e.g. Nike, Adidas, New Balance, Jordan. Empty string if unknown."),
  model: z.string().describe("e.g. 'Air Jordan 1 High OG', 'Dunk Low', 'Yeezy Boost 350 V2'. Empty string if unknown."),
  colorway: z.string().describe("e.g. 'Chicago', 'Bred', 'Panda', 'Zebra'. Empty string if unknown."),
  sku: z.string().describe("Style code from tongue tag if visible, e.g. '555088-101'. Empty string if not visible."),
  size: z.string().describe("US size from tongue tag if visible, e.g. '10.5' or '10.5M'. Empty string if not visible."),
  condition_grade: ConditionGrade.describe(
    "DS = deadstock/new unworn. VNDS = very near deadstock, worn <5 times. USED = clearly worn with visible wear. BEAT = heavy use, creasing, yellowing, major flaws."
  ),
  condition_score: z.number().int().min(0).max(100).describe("0=destroyed, 100=factory new"),
  flaws: z.array(
    z.object({
      type: z.string().describe("e.g. 'creasing', 'yellowing', 'sole_separation', 'scuff', 'stain', 'paint_chip'"),
      severity: z.enum(["minor", "moderate", "severe"]),
      location: z.string().describe("e.g. 'toe box', 'heel', 'midsole', 'left shoe'"),
    })
  ),
  notes: z.string().describe("Additional observations affecting resale, e.g. 'box not shown', 'replacement laces', 'aftermarket insoles'."),
});
export type ShoeAnalysis = z.infer<typeof ShoeAnalysisSchema>;

// Unified comp from any source
export type Comp = {
  source: "ebay" | "stockx" | "goat" | "depop";
  title: string;
  price: number;
  condition: ConditionGrade | "UNKNOWN";
  url: string;
  sold_at?: string;      // ISO date if it's a sold listing
  days_listed?: number;  // estimated time-on-market
  size?: string;
};

export type PriceEstimate = {
  floor: number;          // lowest reasonable ask
  recommended: number;    // median of matched-condition comps
  ceiling: number;        // top of recent sales
  currency: "USD";
  comps_used: number;
  platform_fees: {
    stockx: number;       // net you'd take home
    goat: number;
    ebay: number;
    depop: number;
  };
  best_platform: "stockx" | "goat" | "ebay" | "depop";
  demand_score: number;   // 0-100
  days_to_sell: number;   // estimated
};
