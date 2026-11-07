import { gql, type StorefrontApi } from "@shopify/hydrogen";

import { COLLECTION_CARD_FRAGMENT, PRODUCT_ROW_FRAGMENT } from "./fragments";

/** Collections index query (`collections(first: 24)`). */
export const COLLECTIONS_QUERY = gql(
  `
  query CollectionsList($first: Int!, $after: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...CollectionCard
      }
    }
  }
`,
  [COLLECTION_CARD_FRAGMENT],
);

/**
 * Collection PLP query, rendered as an ordering table (`ProductTable`).
 * `filters` and `sortKey`/`reverse` come from `parseCollectionParams`. Pages
 * forward with `first`/`after` and back with `last`/`before`.
 */
export const COLLECTION_QUERY = gql(
  `
  query Collection($handle: String!, $first: Int, $after: String, $last: Int, $before: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $filters: [ProductFilter!], $withInventory: Boolean!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      image {
        url
        altText
        width
        height
      }
      products(first: $first, after: $after, last: $last, before: $before, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
        filters {
          id
          label
          type
          presentation
          values {
            id
            label
            count
            input
            swatch {
              color
              image {
                previewImage {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        nodes {
          ...ProductRow
        }
      }
    }
  }
`,
  [PRODUCT_ROW_FRAGMENT],
);

type CollectionQuery = StorefrontApi.ResultOf<typeof COLLECTION_QUERY>;
type CollectionProducts = NonNullable<CollectionQuery["collection"]>["products"];
export type CollectionAvailableFilter = CollectionProducts["filters"][number];

/**
 * Search query. **`__typename` on `search.nodes` is required** — `search` is a
 * heterogeneous union and without `__typename` gql.tada infers `never` for the
 * node type and all results are dropped (feedback Round 1 + Round 2 #1).
 */
export const SEARCH_QUERY = gql(
  `
  query Search($query: String!, $first: Int!, $after: String, $sortKey: SearchSortKeys, $reverse: Boolean, $productFilters: [ProductFilter!], $withInventory: Boolean!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    search(query: $query, first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, productFilters: $productFilters) {
      totalCount
      productFilters {
        id
        label
        type
        presentation
        values {
          id
          label
          count
          input
          swatch {
            color
            image {
              previewImage {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        __typename
        ... on Product {
          ...ProductRow
        }
      }
    }
  }
`,
  [PRODUCT_ROW_FRAGMENT],
);

type SearchQuery = StorefrontApi.ResultOf<typeof SEARCH_QUERY>;
export type SearchAvailableFilter = NonNullable<SearchQuery["search"]>["productFilters"][number];

/** Shop analytics GID query (root layout, best-effort + non-blocking, F1). */
export const SHOP_ANALYTICS_QUERY = gql(`
  query RootShopAnalytics($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      id
      name
      description
    }
    localization {
      country {
        currency {
          isoCode
        }
      }
    }
  }
`);

/** Sitemap query — all products + collections with `updatedAt`. */
export const SITEMAP_QUERY = gql(`
  query Sitemap($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 250) {
      nodes {
        handle
        updatedAt
      }
    }
    collections(first: 250) {
      nodes {
        handle
        updatedAt
      }
    }
  }
`);
