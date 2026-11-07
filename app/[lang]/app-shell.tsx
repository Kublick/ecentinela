import "server-only";
import { connection } from "next/server";
import { Suspense } from "react";

import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeaderAccountLink, HeaderAccountLinkFallback } from "@/components/HeaderAccountLink";
import { cartHandlers } from "@/lib/cart-handlers";
import { getContent } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import { getStorefrontClient } from "@/lib/storefront";

import { Providers } from "./providers";

/**
 * Async server shell that owns the per-request (dynamic) read: the cart seed.
 * With `cacheComponents: true`, uncached/dynamic data accessed in a Server Component
 * must sit inside a `<Suspense>` boundary so the static HTML shell prerenders
 * and the per-buyer parts stream (`next/server` `connection()` +
 * `headers()`/`cookies()` are per-request).
 *
 * Rendered inside `<Suspense>` from the root layout. `await connection()`
 * opts the subtree into dynamic rendering (resolves immediately on a real
 * request, never during prerender).
 */
export async function AppShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  await connection();
  const content = getContent(locale);

  // Cart seed: per-buyer and non-blocking so the shell can stream.
  const cartData = getStorefrontClient().then((storefrontClient) =>
    cartHandlers.get({ storefrontClient }).then((r) => r.data),
  );

  return (
    <Providers cartData={cartData}>
      <a
        href="#main-content"
        className="focus-visible:bg-interactive focus-visible:text-interactive-text sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:start-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded focus-visible:px-4 focus-visible:py-2"
      >
        {content.general.skipToContent}
      </a>

      <Header
        locale={locale}
        accountLink={
          <Suspense fallback={<HeaderAccountLinkFallback locale={locale} />}>
            <HeaderAccountLink locale={locale} />
          </Suspense>
        }
      />

      <main className="flex-1" id="main-content" tabIndex={-1}>
        {children}
      </main>

      <Footer locale={locale} />

      <CartDrawer />
    </Providers>
  );
}
