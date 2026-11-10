import assert from "node:assert/strict";
import test from "node:test";

import { findVariant } from "../lib/quick-order.ts";

const product = (handle: string, title: string, skus: [string, boolean][]) => ({
  handle,
  title,
  variants: { nodes: skus.map(([sku, availableForSale]) => ({ sku, availableForSale })) },
});

const products = [
  product("fuzzy-hit", "Transformador T1500", [["t1500v0190c-x", true]]),
  product("t1500v0190c", "Transformador 0.5 KVA", [["t1500v0190c", true]]),
  product("selector", "C3SS7-10B-20, selector 3 posiciones", [["1sfa619216r1026", false], ["b", true]]),
];

test("exact SKU wins, ignoring case and spaces", () => {
  assert.equal(findVariant(" T1500V0190C ", products)?.product.handle, "t1500v0190c");
  assert.equal(findVariant("1SFA619216R1026", products)?.variant.sku, "1sfa619216r1026");
});

test("falls back to handle or first title word, preferring an available variant", () => {
  assert.equal(findVariant("C3SS7-10B-20", products)?.variant.sku, "b");
  assert.equal(findVariant("selector", products)?.product.handle, "selector");
});

test("partial or blank codes match nothing", () => {
  assert.equal(findVariant("T1500", products), null);
  assert.equal(findVariant("  ", products), null);
});
