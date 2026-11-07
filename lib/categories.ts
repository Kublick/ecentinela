import categories from "./categories.json" with { type: "json" };

/** Shopify's tag handle: `Fuentes de  Alimentación` → `fuentes-de-alimentacion`. */
function handleize(tag: string) {
  return tag
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * `/collections/{handle}/{tag handle}` → every tag spelling with that handle
 * (`Control de Motores` and `Control de motores` both become `control-de-motores`).
 */
const subcategoryTags = new Map<string, string[]>();
for (const { handle, tags } of categories) {
  for (const tag of tags) {
    const key = `/collections/${handle}/${handleize(tag)}`;
    subcategoryTags.set(key, [...(subcategoryTags.get(key) ?? []), tag]);
  }
}

/**
 * Subcategory URLs from the old Liquid theme (`/collections/cables/cable-termopar`,
 * optionally under `/en`) point to the collection filtered by that product tag.
 * Returns the redirect target, or `null` when the path isn't one of them.
 */
export function subcategoryRedirect(url: URL): URL | null {
  const prefix = url.pathname.startsWith("/en/") ? "/en" : "";
  const tags = subcategoryTags.get(url.pathname.slice(prefix.length));
  if (!tags) return null;
  const target = new URL(url);
  target.pathname = url.pathname.slice(0, url.pathname.lastIndexOf("/"));
  target.search = "";
  for (const tag of tags) target.searchParams.append("filter.p.tag", tag);
  return target;
}

// Tags that name a whole category ("Control de Motores"), not a subcategory.
const categoryTags = new Set([
  ...categories.map((category) => handleize(category.title)),
  "desconectadores-fusibles-proteccion-de-circuitos",
]);

/**
 * A category's subcategories (its tags, minus the category's own tag), sorted
 * by label. Spelling variants of one tag share a link that filters by all of them.
 */
export function subcategories(handle: string): { label: string; href: string }[] {
  const category = categories.find((candidate) => candidate.handle === handle);
  if (!category) return [];
  const groups = new Map<string, string[]>();
  for (const tag of category.tags) {
    const key = handleize(tag);
    if (!categoryTags.has(key)) groups.set(key, [...(groups.get(key) ?? []), tag]);
  }
  return [...groups.values()]
    .map((tags) => ({
      label: tags[0].replace(/\s+/g, " "),
      href: `/collections/${handle}?${new URLSearchParams(tags.map((tag) => ["filter.p.tag", tag]))}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export { categories };
