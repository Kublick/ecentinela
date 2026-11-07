import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";

import "../globals.css";

import { Suspense } from "react";

import { CurrencyProvider } from "@/components/CurrencyProvider";
import { I18nProvider } from "@/components/I18nProvider";
import { ShopifyScriptsWithNavigation } from "@/components/ShopifyScriptsWithNavigation";
import { getAnalyticsShop } from "@/lib/analytics-shop";
import { shop } from "@/lib/config";
import { getContent } from "@/lib/content";
import { fetchExchangeRates } from "@/lib/exchange-rates";
import { LOCALE_TAGS, LOCALES } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getMarket } from "@/lib/markets";
import { isIndexingAllowed, SITE_ORIGIN } from "@/lib/site";

import { AppShell } from "./app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
});

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
  const shopName = "Eléctrica Centinela";
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: `${shopName} — ${content.home.hero.heading}`,
      template: `%s — ${shopName}`,
    },
    description: content.home.hero.subtitle,
    // Sandbox/preview deployments: `noindex` on every page (see `isIndexingAllowed`).
    ...(isIndexingAllowed() ? {} : { robots: { index: false, follow: false } }),
    icons: {
      icon: { url: "/brand/favicon.ico" },
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  const [{ currency }, rates] = await Promise.all([getAnalyticsShop(), fetchExchangeRates()]);
  return (
    <html lang={LOCALE_TAGS[locale]} className={`${inter.variable} ${plexMono.variable}`}>
      <head>
        <ShopifyScriptsWithNavigation shop={shop} currency={currency} i18n={getMarket(locale)} />
      </head>
      <body className="bg-surface text-on-surface font-body flex min-h-svh flex-col antialiased">
        <I18nProvider locale={locale}>
          <CurrencyProvider base={currency} rates={rates}>
          <div
            role="region"
            aria-label={content.announcement.label}
            className="bg-secondary text-sm text-white"
          >
            <div className="max-w-page px-margin mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2 md:justify-between">
              <p className="font-medium">{content.announcement.text}</p>
              <p className="hidden gap-5 md:flex">
                {content.announcement.extras.map((extra) => (
                  <span key={extra}>{extra}</span>
                ))}
              </p>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="bg-surface text-on-surface-secondary flex-1" aria-busy="true" />
            }
          >
            <AppShell locale={locale}>{children}</AppShell>
          </Suspense>
          </CurrencyProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
