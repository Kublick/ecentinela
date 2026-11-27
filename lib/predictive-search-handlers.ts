import { createPredictiveSearchServerHandlers, gql } from "@shopify/hydrogen";

/**
 * Predictive search server handlers, registered in the root middleware's
 * `handleShopifyRoutes` wiring. The browser autocomplete endpoint is
 * `/api/predictive-search` by default. The header search dropdown shows query
 * suggestions and products with SKU, brand and a short description. Its
 * categories come from `lib/categories.json`: collections are published only to
 * the Hydrogen channel, which predictive search does not index.
 */
export const predictiveSearchHandlers = createPredictiveSearchServerHandlers({
  types: ["QUERY", "PRODUCT"],
  limit: 6,
  // With a market in @inContext (we always send MX), the default HIDE drops
  // every product, in stock or not. LAST keeps them, sold out at the end.
  unavailableProducts: "LAST",
  fragments: {
    product: gql(`
      fragment PredictiveSearchProductFragment on Product {
        availableForSale
        vendor
        description(truncateAt: 180)
        selectedOrFirstAvailableVariant(
          selectedOptions: []
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          sku
        }
      }
    `),
  },
});

/** Response data of the handler above, including the custom product fields. */
export type HeaderSearchData = Extract<
  Awaited<ReturnType<typeof predictiveSearchHandlers.get>>,
  { type: "json" }
>["data"];
