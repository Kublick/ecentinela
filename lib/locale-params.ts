import "server-only";
import { notFound } from "next/navigation";

import { hasLocale, type Locale } from "./i18n";

/** Resolve the `[lang]` route param, 404ing on anything that isn't a storefront locale. */
export async function resolveLocale(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return lang;
}
