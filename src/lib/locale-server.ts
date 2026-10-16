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
