"use client";

import { ShopifyScripts, type ShopifyScriptsProps } from "@shopify/hydrogen/react";
import { useRouter } from "next/navigation";

import { analyticsConsent } from "@/lib/config";
import type { Market } from "@/lib/markets";
import { routeTemplates } from "@/lib/route-templates";

/**
 * `ShopifyScripts` navigation wrapper (`hydrogen-analytics` / `references/react.md`
 * + `hydrogen-setup` / `references/analytics.md`). The root layout is a server
 * component and cannot call `useRouter`, so `ShopifyScripts` (which needs a
 * `navigate` callback) must live in a client component. Rendered once in the
 * root layout with the locale's market `i18n`, the Storefront API's active
 * `currency` from `getAnalyticsShop()`, and server-resolved shop metadata.
 */
type ShopConfig = NonNullable<ShopifyScriptsProps["shop"]>;

export function ShopifyScriptsWithNavigation({
  shop,
  currency,
  i18n,
}: {
  shop: ShopConfig;
  currency: string;
  i18n: Market;
}) {
  const router = useRouter();
  return (
    <ShopifyScripts
      i18n={{ country: i18n.country, language: i18n.language, currency }}
      shop={shop}
      consent={analyticsConsent}
      navigate={(url: string) => router.push(url)}
      routes={routeTemplates}
    />
  );
}
