"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { LOCALE_MARKETS, LOCALE_TAGS, localeFromPathname, localizePath, type Locale } from "@/lib/i18n";

import { useI18n } from "./I18nProvider";

const linkClassName =
  "text-on-surface focus-visible:outline-accent inline-flex h-11 items-center rounded px-2 text-sm no-underline hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Link to the same page in the other language (`/products/x` ⇄ `/en/products/x`).
 * Plain `<a>` so the root layout re-renders with the new `<html lang>`.
 * Must sit inside `<Suspense>` (it reads `useSearchParams`); use
 * `LanguageSwitchFallback` there.
 */
export function LanguageSwitch() {
  const { locale, content } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const target = otherLocale(locale);
  const href = localizePath(target, stripLocale(pathname)) + (search ? `?${search}` : "");

  return (
    <a
      href={href}
      hrefLang={LOCALE_TAGS[target]}
      lang={LOCALE_TAGS[target]}
      aria-label={content.general.languageSwitch.label}
      className={linkClassName}
    >
      {content.general.languageSwitch.target}
    </a>
  );
}

/** Pre-hydration fallback: the other language's home page. */
export function LanguageSwitchFallback() {
  const { locale, content } = useI18n();
  const target = otherLocale(locale);
  return (
    <a
      href={localizePath(target, "/")}
      hrefLang={LOCALE_TAGS[target]}
      lang={LOCALE_TAGS[target]}
      aria-label={content.general.languageSwitch.label}
      className={linkClassName}
    >
      {content.general.languageSwitch.target}
    </a>
  );
}

function otherLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es";
}

/** `/en/products/x` → `/products/x`; unprefixed paths are returned as-is. */
function stripLocale(pathname: string): string {
  const prefix = LOCALE_MARKETS[localeFromPathname(pathname)].pathPrefix;
  if (!prefix) return pathname;
  return pathname.slice(prefix.length) || "/";
}
