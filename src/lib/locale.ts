/*
 * Visitor locale: which language and currency to show, decided from the
 * visitor's country (Vercel's x-vercel-ip-country header, set in src/proxy.ts).
 * Safe to import on the server and the client — no secrets, no Node APIs.
 */

export type Lang = "en" | "ar";

export const LANG_COOKIE = "lang";
export const CURRENCY_COOKIE = "currency";
/** Request headers the proxy forwards to the root layout. */
export const LANG_HEADER = "x-site-lang";
export const CURRENCY_HEADER = "x-site-currency";

// Arab League member states — visitors from here get the Arabic site.
const ARABIC_COUNTRIES = new Set([
  "AE", "BH", "DJ", "DZ", "EG", "IQ", "JO", "KM", "KW", "LB", "LY",
  "MA", "MR", "OM", "PS", "QA", "SA", "SD", "SO", "SY", "TN", "YE",
]);

const EUROZONE = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
]);

export type CurrencyCode =
  | "USD" | "EGP" | "KWD" | "SAR" | "AED" | "QAR" | "BHD" | "OMR" | "JOD" | "EUR" | "GBP";

/*
 * Units of each currency per 1 USD. The Gulf currencies and JOD are pegged, so
 * those are exact. EGP, EUR and GBP float — they're only used to turn the
 * budget brackets into round local numbers, so review them every few months.
 */
export const USD_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EGP: 48,
  KWD: 0.307,
  SAR: 3.75,
  AED: 3.6725,
  QAR: 3.64,
  BHD: 0.376,
  OMR: 0.3845,
  JOD: 0.709,
  EUR: 0.86,
  GBP: 0.75,
};

const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  EG: "EGP",
  KW: "KWD",
  SA: "SAR",
  AE: "AED",
  QA: "QAR",
  BH: "BHD",
  OM: "OMR",
  JO: "JOD",
  GB: "GBP",
};

export const isLang = (v: unknown): v is Lang => v === "en" || v === "ar";
export const isCurrency = (v: unknown): v is CurrencyCode =>
  typeof v === "string" && v in USD_RATES;

export function langForCountry(country: string | null | undefined): Lang | null {
  if (!country) return null;
  return ARABIC_COUNTRIES.has(country.toUpperCase()) ? "ar" : "en";
}

export function currencyForCountry(country: string | null | undefined): CurrencyCode {
  if (!country) return "USD";
  const c = country.toUpperCase();
  if (EUROZONE.has(c)) return "EUR";
  return COUNTRY_CURRENCY[c] ?? "USD";
}

/** Fallback when there's no country header (local dev, other hosts). */
export function langFromAcceptLanguage(header: string | null | undefined): Lang {
  const first = (header || "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ar") ? "ar" : "en";
}

/* ── Budget brackets ─────────────────────────────────────────────────────── */

// The brackets are defined once, in USD, and converted for display.
const BRACKET_EDGES_USD = [2000, 5000, 10000, 25000];

// Round to a figure a person would actually quote: 1, 1.5, 2, 2.5, 3, 4, 5, 7.5 × 10ⁿ.
function niceRound(v: number): number {
  if (v <= 0) return 0;
  const exp = Math.floor(Math.log10(v));
  const base = 10 ** exp;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  const n = v / base;
  let best = steps[0];
  for (const s of steps) if (Math.abs(s - n) < Math.abs(best - n)) best = s;
  return best * base;
}

const EN_SYMBOL: Partial<Record<CurrencyCode, string>> = { USD: "$", EUR: "€", GBP: "£" };

// Currency names as an Arabic speaker would write them after a number.
const AR_NAME: Record<CurrencyCode, string> = {
  USD: "دولار",
  EGP: "جنيه",
  KWD: "دينار كويتي",
  SAR: "ريال",
  AED: "درهم",
  QAR: "ريال قطري",
  BHD: "دينار بحريني",
  OMR: "ريال عماني",
  JOD: "دينار أردني",
  EUR: "يورو",
  GBP: "جنيه إسترليني",
};

/** "2K", "1.5K", "1M" — English compact figures, no trailing ".0". */
const compact = (v: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
    .format(v)
    .replace(/\.0(?=[A-Z]|$)/, "");

/** "100,000" — full figure with Western digits (used in Arabic). */
const full = (v: number) => new Intl.NumberFormat("en").format(v);

/** English money: "$2K", "€1.5K", "EGP 100K". */
function enMoney(v: number, currency: CurrencyCode): string {
  const sym = EN_SYMBOL[currency];
  return sym ? `${sym}${compact(v)}` : `${currency} ${compact(v)}`;
}

export type BudgetBracket = {
  id: string;
  /** What the visitor sees, in their currency and language. */
  label: string;
  /** Stable USD version, stored alongside so the inbox can compare leads. */
  usd: string;
};

export function budgetBrackets(currency: CurrencyCode, lang: Lang): BudgetBracket[] {
  const rate = USD_RATES[currency];
  const [a, b, c, d] = BRACKET_EDGES_USD.map((v) => (currency === "USD" ? v : niceRound(v * rate)));
  const [ua, ub, uc, ud] = BRACKET_EDGES_USD;
  const u = (v: number) => enMoney(v, "USD");
  const usd = [`< ${u(ua)}`, `${u(ua)}–${u(ub)}`, `${u(ub)}–${u(uc)}`, `${u(uc)}–${u(ud)}`, `${u(ud)}+`];

  let labels: string[];
  if (lang === "ar") {
    // The currency name is written once, after the range: "١٠٠٬٠٠٠ – ٢٥٠٬٠٠٠ جنيه"
    // style, but with Western digits to match the rest of the site.
    const n = AR_NAME[currency];
    labels = [
      `أقل من ${full(a)} ${n}`,
      `${full(a)} – ${full(b)} ${n}`,
      `${full(b)} – ${full(c)} ${n}`,
      `${full(c)} – ${full(d)} ${n}`,
      `${full(d)} ${n} فأكثر`,
    ];
  } else {
    const m = (v: number) => enMoney(v, currency);
    // Symbol currencies repeat the symbol ("$2K to $5K"); code currencies
    // name the code once ("EGP 100K to 250K").
    const tail = (v: number) => (EN_SYMBOL[currency] ? m(v) : compact(v));
    labels = [
      `Under ${m(a)}`,
      `${m(a)} to ${tail(b)}`,
      `${m(b)} to ${tail(c)}`,
      `${m(c)} to ${tail(d)}`,
      `${m(d)}+`,
    ];
  }
  return labels.map((label, i) => ({ id: `b${i + 1}`, label, usd: usd[i] }));
}
