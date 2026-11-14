import { gql } from "@shopify/hydrogen";

/**
 * Shared `ProductCard` fragment — reused by the home best-sellers grid, the
 * collection/search grids, and the product page's "you may also like" strip
 * Title-only cards; no per-card fan-out.
 */
export const PRODUCT_CARD_FRAGMENT = gql(`
  fragment ProductCard on Product {
    id
    handle
    title
    vendor
    availableForSale
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 2) {
      nodes {
        url
        altText
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
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
`);

/**
 * Thin query that spreads the `ProductCard` fragment so the card data type can
 * be derived via `StorefrontApi.ResultOf` (fragments alone resolve to `never`).
 */
export const PRODUCT_CARD_QUERY = gql(
  `query ProductCardQuery { product(handle: "") { ...ProductCard } }`,
  [PRODUCT_CARD_FRAGMENT],
);

/**
 * Collection table row (`ProductTable`): part number, short description,
 * vendor, datasheet, price, stock and the variant to add to cart.
 *
 * `quantityAvailable` needs the `unauthenticated_read_product_inventory`
 * Storefront API scope, so it is only requested when `$withInventory` is true
 * (`STOREFRONT_INVENTORY_ACCESS` in `.env`). The datasheet is the
 * `custom.datasheet` product metafield (a file reference, or a URL).
 */
export const PRODUCT_ROW_FRAGMENT = gql(`
  fragment ProductRow on Product {
    id
    handle
    title
    vendor
    description(truncateAt: 180)
    availableForSale
    variantsCount {
      count
    }
    featuredImage {
      url
      altText
    }
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
    selectedOrFirstAvailableVariant {
      id
      sku
      title
      availableForSale
      currentlyNotInStock
      quantityAvailable @include(if: $withInventory)
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
    }
  }
`);

/** Thin query that spreads the `ProductRow` fragment for type derivation. */
export const PRODUCT_ROW_QUERY = gql(
  `query ProductRowQuery($withInventory: Boolean!) { product(handle: "") { ...ProductRow } }`,
  [PRODUCT_ROW_FRAGMENT],
);

/**
 * Shared collection-card fragment — used by the collections index and the home
 * "shop by category" grid. Pulls a single product image as a fallback when the
 * collection has no image (F5: no large fan-out for a cosmetic count).
 */
export const COLLECTION_CARD_FRAGMENT = gql(`
  fragment CollectionCard on Collection {
    id
    handle
    title
    description
    image {
      url
      altText
      width
      height
    }
    products(first: 1) {
      nodes {
        featuredImage {
          url
          altText
        }
      }
    }
  }
`);

/**
 * Variant fields fragment — one reusable shape for
 * `firstSelectableVariant`, `selectedOrFirstAvailableVariant`, and
 * `adjacentVariants` (`hydrogen-setup` / `steps/6-product-detail-page.md`). After
 * option selection, `selectedVariant` can come from any of those caches and
 * must still contain the fields the UI needs.
 */
export const VARIANT_FIELDS_FRAGMENT = gql(`
  fragment VariantFields on ProductVariant {
    id
    title
    availableForSale
    currentlyNotInStock
    selectedOptions {
      name
      value
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    image {
      url
      altText
      width
      height
    }
    product {
      title
      handle
    }
    sku
    quantityAvailable @include(if: $withInventory)
  }
`);
