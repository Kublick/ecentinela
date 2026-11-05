import "./globals.css";

import { handleShopifyRedirects } from "@shopify/hydrogen";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { getContent } from "@/lib/content";
import { DEFAULT_LOCALE, LOCALE_TAGS, localizePath, type Locale } from "@/lib/i18n";
import { localeFromUrl } from "@/lib/markets";
import { routeTemplates } from "@/lib/route-templates";
import { getStorefrontClient } from "@/lib/storefront";

export const metadata: Metadata = {
  title: getContent(DEFAULT_LOCALE).notFound.title,
  robots: { index: false },
};

/**
 * 404 for URLs that match no route (`experimental.globalNotFound`). The root
 * layout lives under `app/[lang]`, so there is no layout to compose a 404 from
 * and this file renders its own document. Returning it at the routing level
 * keeps a real `404` status (a `notFound()` thrown inside the streamed
 * `[lang]` layout would send `200`).
 *
 * Shopify URL redirects run here first (`hydrogen-request-handlers` /
 * `references/nextjs.md`): `proxy.ts` forwards the original URL in
 * `x-storefront-url`, and a matching redirect wins over the 404. Gotcha (N2):
 * Next's `redirect()` does not preserve Hydrogen's `301` status.
 *
 * Per-request reads sit inside `<Suspense>` (Cache Components); the fallback
 * is the Spanish message, replaced by the request locale's once it streams.
 */
export default function GlobalNotFound() {
  return (
    <html lang={LOCALE_TAGS[DEFAULT_LOCALE]}>
      <body className="bg-surface text-on-surface font-body flex min-h-svh flex-col antialiased">
        <main className="max-w-page px-margin mx-auto w-full flex-1 py-16 text-center">
          <Suspense fallback={<NotFoundMessage locale={DEFAULT_LOCALE} />}>
            <RedirectOrMessage />
          </Suspense>
        </main>
      </body>
    </html>
  );
}

async function RedirectOrMessage() {
  await connection();
  const url = (await headers()).get("x-storefront-url");

  if (url) {
    const result = await handleShopifyRedirects({
      request: new Request(url),
      storefrontClient: await getStorefrontClient(),
      routeTemplates,
    });
    const location = result?.headers.get("location");
    if (location) redirect(location);
  }

  return <NotFoundMessage locale={localeFromUrl(url)} />;
}

function NotFoundMessage({ locale }: { locale: Locale }) {
  const content = getContent(locale);
  return (
    <div lang={LOCALE_TAGS[locale]}>
      <h1 className="type-display mb-4">{content.notFound.title}</h1>
      <p className="type-body text-on-surface-secondary mb-8">{content.notFound.body}</p>
      <a
        href={localizePath(locale, "/")}
        className="rounded-button button-primary inline-flex h-11 items-center justify-center px-5 text-sm font-medium no-underline"
      >
        {content.notFound.backHome}
      </a>
    </div>
  );
}
