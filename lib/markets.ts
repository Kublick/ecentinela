import type { I18nConfig } from "@shopify/hydrogen";

import { DEFAULT_LOCALE, LOCALE_MARKETS, localeFromPathname, type Locale } from "./i18n";

/**
 * Markets resolver (`hydrogen-markets`). The market comes from the locale
 * prefix of the browser-facing URL: `/en/...` → English, anything else →
 * Spanish (see `lib/i18n.ts`). Both locales share the `MX` country.
 *
 * Server Components read the original URL from `x-storefront-url`, which
 * `proxy.ts` forwards before rewriting unprefixed paths to `/es/...`.
 */
export type Market = I18nConfig;

export const DEFAULT_MARKET: Market = LOCALE_MARKETS[DEFAULT_LOCALE];

export function getMarket(locale: Locale): Market {
  return LOCALE_MARKETS[locale];
}

/** Locale of an absolute or relative URL string, defaulting to Spanish. */
export function localeFromUrl(url: string | null | undefined): Locale {
  if (!url) return DEFAULT_LOCALE;
  try {
    return localeFromPathname(new URL(url, "http://localhost").pathname);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function getMarketFromHeaders(headers: Pick<Headers, "get">): Market {
  return getMarket(localeFromUrl(headers.get("x-storefront-url")));
}
