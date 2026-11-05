import type { Metadata } from "next";

import "../globals.css";

import { Suspense } from "react";

import { I18nProvider } from "@/components/I18nProvider";
import { ShopifyScriptsWithNavigation } from "@/components/ShopifyScriptsWithNavigation";
import { getAnalyticsShop } from "@/lib/analytics-shop";
import { shop } from "@/lib/config";
import { getContent } from "@/lib/content";
import { LOCALE_TAGS, LOCALES } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getMarket } from "@/lib/markets";
import { SITE_ORIGIN } from "@/lib/site";

import { AppShell } from "./app-shell";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * Root layout, one per locale (`es` is served unprefixed via `proxy.ts`). With
 * `cacheComponents: true`, the layout is a **static shell** — it prerenders the
 * `<html>`/`<body>` + announcement bar per locale, then wraps the per-request
 * (dynamic) `AppShell` (cart seed + analytics shop + chrome) in `<Suspense>`
 * so the dynamic parts stream while the static shell serves immediately.
 *
 * `metadataBase` is set here for canonical/OG URL resolution (F10). The
 * `<title>` template uses the live `shop.name` (via `getAnalyticsShop`, which
 * is cached for hours) so the browser tab/OG titles match the header brand.
 */
export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  const { shopName } = await getAnalyticsShop();
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: `${shopName} — ${content.home.hero.heading}`,
      template: `%s — ${shopName}`,
    },
    description: content.home.hero.subtitle,
    icons: {
      icon: { url: "/favicon.svg", type: "image/svg+xml" },
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  const { currency } = await getAnalyticsShop();
  return (
    <html lang={LOCALE_TAGS[locale]}>
      <head>
        <ShopifyScriptsWithNavigation shop={shop} currency={currency} i18n={getMarket(locale)} />
      </head>
      <body className="bg-surface text-on-surface font-body flex min-h-svh flex-col antialiased">
        <I18nProvider locale={locale}>
          <div
            role="region"
            aria-label={content.announcement.label}
            className="bg-on-surface px-margin py-2.5 text-center"
          >
            <p className="type-body-sm text-surface">{content.announcement.text}</p>
          </div>

          <Suspense
            fallback={
              <div className="bg-surface text-on-surface-secondary flex-1" aria-busy="true" />
            }
          >
            <AppShell locale={locale}>{children}</AppShell>
          </Suspense>
        </I18nProvider>
      </body>
    </html>
  );
}
