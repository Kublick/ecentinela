import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { DEFAULT_LOCALE, LOCALE_TAGS, LOCALES, localizePath } from "@/lib/i18n";
import { SITEMAP_QUERY } from "@/lib/queries";
import { SITE_ORIGIN } from "@/lib/site";
import { getStaticStorefrontClient } from "@/lib/storefront-static";

/**
 * `/sitemap.xml`. Lists product + collection URLs with `updatedAt` timestamps
 * in every locale (`/products/x` and `/en/products/x`), each with `hreflang`
 * alternates, fetched via the shared static client inside a `use cache`
 * cache-point (catalog, not personalized). mock.shop fallback works.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await fetchSitemap();

  return entries.flatMap((entry) =>
    LOCALES.map((locale) => ({
      url: `${SITE_ORIGIN}${localizePath(locale, entry.path)}`,
      lastModified: entry.lastmod ?? undefined,
      alternates: {
        languages: Object.fromEntries([
          ...LOCALES.map((other) => [
            LOCALE_TAGS[other],
            `${SITE_ORIGIN}${localizePath(other, entry.path)}`,
          ]),
          ["x-default", `${SITE_ORIGIN}${localizePath(DEFAULT_LOCALE, entry.path)}`],
        ]),
      },
    })),
  );
}

type SitemapEntry = { path: string; lastmod?: string };

async function fetchSitemap(): Promise<SitemapEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", "collections");

  const { data, errors } = await getStaticStorefrontClient(DEFAULT_LOCALE).graphql(SITEMAP_QUERY);
  if (errors) {
    console.error("[hydrogen] Sitemap query failed", errors);
  }

  const entries: SitemapEntry[] = [{ path: "/" }, { path: "/collections" }, { path: "/search" }];

  for (const collection of data?.collections?.nodes ?? []) {
    entries.push({
      path: `/collections/${collection.handle}`,
      lastmod: collection.updatedAt ?? undefined,
    });
  }

  for (const product of data?.products?.nodes ?? []) {
    entries.push({
      path: `/products/${product.handle}`,
      lastmod: product.updatedAt ?? undefined,
    });
  }

  return entries;
}
