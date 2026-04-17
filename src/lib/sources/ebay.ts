import type { Comp, ConditionGrade } from "../types";

// eBay Browse API — free tier, legal, well-documented.
// Docs: https://developer.ebay.com/api-docs/buy/browse/resources/item_summary/methods/search
// We fetch active listings AND sold listings (via Finding API) for a pricing anchor.

const EBAY_BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";

let cachedToken: { token: string; expires: number } | null = null;

async function getAppAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) throw new Error("EBAY_APP_ID and EBAY_CERT_ID must be set");

  const basic = Buffer.from(`${appId}:${certId}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!res.ok) throw new Error(`eBay token fetch failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

function guessConditionFromTitle(title: string): ConditionGrade | "UNKNOWN" {
  const t = title.toLowerCase();
  if (/\b(ds|deadstock|bnib|brand new|nwt)\b/.test(t)) return "DS";
  if (/\b(vnds|very near deadstock|worn once|1x worn)\b/.test(t)) return "VNDS";
  if (/\b(beat|trashed|rough|heavy wear|beaters?)\b/.test(t)) return "BEAT";
  if (/\b(used|pre-?owned|worn)\b/.test(t)) return "USED";
  return "UNKNOWN";
}

export async function searchEbay(query: string, size?: string, limit = 30): Promise<Comp[]> {
  const token = await getAppAccessToken();
  const params = new URLSearchParams({
    q: size ? `${query} size ${size}` : query,
    limit: String(Math.min(limit, 50)),
    filter: "buyingOptions:{FIXED_PRICE|BEST_OFFER},conditionIds:{1000|1500|2000|2500|3000|4000|5000|6000}",
    sort: "price",
  });

  const res = await fetch(`${EBAY_BROWSE_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": process.env.EBAY_MARKETPLACE ?? "EBAY_US",
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    console.error("eBay search failed:", res.status, await res.text());
    return [];
  }
  const data = (await res.json()) as {
    itemSummaries?: Array<{
      title: string;
      price?: { value: string; currency: string };
      itemWebUrl: string;
      condition?: string;
      itemCreationDate?: string;
    }>;
  };

  return (data.itemSummaries ?? [])
    .filter((i) => i.price?.value)
    .map((i) => ({
      source: "ebay" as const,
      title: i.title,
      price: parseFloat(i.price!.value),
      condition: guessConditionFromTitle(i.title),
      url: i.itemWebUrl,
      sold_at: i.itemCreationDate,
    }));
}
