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

/** Any ISO 4217 code, e.g. "EGP". Validated against the rate table in use. */
export type CurrencyCode = string;

/** Units of each currency per 1 USD. */
export type Rates = Record<string, number>;

/*
 * Fallback rates, used only when the live feed (src/lib/fx.ts) can't be
 * reached. Pegged currencies (Gulf, JOD, HKD…) are exact; the rest are
 * approximate and only steer the rounding of the budget brackets.
 */
export const FALLBACK_RATES: Rates = {
  USD: 1, EUR: 0.86, GBP: 0.75, CHF: 0.8, CAD: 1.37, AUD: 1.52, NZD: 1.68,
  JPY: 150, CNY: 7.15, HKD: 7.8, SGD: 1.3, INR: 85, PKR: 280, BDT: 120,
  IDR: 16300, MYR: 4.3, THB: 33, PHP: 57, VND: 25500, KRW: 1380, TWD: 31,
  TRY: 41, RUB: 85, UAH: 41, PLN: 3.7, CZK: 21.5, HUF: 350, RON: 4.4,
  SEK: 9.6, NOK: 10.2, DKK: 6.4, ZAR: 17.8, NGN: 1500, KES: 129, GHS: 12,
  MAD: 9.1, DZD: 131, TND: 2.95, LYD: 5.4, EGP: 48, SDG: 600, IQD: 1310,
  LBP: 89500, SYP: 13000, YER: 240, ILS: 3.4, IRR: 42000, KWD: 0.307,
  SAR: 3.75, AED: 3.6725, QAR: 3.64, BHD: 0.376, OMR: 0.3845, JOD: 0.709,
  BRL: 5.5, MXN: 18.5, ARS: 1200, CLP: 940, COP: 4000, PEN: 3.6,
};

/* Primary currency of every country (ISO 3166-1 alpha-2 → ISO 4217). */
const COUNTRY_CURRENCY_TABLE =
  "AD:EUR AE:AED AF:AFN AG:XCD AI:XCD AL:ALL AM:AMD AO:AOA AR:ARS AS:USD AT:EUR AU:AUD AW:AWG AX:EUR AZ:AZN " +
  "BA:BAM BB:BBD BD:BDT BE:EUR BF:XOF BG:BGN BH:BHD BI:BIF BJ:XOF BL:EUR BM:BMD BN:BND BO:BOB BQ:USD BR:BRL BS:BSD BT:BTN BW:BWP BY:BYN BZ:BZD " +
  "CA:CAD CC:AUD CD:CDF CF:XAF CG:XAF CH:CHF CI:XOF CK:NZD CL:CLP CM:XAF CN:CNY CO:COP CR:CRC CU:CUP CV:CVE CW:ANG CX:AUD CY:EUR CZ:CZK " +
  "DE:EUR DJ:DJF DK:DKK DM:XCD DO:DOP DZ:DZD EC:USD EE:EUR EG:EGP EH:MAD ER:ERN ES:EUR ET:ETB FI:EUR FJ:FJD FK:FKP FM:USD FO:DKK FR:EUR " +
  "GA:XAF GB:GBP GD:XCD GE:GEL GF:EUR GG:GBP GH:GHS GI:GIP GL:DKK GM:GMD GN:GNF GP:EUR GQ:XAF GR:EUR GT:GTQ GU:USD GW:XOF GY:GYD " +
  "HK:HKD HN:HNL HR:EUR HT:HTG HU:HUF ID:IDR IE:EUR IL:ILS IM:GBP IN:INR IO:USD IQ:IQD IR:IRR IS:ISK IT:EUR JE:GBP JM:JMD JO:JOD JP:JPY " +
  "KE:KES KG:KGS KH:KHR KI:AUD KM:KMF KN:XCD KP:KPW KR:KRW KW:KWD KY:KYD KZ:KZT LA:LAK LB:LBP LC:XCD LI:CHF LK:LKR LR:LRD LS:LSL LT:EUR LU:EUR LV:EUR LY:LYD " +
  "MA:MAD MC:EUR MD:MDL ME:EUR MF:EUR MG:MGA MH:USD MK:MKD ML:XOF MM:MMK MN:MNT MO:MOP MP:USD MQ:EUR MR:MRU MS:XCD MT:EUR MU:MUR MV:MVR MW:MWK MX:MXN MY:MYR MZ:MZN " +
  "NA:NAD NC:XPF NE:XOF NF:AUD NG:NGN NI:NIO NL:EUR NO:NOK NP:NPR NR:AUD NU:NZD NZ:NZD OM:OMR PA:PAB PE:PEN PF:XPF PG:PGK PH:PHP PK:PKR PL:PLN PM:EUR PN:NZD PR:USD PS:ILS PT:EUR PW:USD PY:PYG " +
  "QA:QAR RE:EUR RO:RON RS:RSD RU:RUB RW:RWF SA:SAR SB:SBD SC:SCR SD:SDG SE:SEK SG:SGD SH:SHP SI:EUR SK:EUR SL:SLE SM:EUR SN:XOF SO:SOS SR:SRD SS:SSP ST:STN SV:USD SX:ANG SY:SYP SZ:SZL " +
  "TC:USD TD:XAF TG:XOF TH:THB TJ:TJS TK:NZD TL:USD TM:TMT TN:TND TO:TOP TR:TRY TT:TTD TV:AUD TW:TWD TZ:TZS UA:UAH UG:UGX UM:USD US:USD UY:UYU UZ:UZS " +
  "VA:EUR VC:XCD VE:VES VG:USD VI:USD VN:VND VU:VUV WF:XPF WS:WST XK:EUR YE:YER YT:EUR ZA:ZAR ZM:ZMW ZW:USD";

