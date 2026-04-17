import { chromium, type Browser } from "playwright";
import type { Comp } from "../types";

// StockX has no public API. We hit their internal search JSON endpoint via a
// real browser session (Playwright) to get past basic bot checks. This is
// fragile — StockX changes HTML/endpoints occasionally. Keep selectors isolated
// here so repairs stay local.
//
// Legal note: scraping public StockX listing data is a gray area. Check their
// ToS and robots.txt before running at scale. For production, consider a
// commercial data provider (e.g. StockX's Developer Program if accepted).

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

export async function searchStockX(query: string): Promise<Comp[]> {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();

  try {
    const searchUrl = `https://stockx.com/search?s=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });

    // StockX renders product tiles with a last-sale price. Selector is likely to change.
    const results = await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll('[data-testid="productTile"]'));
      return tiles.slice(0, 10).map((tile) => {
        const title = tile.querySelector('[data-testid="product-tile-title"]')?.textContent?.trim() ?? "";
        const priceText = tile.querySelector('[data-testid="product-tile-lowest-ask-amount"]')?.textContent?.trim() ?? "";
        const href = (tile.querySelector("a") as HTMLAnchorElement | null)?.href ?? "";
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
        return { title, price, url: href };
      });
    });

    return results
      .filter((r) => r.title && r.price > 0)
      .map((r) => ({
        source: "stockx" as const,
        title: r.title,
        price: r.price,
        condition: "DS" as const, // StockX is deadstock-only
        url: r.url,
      }));
  } catch (err) {
    console.error("StockX scrape failed:", err);
    return [];
  } finally {
    await ctx.close();
  }
}
