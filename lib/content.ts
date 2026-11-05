import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import type { Locale } from "./i18n";

/**
 * Storefront copy per locale. `es.ts` defines the shape; `Content` widens its
 * literal strings so `en.ts` can provide different text for the same keys.
 * Safe to import from server and client components.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? readonly Widen<Item>[]
    : { readonly [Key in keyof T]: Widen<T[Key]> };

export type Content = Widen<typeof es>;

const dictionaries: Record<Locale, Content> = { es, en };

export function getContent(locale: Locale): Content {
  return dictionaries[locale];
}

/** Replace `{{ name }}` placeholders with values. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** Pick the `one`/`other` form for `count` and fill `{{ count }}`. */
export function plural(forms: { one: string; other: string }, count: number): string {
  return interpolate(count === 1 ? forms.one : forms.other, { count });
}
