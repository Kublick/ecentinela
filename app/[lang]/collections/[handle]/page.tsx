import { parseCollectionParams } from "@shopify/hydrogen";
import type { ProductFilter as StorefrontApiProductFilter } from "@shopify/hydrogen/storefront-api-types";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { CollectionBrowser } from "@/components/CollectionBrowser";
import { getContent } from "@/lib/content";
import { localeAlternates, localizePath, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { COLLECTION_QUERY, type CollectionAvailableFilter } from "@/lib/queries";
import { canonicalUrl } from "@/lib/site";
import { hasInventoryAccess } from "@/lib/storefront-config";
import { getStaticStorefrontClient } from "@/lib/storefront-static";
import { toURLSearchParams } from "@/lib/url-params";

/** Rows per collection table page. */
const PAGE_SIZE = 24;

type Props = PageProps<"/[lang]/collections/[handle]">;

/** Cursor position from the URL: `?after=` pages forward, `?before=` pages back. */
type Cursor = { after?: string; before?: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { handle } = await params;
  const { collection } = await fetchCollection(locale, handle, {}, "");
  const title = collection?.title ?? getContent(locale).collection.breadcrumb;
  const description = collection?.description ?? "";
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/collections/${handle}`),
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl(localizePath(locale, `/collections/${handle}`)),
    },
  };
}

async function fetchCollection(
  locale: Locale,
  handle: string,
  cursor: Cursor,
  searchString: string,
): Promise<{
  collection: Awaited<ReturnType<typeof query>>["collection"] | null;
  products: Awaited<ReturnType<typeof query>>["products"];
  availableFilters: CollectionAvailableFilter[];
  pageInfo: Awaited<ReturnType<typeof query>>["pageInfo"];
}> {
  "use cache";
  cacheLife("minutes");
  cacheTag("collections", "products");

  // Reconstruct URLSearchParams from the serialized search string. `use cache`
  // serializes arguments, so a URLSearchParams passed in loses `.get` — pass a
  // plain string across the cache boundary and parse inside.
  const browse = parseCollectionParams(new URLSearchParams(searchString));
  return query(locale, handle, cursor, browse.filters, browse.sortKey, browse.reverse);
}

async function query(
  locale: Locale,
  handle: string,
  cursor: Cursor,
  filters: ReturnType<typeof parseCollectionParams>["filters"],
  sortKey: ReturnType<typeof parseCollectionParams>["sortKey"],
  reverse: boolean,
) {
  const page = cursor.before
    ? { last: PAGE_SIZE, before: cursor.before }
    : { first: PAGE_SIZE, after: cursor.after };
  const { data, errors } = await getStaticStorefrontClient(locale).graphql(COLLECTION_QUERY, {
    variables: {
      handle,
      ...page,
      withInventory: hasInventoryAccess(),
      filters:
        filters.length > 0
          ? // F13: skill-sanctioned generated-type cast at the query variable
            // boundary (hydrogen-collection-browser/references/react.md).
            (filters as StorefrontApiProductFilter[])
          : undefined,
      sortKey,
      reverse: reverse || undefined,
    },
  });

  if (errors) {
    console.error("[hydrogen] Collection query failed", errors);
  }

  const collection = data?.collection ?? null;
  return {
    collection,
    products: collection?.products.nodes ?? [],
    availableFilters: collection?.products.filters ?? [],
    pageInfo: collection?.products.pageInfo ?? {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const { handle } = await params;
  const urlSearch = toURLSearchParams(await searchParams);
  const cursor: Cursor = {
    after: urlSearch.get("after") ?? undefined,
    before: urlSearch.get("before") ?? undefined,
  };

  const { collection, products, availableFilters, pageInfo } = await fetchCollection(
    locale,
    handle,
    cursor,
    urlSearch.toString(),
  );

  // 404 only when the query has no GraphQL errors and the collection is missing
  // (F8: don't blanket-404 on a Storefront auth error — errors are logged above).
  if (!collection) {
    notFound();
  }

  return (
    <CollectionBrowser
      mode="collection"
      handle={collection.handle}
      collection={{
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        description: collection.description,
        descriptionHtml: collection.descriptionHtml,
      }}
      products={products}
      availableFilters={availableFilters}
      pageInfo={pageInfo}
      dataSearch={urlSearch.toString()}
      showStock={hasInventoryAccess()}
    />
  );
}
