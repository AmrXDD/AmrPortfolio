import "server-only";
import { headers } from "next/headers";
import { CURRENCY_HEADER, LANG_HEADER, isCurrency, isLang, type CurrencyCode, type Lang } from "./locale";

/** Language + currency src/proxy.ts picked for this request (English when the proxy didn't run, e.g. /admin). */
export async function visitorLocale(): Promise<{ lang: Lang; currency: CurrencyCode }> {
  const h = await headers();
  const lang = h.get(LANG_HEADER);
  const currency = h.get(CURRENCY_HEADER);
  return { lang: isLang(lang) ? lang : "en", currency: isCurrency(currency) ? currency : "USD" };
}

/** Whether this request comes from a phone (Client Hints, else the user agent).
 *  Only a first guess for the layout; the page corrects it on the device. */
export async function visitorIsPhone(): Promise<boolean> {
  const h = await headers();
  const hint = h.get("sec-ch-ua-mobile");
  if (hint) return hint === "?1";
  return /Mobi|Android.+Mobile|iPhone|iPod/i.test(h.get("user-agent") ?? "");
}
