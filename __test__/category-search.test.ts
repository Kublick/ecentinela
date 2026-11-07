import assert from "node:assert/strict";
import test from "node:test";

import { matchCategories } from "../lib/category-search.ts";

const categories = [
  { label: "Omron Sensores Fotoeléctricos", href: "/a" },
  { label: "Bussmann Fusibles Sistemas Fotovoltaicos", href: "/b" },
  { label: "Cables", href: "/c" },
];

test("matches every word, ignoring case and accents", () => {
  assert.deepEqual(
    matchCategories(categories, "FOTO").map((c) => c.href),
    ["/a", "/b"],
  );
  assert.deepEqual(
    matchCategories(categories, "fotoelectricos omron").map((c) => c.href),
    ["/a"],
  );
});

test("blank term matches nothing", () => {
  assert.deepEqual(matchCategories(categories, "  "), []);
});
