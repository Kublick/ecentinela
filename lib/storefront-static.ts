import "server-only";
import type { Locale } from "./i18n";
import { getMarket } from "./markets";
import { createStaticStorefrontClient, type StaticStorefrontClient } from "./storefront-client";
import { resolveStorefrontConfig } from "./storefront-config";

/**
 * Shared-rate-limit Storefront clients for **all catalog reads**, one per
 * locale. Module-scoped: no `headers()` → no buyer IP, shared throttle bucket.
 * Private (no buyer context) against a real store; tokenless public on
 * mock.shop.
 *
 * Catalog pages (home, collections index, collection PLP, product, search,
 * sitemap, related products, shop analytics GID) fetch through these clients.
 * Only the cart seed uses the per-buyer `getStorefrontClient()`.
 *
 * Caching lives at the `use cache` boundary (cache-points keyed by serializable
 * inputs, which include the locale). The `cache:` option is never passed to
 * `graphql()` — Next native data cache + `cacheLife`/`cacheTag` replace the
 * Oxygen sub-request LRU.
 */
const clients = new Map<Locale, StaticStorefrontClient>();

export function getStaticStorefrontClient(locale: Locale): StaticStorefrontClient {
  let client = clients.get(locale);
  if (!client) {
    client = createStaticStorefrontClient({
      config: resolveStorefrontConfig(),
      request: { headers: new Headers() },
      i18n: getMarket(locale),
    });
    clients.set(locale, client);
  }
  return client;
}
