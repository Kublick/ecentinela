import { type CacheInstance, handleShopifyRoutes } from "@shopify/hydrogen";
import { getCache } from "@vercel/functions";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { cartHandlers } from "@/lib/cart-handlers";
import {
  createCustomerSessionManager,
  createEphemeralSessionManager,
} from "@/lib/customer-account";
import { getCustomerSessionHandlers } from "@/lib/customer-session-handlers";
import { DEFAULT_LOCALE, LOCALE_MARKETS, localeFromPathname } from "@/lib/i18n";
import { getMarket, localeFromUrl } from "@/lib/markets";
import { predictiveSearchHandlers } from "@/lib/predictive-search-handlers";
import { routeTemplates } from "@/lib/route-templates";
import { createRequestStorefrontClient } from "@/lib/storefront-client";
import { isCustomerAccountsAvailable, resolveStorefrontConfig } from "@/lib/storefront-config";

/**
 * Next.js request lifecycle (`hydrogen-request-handlers` /
 * `references/nextjs.md`). `proxy.ts` runs `handleShopifyRoutes` before framework
 * routing — Hydrogen-owned routes (`/api/cart`, `/api/predictive-search`,
 * `/api/{ver}/graphql.json`, `/admin`, …) short-circuit here. Storefront URL
 * redirects run in `app/not-found.tsx` (post-404), never here.
 *
 * The original request URL is forwarded to Server Components via
 * `requestContext.getForwardedRequestHeaders()` (carries `x-storefront-url` for
 * `not-found.tsx` and `getMarketFromHeaders`). SFAPI response headers are merged
 * onto the forwarded response via `requestContext.applyResponseHeaders`.
 *
 * mock.shop fallback: when no `PRIVATE_STOREFRONT_API_TOKEN` is present, the
 * shared `resolveStorefrontConfig()` falls back to `mock.shop` with tokenless
 * public access so the example runs with zero secrets.
 *
 * Locale routing (`lib/i18n.ts`) runs after the Hydrogen routes: every page
 * lives under `app/[lang]`, so unprefixed paths are rewritten to `/es/...`,
 * `/en/...` passes through, and `/es/...` redirects to the unprefixed URL.
 */
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Hydrogen API routes (`/api/cart`, `/api/predictive-search`) are called from
  // pages, so their language comes from the page URL in `Referer`.
  const locale = pathname.startsWith("/api/")
    ? localeFromUrl(request.headers.get("referer"))
    : localeFromPathname(pathname);

  const cache: CacheInstance | undefined = process.env.VERCEL
    ? getCache({
        namespace: "hydrogen-v1",
        keyHashFunction: (key) => key,
      })
    : undefined;

  // Resolves the buyer IP only for a real store (private client); mock.shop
  // needs neither a token nor a buyer IP.
  const storefrontClient = createRequestStorefrontClient({
    config: resolveStorefrontConfig(),
    request,
    i18n: getMarket(locale),
    cache,
    waitUntil: event.waitUntil.bind(event),
  });
  const { requestContext } = storefrontClient;

  // Sync — no `await` — so the handlers can never be a stray `Promise<boolean>`
  // that's always truthy when spread.
  const customerAccountsAvailable = isCustomerAccountsAvailable();
  const sessionManager = customerAccountsAvailable
    ? await createCustomerSessionManager(request)
    : createEphemeralSessionManager(request);
  const handlers = [
    cartHandlers,
    predictiveSearchHandlers,
    ...(customerAccountsAvailable ? [getCustomerSessionHandlers()] : []),
  ];

  const shopifyRoute = handleShopifyRoutes({
    request,
    requestContext,
    sessionManager,
    storefrontClient,
    routeTemplates,
    handlers,
  });
  if (shopifyRoute) {
    // Matched Hydrogen-owned route.
    // `handleShopifyRoutes` already applies SFAPI response headers onto the
    // short-circuited response internally, so no `applyResponseHeaders` here.
    return shopifyRoute;
  }

  // `/es/...` is the internal path of the unprefixed URL: send it there.
  const defaultPrefix = `/${DEFAULT_LOCALE}`;
  if (pathname === defaultPrefix || pathname.startsWith(`${defaultPrefix}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultPrefix.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  // Forward the original URL (via `x-storefront-url`) + request context headers
  // to Server Components, then merge SFAPI response headers onto the response.
  const requestHeaders = requestContext.getForwardedRequestHeaders();
  const response = needsDefaultLocaleRewrite(pathname)
    ? NextResponse.rewrite(rewriteToDefaultLocale(request), { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });
  requestContext.applyResponseHeaders(response.headers);
  return response;
}

/**
 * Unprefixed page paths render the default locale. API routes, metadata routes
 * and files in `public/` (anything with an extension) are left alone, as are
 * paths that already carry a non-default locale prefix.
 */
function needsDefaultLocaleRewrite(pathname: string) {
  if (pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(pathname)) return false;
  for (const market of Object.values(LOCALE_MARKETS)) {
    const prefix = market.pathPrefix;
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
  }
  return true;
}

function rewriteToDefaultLocale(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return url;
}

export const config = {
  // Exclude static Next assets; keep Hydrogen-owned paths (e.g. /admin,
  // /api/cart, /api/{ver}/graphql.json) reachable.
  matcher: ["/((?!_next/static|_next/image|_next/data|favicon.ico).*)"],
};