const COUNTRY_CURRENCY: Record<string, string> = Object.fromEntries(
  COUNTRY_CURRENCY_TABLE.split(" ").map((pair) => pair.split(":") as [string, string])
);

export const isLang = (v: unknown): v is Lang => v === "en" || v === "ar";
/** Shape check only (three capital letters); the rate table decides if it's usable. */
export const isCurrency = (v: unknown): v is CurrencyCode =>
  typeof v === "string" && /^[A-Z]{3}$/.test(v);

export function langForCountry(country: string | null | undefined): Lang | null {
  if (!country) return null;
  return ARABIC_COUNTRIES.has(country.toUpperCase()) ? "ar" : "en";
}

export function currencyForCountry(country: string | null | undefined): CurrencyCode {
  if (!country) return "USD";
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? "USD";
}

/** Fallback when there's no country header (local dev, other hosts). */
export function langFromAcceptLanguage(header: string | null | undefined): Lang {
  const first = (header || "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ar") ? "ar" : "en";
}

/* ── Budget brackets ─────────────────────────────────────────────────────── */

/*
 * Bracket edges, defined once in USD and converted for display. The first
 * edge (≈ $1K) rounds to 50,000 in EGP for any rate between ~44 and ~62.
 */
const BRACKET_EDGES_USD = [1000, 2000, 3500, 5000, 10000, 25000, 50000];

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

// Short Arabic names for the common currencies; anything else comes from
// Intl.DisplayNames ("فرنك سويسري", …).
const AR_NAME: Record<string, string> = {
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

const displayNames: Partial<Record<Lang, Intl.DisplayNames>> = {};

/** "Egyptian Pound" / "جنيه مصري". Falls back to the code itself. */
export function currencyName(code: string, lang: Lang): string {
  try {
    displayNames[lang] ??= new Intl.DisplayNames([lang], { type: "currency" });
    return displayNames[lang]!.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "$", "€", "EGP", "CA$" — how English writes the currency next to a number. */
export function currencySymbol(code: string): string {
  try {
    const part = new Intl.NumberFormat("en", { style: "currency", currency: code })
      .formatToParts(1)
      .find((p) => p.type === "currency");
    return part?.value ?? code;
  } catch {
    return code;
  }
}

/** "2K", "1.5K", "1M" — English compact figures, no trailing ".0". */
const compact = (v: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
    .format(v)
    .replace(/\.0(?=[A-Z]|$)/, "");

/** "100,000" — full figure with Western digits (used in Arabic). */
const full = (v: number) => new Intl.NumberFormat("en").format(v);

/** English money: "$2K", "€1.5K", "EGP 100K". */
function enMoney(v: number, code: string): string {
  const sym = currencySymbol(code);
  return /^[A-Za-z]{2,}$/.test(sym) ? `${sym} ${compact(v)}` : `${sym}${compact(v)}`;
}

export type BudgetBracket = {
  id: string;
  /** What the visitor sees, in their currency and language. */
  label: string;
  /** Stable USD version, stored alongside so the inbox can compare leads. */
  usd: string;
};

export function budgetBrackets(currency: CurrencyCode, lang: Lang, rates: Rates = FALLBACK_RATES): BudgetBracket[] {
  const rate = currency === "USD" ? 1 : rates[currency];
  const code = rate ? currency : "USD";
  const k = rate ?? 1;

  // Convert + round, then drop any edge that rounding pushed onto its neighbour.
  const pairs: { local: number; usd: number }[] = [];
  for (const usd of BRACKET_EDGES_USD) {
    const local = code === "USD" ? usd : niceRound(usd * k);
    if (!pairs.length || local > pairs[pairs.length - 1].local) pairs.push({ local, usd });
  }

  const u = (v: number) => enMoney(v, "USD");
  const brackets: { from: number; to?: number; uf: number; ut?: number }[] = pairs.map((p, i) => ({
    from: p.local,
    to: pairs[i + 1]?.local,
    uf: p.usd,
    ut: pairs[i + 1]?.usd,
  }));

  return brackets.map((b, i) => {
    let label: string;
    if (lang === "ar") {
      // Currency named once, after the range, Western digits like the rest of the site.
      const n = AR_NAME[code] ?? currencyName(code, "ar");
      label = b.to ? `${full(b.from)} – ${full(b.to)} ${n}` : `${full(b.from)} ${n} فأكثر`;
    } else {
      // Symbol currencies repeat the symbol ("$2K to $5K"); code currencies
      // name the code once ("EGP 50K to 100K").
      const symbolic = !/^[A-Za-z]{2,}$/.test(currencySymbol(code));
      const tail = (v: number) => (symbolic ? enMoney(v, code) : compact(v));
      label = b.to ? `${enMoney(b.from, code)} to ${tail(b.to)}` : `${enMoney(b.from, code)}+`;
    }
    const usd = b.ut ? `${u(b.uf)}–${u(b.ut)}` : `${u(b.uf)}+`;
    return { id: `b${i + 1}`, label, usd };
  });
}

/** Currencies to offer in the switcher: everything we have a rate for. */
export function currencyOptions(rates: Rates): string[] {
  const codes = Object.keys(rates).filter((c) => /^[A-Z]{3}$/.test(c));
  let supported: Set<string> | null = null;
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    if (intl.supportedValuesOf) supported = new Set(intl.supportedValuesOf("currency"));
  } catch {}
  return codes.filter((c) => !supported || supported.has(c)).sort();
}
