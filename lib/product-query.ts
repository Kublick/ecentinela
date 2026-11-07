import { gql, type StorefrontApi } from "@shopify/hydrogen";

import { PRODUCT_CARD_FRAGMENT, VARIANT_FIELDS_FRAGMENT } from "./fragments";

/**
 * Product detail query (`hydrogen-setup` / `steps/6-product-detail-page.md` +
 * `hydrogen-variant-form`). Derives URL-selected options with
 * `getSelectedProductOptions`, includes the variant-form encoded fields, and
 * uses one reusable `VariantFields` fragment across all variant caches.
 * `$withInventory` adds `quantityAvailable` (see `hasInventoryAccess`).
 */
export const PRODUCT_QUERY = gql(
  `
  query Product($handle: String!, $selectedOptions: [SelectedOptionInput!]!, $withInventory: Boolean!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      description
      descriptionHtml
      requiresSellingPlan
      datasheet: metafield(namespace: "custom", key: "datasheet") {
        type
        value
        reference {
          ... on GenericFile {
            url
          }
          ... on MediaImage {
            image {
              url
            }
          }
        }
      }
      options {
        name
        optionValues {
          name
          firstSelectableVariant {
            ...VariantFields
          }
          swatch {
            color
            image {
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      }
      encodedVariantExistence
      encodedVariantAvailability
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...VariantFields
      }
      adjacentVariants(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...VariantFields
      }
      media(first: 8) {
        nodes {
          __typename
          id
          mediaContentType
          alt
          ... on MediaImage {
            image {
              url
              altText
              width
              height
            }
          }
          previewImage {
            url
            altText
            width
            height
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      collections(first: 1) {
        nodes {
          handle
          title
        }
      }
    }
  }
`,
  [VARIANT_FIELDS_FRAGMENT],
);

const RELATED_PRODUCT_FRAGMENT = gql(
  `
  fragment RelatedProduct on Product {
    ...ProductCard
    selectedOrFirstAvailableVariant {
      id
      title
      availableForSale
      price {
        amount
        currencyCode
      }
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);

/**
 * Related products query for the "you may also like" reel (cards + quick add):
 * the first collection's in-stock products, plus its first products as a
 * fallback, so the page can list in-stock items first.
 */
export const RELATED_PRODUCTS_QUERY = gql(
  `
  query RelatedProducts($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      relatedProducts: collections(first: 1) {
        nodes {
          inStock: products(first: 15, filters: [{ available: true }]) {
            nodes {
              ...RelatedProduct
            }
          }
          products(first: 15) {
            nodes {
              ...RelatedProduct
            }
          }
        }
      }
    }
  }
`,
  [RELATED_PRODUCT_FRAGMENT],
);

/** The typed product data consumed by the React product bindings. */
export type ProductData = NonNullable<StorefrontApi.ResultOf<typeof PRODUCT_QUERY>["product"]>;
