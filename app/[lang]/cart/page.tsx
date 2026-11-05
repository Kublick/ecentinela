import type { Metadata } from "next";
import { Suspense } from "react";

import { CartCheckoutButton } from "@/components/CartCheckoutButton";
import { CartContent } from "@/components/CartContent";
import { CartViewedTracker } from "@/components/CartViewedTracker";
import { getContent } from "@/lib/content";
import { localeAlternates, localizePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/cart">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  return {
    title: content.cart.title,
    description: content.cart.title,
    alternates: localeAlternates(locale, "/cart"),
    openGraph: {
      title: content.cart.title,
      type: "website",
      url: canonicalUrl(localizePath(locale, "/cart")),
    },
  };
}

/**
 * `/cart` is the drawer's fallback route.
 * Renders `CartContent` (client) INSIDE the root layout's existing
 * `CartProvider` — does **NOT** re-mount `CartProvider`. A per-page second
 * `CartProvider` would create a divergent inner store vs the root-rendered
 * `CartDrawer` — mutations would not reflect across them.
 *
 * `force-dynamic` is not allowed with `cacheComponents: true`; the per-request
 * `AppShell` calls `connection()` and reads `headers()` for the cart seed.
 * Reachable via the footer `/cart` link when the drawer is unavailable.
 */
export default async function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const content = getContent(await resolveLocale(params));
  return (
    <div className="max-w-page px-margin mx-auto w-full py-8">
      <h1 className="type-display mb-8">{content.cart.title}</h1>

      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<div role="status">{content.cart.loading}</div>}>
          <CartContent />
          <CartCheckoutButton />
          <CartViewedTracker />
        </Suspense>
      </div>
    </div>
  );
}
