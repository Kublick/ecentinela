import { formatMoney, type MoneyV2 } from "@shopify/hydrogen";

/**
 * App wrapper around Hydrogen's `formatMoney()` (`hydrogen-money` skill).
 * Keeps locale and display options consistent. Never build money strings by
 * concatenation and never compute totals client-side.
 *
 * Pass the page locale's BCP 47 tag (`LOCALE_TAGS[locale]`, or `tag` from
 * `useI18n()`) so amounts format for the shopper's language.
 */
export function formatPrice(money: MoneyV2, locale = "en-US"): string {
  return formatMoney(money, { locale }).toString();
}

/** Format a price range from min/max `MoneyV2` values. */
export function formatPriceRange(min: MoneyV2, max: MoneyV2, locale = "en-US"): string {
  return formatMoney([min, max], { locale }).toString();
}
