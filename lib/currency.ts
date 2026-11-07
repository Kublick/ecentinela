import type { MoneyV2 } from "@shopify/hydrogen";

/** Display currencies offered by the header picker, in menu order (same set as e-centinela.com). */
export const DISPLAY_CURRENCIES = ["USD", "MXN", "EUR", "CNY"] as const satisfies readonly MoneyV2["currencyCode"][];
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

/** Units of each currency per 1 USD, e.g. `{ USD: 1, MXN: 18.7 }`. */
export type Rates = Partial<Record<string, number>>;

/**
 * Convert a Shopify amount for display only. Checkout still charges the store
 * currency. Returns null when no conversion applies (same currency, or a rate
 * is missing), so callers show the original amount.
 */
export function convertMoney(money: MoneyV2, to: DisplayCurrency, rates: Rates): MoneyV2 | null {
  const from = money.currencyCode;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (to === from || !fromRate || !toRate) return null;
  const amount = (Number(money.amount) / fromRate) * toRate;
  return { amount: amount.toFixed(2), currencyCode: to };
}
