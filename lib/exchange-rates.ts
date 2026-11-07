import "server-only";
import { cacheLife } from "next/cache";

import { DISPLAY_CURRENCIES, type Rates } from "./currency";

// European Central Bank reference rates; free, no key, updated once per working day.
const RATES_URL = `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${DISPLAY_CURRENCIES.filter(
  (code) => code !== "USD",
).join(",")}`;

/**
 * USD-based rates for the currency picker. On failure only USD is returned,
 * so the picker hides and prices show in the store currency.
 */
export async function fetchExchangeRates(): Promise<Rates> {
  "use cache";
  cacheLife("hours");

  try {
    const response = await fetch(RATES_URL, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body: unknown = await response.json();
    const rates: Rates = { USD: 1 };
    const received = body && typeof body === "object" && "rates" in body ? body.rates : null;
    for (const code of DISPLAY_CURRENCIES) {
      const rate = received && typeof received === "object" ? Reflect.get(received, code) : null;
      if (typeof rate === "number" && rate > 0) rates[code] = rate;
    }
    return rates;
  } catch (error) {
    // shortcut: the fallback is cached for the same hours as real rates; fine for a display-only picker.
    console.error("[exchange-rates] falling back to store currency only:", error);
    return { USD: 1 };
  }
}
