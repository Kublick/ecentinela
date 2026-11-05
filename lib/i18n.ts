import type { I18nConfig } from "@shopify/hydrogen";

/**
 * Storefront locales. Spanish is the default and is served without a prefix
 * (`/products/x`); English lives under `/en` (`/en/products/x`), matching the
 * live e-centinela.com URLs.
 *
 * `proxy.ts` rewrites unprefixed URLs to `/es/...` internally so every page
 * lives under `app/[lang]`, and redirects an explicit `/es/...` back to the
 * unprefixed URL so there is a single canonical address per page.
 */
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

/**
 * Storefront API context per locale. The country stays `MX` for both
 * languages: it selects the market (and currency), not the language.
 * `pathPrefix` lets Hydrogen prefix the redirects and variant URLs it builds.
 */
export const LOCALE_MARKETS = {
  es: { country: "MX", language: "ES", pathPrefix: "" },
  en: { country: "MX", language: "EN", pathPrefix: "/en" },
} satisfies Record<Locale, I18nConfig>;

/** BCP 47 tags for `<html lang>`, `hreflang` and `Intl` formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  es: "es-MX",
  en: "en-US",
};

export function hasLocale(value: string): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

/** Prefix an app path (`/products/x?y=1`) for the given locale. */
export function localizePath(locale: Locale, path: string): string {
  const prefix = LOCALE_MARKETS[locale].pathPrefix;
  if (!prefix) return path;
  if (path === "/") return prefix;
  if (path.startsWith("/?")) return `${prefix}${path.slice(1)}`;
  return `${prefix}${path}`;
}

/** Locale of a browser-facing pathname (`/en/...` → `en`, anything else → `es`). */
export function localeFromPathname(pathname: string): Locale {
  for (const locale of LOCALES) {
    const prefix = LOCALE_MARKETS[locale].pathPrefix;
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) return locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * `alternates` metadata for a page: canonical in the current locale plus
 * `hreflang` links to every locale and `x-default` (the Spanish URL).
 */
export function localeAlternates(locale: Locale, path: string) {
  const languages: Record<string, string> = {};
  for (const other of LOCALES) {
    languages[LOCALE_TAGS[other]] = localizePath(other, path);
  }
  languages["x-default"] = localizePath(DEFAULT_LOCALE, path);
  return { canonical: localizePath(locale, path), languages };
}
