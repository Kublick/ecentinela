"use client";

import { createContext, useContext, type ReactNode } from "react";

import { getContent, type Content } from "@/lib/content";
import { DEFAULT_LOCALE, LOCALE_TAGS, localizePath, type Locale } from "@/lib/i18n";

type I18nValue = {
  locale: Locale;
  /** BCP 47 tag for `Intl` formatting (`es-MX`, `en-US`). */
  tag: string;
  content: Content;
  /** Prefix an app path for the current locale. */
  href: (path: string) => string;
};

function createValue(locale: Locale): I18nValue {
  return {
    locale,
    tag: LOCALE_TAGS[locale],
    content: getContent(locale),
    href: (path) => localizePath(locale, path),
  };
}

// One stable value per locale so consumers don't re-render on every parent render.
const VALUES: Record<Locale, I18nValue> = {
  es: createValue("es"),
  en: createValue("en"),
};

const I18nContext = createContext<I18nValue>(VALUES[DEFAULT_LOCALE]);

/**
 * Makes the route's locale available to client components. Rendered by
 * `app/[lang]/layout.tsx`; server components read the locale from `params`
 * and call `getContent()` / `localizePath()` directly instead.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext value={VALUES[locale]}>{children}</I18nContext>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
