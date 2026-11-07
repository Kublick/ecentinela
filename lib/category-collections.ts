import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { categories } from "./categories";
import type { Locale } from "./i18n";
import { COLLECTIONS_QUERY } from "./queries";
import { getStaticStorefrontClient } from "./storefront-static";

/**
 * The e-centinela.com categories (`lib/categories.json`) as Shopify
 * collections, in the live site's order. Falls back to every collection when
 * the store has none of them (mock.shop, or before
 * `scripts/sync-categories.mjs` has run).
 */
export async function fetchCategoryCollections(locale: Locale) {
  "use cache";
  cacheLife("hours");
  cacheTag("collections");

  const { data, errors } = await getStaticStorefrontClient(locale).graphql(COLLECTIONS_QUERY, {
    variables: { first: 250 },
  });
  if (errors) {
    console.error("[hydrogen] Collections query failed", errors);
  }
  const collections = data?.collections?.nodes ?? [];
  const byHandle = new Map(collections.map((collection) => [collection.handle, collection]));
  const ordered = categories.flatMap(({ handle }) => byHandle.get(handle) ?? []);
  return (ordered.length > 0 ? ordered : collections).map((collection) => ({
    ...collection,
    thumbnail: collection.image ?? collection.products.nodes[0]?.featuredImage ?? null,
  }));
}
