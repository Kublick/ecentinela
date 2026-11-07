export type Category = { label: string; href: string };

/** Lowercase without accents, so "foto" matches "Fotoeléctricos". */
function fold(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Categories whose label contains every word of the term, at most 6. */
export function matchCategories(categories: Category[], term: string): Category[] {
  const words = fold(term).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return categories.filter(({ label }) => words.every((word) => fold(label).includes(word))).slice(0, 6);
}
