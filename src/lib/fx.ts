import "server-only";
import { FALLBACK_RATES, type Rates } from "./locale";

/*
 * Live USD exchange rates for the budget brackets, from open.er-api.com
 * (free, no key, ~160 currencies, updated daily). Cached for 12 hours in
 * Next's data cache, so at most two requests a day leave the server, and no
 * visitor data is ever sent. On any failure the fallback table is used, so
 * the page never waits more than 2.5s or breaks because of it.
 */
const SOURCE = "https://open.er-api.com/v6/latest/USD";

export async function usdRates(): Promise<Rates> {
  try {
    const res = await fetch(SOURCE, {
      next: { revalidate: 60 * 60 * 12 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return FALLBACK_RATES;
    const body = (await res.json()) as { result?: string; rates?: Record<string, unknown> };
    if (body.result !== "success" || !body.rates) return FALLBACK_RATES;

    const live: Rates = {};
    for (const [code, v] of Object.entries(body.rates)) {
      if (/^[A-Z]{3}$/.test(code) && typeof v === "number" && v > 0) live[code] = v;
    }
    // Live rates win; the fallback only fills gaps.
    return Object.keys(live).length > 20 ? { ...FALLBACK_RATES, ...live, USD: 1 } : FALLBACK_RATES;
  } catch {
    return FALLBACK_RATES;
  }
}
