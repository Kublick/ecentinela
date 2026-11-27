"use server";

import { gql } from "@shopify/hydrogen";

import { DEFAULT_LOCALE, hasLocale } from "./i18n";
import { findVariant } from "./quick-order";
import { getStaticStorefrontClient } from "./storefront-static";

const QUICK_ORDER_PRODUCT_FRAGMENT = gql(`
  fragment QuickOrderProduct on Product {
    handle
    title
    featuredImage {
      url
      altText
    }
    variants(first: 50) {
      nodes {
        id
        sku
        title
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }
  }
`);

/**
 * One part number: the product with that handle plus a term search. The
 * Storefront API ignores a `sku:` filter (it returns unrelated products), so
 * `findVariant` picks the exact SKU/handle/title match from the results.
 */
const QUICK_ORDER_QUERY = gql(
  `query QuickOrderLookup($handle: String!, $query: String!) {
    product(handle: $handle) { ...QuickOrderProduct }
    products(first: 10, query: $query) { nodes { ...QuickOrderProduct } }
  }`,
  [QUICK_ORDER_PRODUCT_FRAGMENT],
);

const MAX_CODES = 100;
const MAX_CODE_LENGTH = 64;

/**
 * Server Action for the quick order form: resolves each part number to its
 * product and variant (`null` when not found), in input order. Runs on the
 * server because the browser can't call the Storefront API directly (CORS
 * rejects the client's `x-hydrogen-version` header). Throws when the
 * Storefront API fails, so the form can tell "not found" from "lookup failed".
 */
export async function lookUpPartNumbers(locale: string, codes: string[]) {
  if (!Array.isArray(codes) || codes.length > MAX_CODES) throw new Error("Invalid part numbers");
  const client = getStaticStorefrontClient(hasLocale(locale) ? locale : DEFAULT_LOCALE);

  return Promise.all(
    codes.map(async (raw) => {
      const code = String(raw).trim().slice(0, MAX_CODE_LENGTH);
      if (!code) return null;
      const { data, errors } = await client.graphql(QUICK_ORDER_QUERY, {
        variables: {
          handle: code.toLowerCase().replace(/\s+/g, "-"),
          // Search syntax characters (quotes, colons, parentheses) would change the query.
          query: code.replace(/["\\:()]/g, " "),
        },
      });
      if (errors) {
        console.error("[hydrogen] Quick order lookup failed", errors);
        throw new Error("Quick order lookup failed");
      }
      const products = data?.products.nodes ?? [];
      const match = findVariant(code, data?.product ? [data.product, ...products] : products);
      if (!match) return null;
      const { handle, title, featuredImage } = match.product;
      return { product: { handle, title, featuredImage }, variant: match.variant };
    }),
  );
}
