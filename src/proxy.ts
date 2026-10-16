import { NextResponse, type NextRequest } from "next/server";
import {
  CURRENCY_COOKIE,
  CURRENCY_HEADER,
  LANG_COOKIE,
  LANG_HEADER,
  currencyForCountry,
  isCurrency,
  isLang,
  langForCountry,
  langFromAcceptLanguage,
} from "@/lib/locale";

/*
 * Picks the visitor's language and currency before the page renders, so an
 * Arabic visitor gets the RTL site in the first byte — no English flash.
 *
 * Order: ?lang= in the URL  →  the visitor's own choice (cookie)  →  their
 * country (Vercel geo header)  →  their browser language. The country itself
 * is never stored; only the resulting "ar"/"en" and currency code are.
 */

const YEAR = 60 * 60 * 24 * 365;

export function proxy(req: NextRequest) {
  const country =
    req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || null;

  const fromQuery = req.nextUrl.searchParams.get("lang");
  const fromCookie = req.cookies.get(LANG_COOKIE)?.value;
  const lang = isLang(fromQuery)
    ? fromQuery
    : isLang(fromCookie)
      ? fromCookie
      : langForCountry(country) ?? langFromAcceptLanguage(req.headers.get("accept-language"));

  const savedCurrency = req.cookies.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(savedCurrency) ? savedCurrency : currencyForCountry(country);

  // Hand the decision to the root layout through request headers.
  const headers = new Headers(req.headers);
  headers.set(LANG_HEADER, lang);
  headers.set(CURRENCY_HEADER, currency);
  const res = NextResponse.next({ request: { headers } });

  const cookie = { path: "/", maxAge: YEAR, sameSite: "lax" as const };
  if (fromCookie !== lang) res.cookies.set(LANG_COOKIE, lang, cookie);
  if (savedCurrency !== currency) res.cookies.set(CURRENCY_COOKIE, currency, cookie);
  return res;
}

export const config = {
  // Pages only: skip API routes, admin, Next internals and static files.
  matcher: ["/((?!api|admin|_next/static|_next/image|.*\\..*).*)"],
};
