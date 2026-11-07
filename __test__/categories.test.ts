import assert from "node:assert/strict";
import test from "node:test";

import { subcategoryRedirect } from "../lib/categories.ts";

const redirect = (path: string) => subcategoryRedirect(new URL(path, "https://shop.test"))?.href;

test("old subcategory URLs redirect to the tag-filtered collection", () => {
  assert.equal(
    redirect("/collections/fuentes-de-poder/abb-fuentes-de-alimentacion?page=2"),
    "https://shop.test/collections/fuentes-de-poder?filter.p.tag=ABB+Fuentes+de++Alimentaci%C3%B3n",
  );
  assert.equal(
    redirect("/en/collections/control-de-motores/control-de-motores"),
    "https://shop.test/en/collections/control-de-motores?filter.p.tag=Control+de+Motores&filter.p.tag=Control+de+motores",
  );
});

test("other paths are left alone", () => {
  assert.equal(redirect("/collections/cables/nope"), undefined);
  assert.equal(redirect("/collections/cables"), undefined);
  assert.equal(redirect("/products/cables/cable-termopar"), undefined);
});
