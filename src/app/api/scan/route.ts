import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeShoe } from "@/lib/analyze";
import { searchEbay } from "@/lib/sources/ebay";
import { searchStockX } from "@/lib/sources/stockx";
import { searchGoat } from "@/lib/sources/goat";
import { priceFromComps } from "@/lib/pricing";
import { createClient, createAdmin } from "@/lib/supabase/server";
import type { Comp } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  left: z.string().min(10),
  right: z.string().min(10),
  top: z.string().min(10),
  sole: z.string().min(10),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Send 4 photos (left/right/top/sole)" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdmin();

  // Decrement credits (atomic via RPC would be better; for MVP we read-modify-write)
  const { data: profile } = await admin
    .from("profiles")
    .select("scan_credits")
    .eq("id", user.id)
    .single();
  if (!profile || profile.scan_credits <= 0) {
    return NextResponse.json({ error: "No scan credits left" }, { status: 402 });
  }
  await admin
    .from("profiles")
    .update({ scan_credits: profile.scan_credits - 1 })
    .eq("id", user.id);

  // Create scan row in "analyzing" state so the UI can poll if we async later
  const { data: scan, error: insertErr } = await admin
    .from("scans")
    .insert({ user_id: user.id, status: "analyzing" })
    .select()
    .single();
  if (insertErr || !scan) {
    return NextResponse.json({ error: "Could not create scan" }, { status: 500 });
  }

  try {
    // 1) Vision analysis
    const analysis = await analyzeShoe(parsed.data);

    // 2) Comps search (parallel). Query built from brand + model + colorway.
    const query = [analysis.brand, analysis.model, analysis.colorway]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!analysis.identified || !query) {
      await admin
        .from("scans")
        .update({
          status: "failed",
          error: "Could not confidently identify the shoe — try clearer photos of the tongue tag and sides.",
          ...analysis,
        })
        .eq("id", scan.id);
      return NextResponse.json({ error: "Shoe not identified", id: scan.id }, { status: 200 });
    }

    const [ebayComps, stockxComps, goatComps] = await Promise.all([
      searchEbay(query, analysis.size || undefined).catch(() => [] as Comp[]),
      searchStockX(query).catch(() => [] as Comp[]),
      searchGoat(query).catch(() => [] as Comp[]),
    ]);
    const comps: Comp[] = [...ebayComps, ...stockxComps, ...goatComps];

    // 3) Price it
    const price = priceFromComps(comps, analysis);

    await admin
      .from("scans")
      .update({
        status: "priced",
        brand: analysis.brand,
        model: analysis.model,
        colorway: analysis.colorway,
        sku: analysis.sku,
        size: analysis.size,
        condition_grade: analysis.condition_grade,
        condition_score: analysis.condition_score,
        flaws: analysis.flaws,
        price_floor: price.floor,
        price_recommended: price.recommended,
        price_ceiling: price.ceiling,
        net_profit_estimate: price.platform_fees,
        days_to_sell: price.days_to_sell,
        demand_score: price.demand_score,
        best_platform: price.best_platform,
        comps: comps,
      })
      .eq("id", scan.id);

    return NextResponse.json({ id: scan.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await admin
      .from("scans")
      .update({ status: "failed", error: message })
      .eq("id", scan.id);
    return NextResponse.json({ error: message, id: scan.id }, { status: 500 });
  }
}
