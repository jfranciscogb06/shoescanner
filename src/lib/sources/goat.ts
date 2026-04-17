import { chromium, type Browser } from "playwright";
import type { Comp, ConditionGrade } from "../types";

// GOAT allows both new and used listings, so we capture condition when visible.
// Like StockX: no public API, selectors will rot, keep isolated here.

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

function parseGoatCondition(raw: string): ConditionGrade | "UNKNOWN" {
  const s = raw.toLowerCase();
  if (s.includes("new") || s.includes("ds")) return "DS";
  if (s.includes("gently") || s.includes("vnds")) return "VNDS";
  if (s.includes("worn") || s.includes("used")) return "USED";
  if (s.includes("beat") || s.includes("heavy")) return "BEAT";
  return "UNKNOWN";
}

export async function searchGoat(query: string): Promise<Comp[]> {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();

  try {
    const searchUrl = `https://www.goat.com/search?query=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });

    const results = await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll('a[data-qa="grid-cell-ctr"]'));
      return tiles.slice(0, 10).map((tile) => {
        const title = tile.querySelector('[data-qa="grid-cell-name"]')?.textContent?.trim() ?? "";
        const priceText = tile.querySelector('[data-qa="grid-cell-price"]')?.textContent?.trim() ?? "";
        const conditionText = tile.querySelector('[data-qa="grid-cell-condition"]')?.textContent?.trim() ?? "";
        const href = (tile as HTMLAnchorElement).href;
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
        return { title, price, conditionText, url: href };
      });
    });

    return results
      .filter((r) => r.title && r.price > 0)
      .map((r) => ({
        source: "goat" as const,
        title: r.title,
        price: r.price,
        condition: parseGoatCondition(r.conditionText),
        url: r.url,
      }));
  } catch (err) {
    console.error("GOAT scrape failed:", err);
    return [];
  } finally {
    await ctx.close();
  }
}
