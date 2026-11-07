import assert from "node:assert/strict";
import test from "node:test";

import { convertMoney } from "../lib/currency.ts";

const rates = { USD: 1, MXN: 18.5, EUR: 0.9 };

test("converts USD to the display currency", () => {
  assert.deepEqual(convertMoney({ amount: "100", currencyCode: "USD" }, "MXN", rates), {
    amount: "1850.00",
    currencyCode: "MXN",
  });
});

test("converts across two non-USD currencies through USD", () => {
  assert.deepEqual(convertMoney({ amount: "185", currencyCode: "MXN" }, "EUR", rates), {
    amount: "9.00",
    currencyCode: "EUR",
  });
});

test("returns null for the same currency or a missing rate", () => {
  assert.equal(convertMoney({ amount: "10", currencyCode: "USD" }, "USD", rates), null);
  assert.equal(convertMoney({ amount: "10", currencyCode: "USD" }, "CNY", rates), null);
});

test("treats catalog placeholder prices as price on request", async () => {
  const { isPriceOnRequest } = await import("../lib/money.ts");
  for (const amount of ["0.0", "9999.0", "99999.0"]) {
    assert.equal(isPriceOnRequest({ amount, currencyCode: "USD" }), true, amount);
  }
  assert.equal(isPriceOnRequest({ amount: "91.05", currencyCode: "USD" }), false);
});
