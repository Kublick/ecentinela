import type { Metadata } from "next";
import Link from "next/link";

import { fetchCategoryCollections } from "@/lib/category-collections";
import { getContent } from "@/lib/content";
import { shopifyImageUrl } from "@/lib/image";
import { localeAlternates, localizePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  return {
    title: content.home.hero.heading,
    description: content.home.hero.subtitle,
    alternates: localeAlternates(locale, "/"),
    openGraph: {
      title: content.home.hero.heading,
      description: content.home.hero.subtitle,
      type: "website",
      url: canonicalUrl(localizePath(locale, "/")),
    },
  };
}

/** Brand strip: logos from e-centinela.com, each opening a search for the brand. */
const BRANDS = [
  { name: "Bussmann", src: "/brands/bussmann.png" },
  { name: "Eaton", src: "/brands/eaton.png" },
  { name: "ABB", src: "/brands/abb.png" },
  { name: "Finder", src: "/brands/finder.png" },
  { name: "Legrand", src: "/brands/legrand.jpg" },
  { name: "Weidmuller", src: "/brands/weidmuller.png" },
  { name: "Siemens", src: "/brands/siemens.png" },
  { name: "Fluke", src: "/brands/fluke.png" },
];

/**
 * Home, laid out like a distributor directory rather than a promo page: a
 * part-number search, the 23 categories as pictures (the full index with every
 * subcategory is `/collections`), the brand strip and the store's service promises.
 */
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  const collections = await fetchCategoryCollections(locale);

  return (
    <>
      <section className="border-border border-b bg-[#f5f6f8]">
        <div className="max-w-page px-margin mx-auto flex flex-col gap-4 py-10 md:py-12">
          <h1 className="text-primary-dark text-3xl font-bold tracking-tight md:text-4xl">
            {content.home.searchHeading}
          </h1>
          <p className="text-on-surface-secondary max-w-2xl text-base">
            {content.home.searchIntro}
          </p>
          <form
            action={localizePath(locale, "/search")}
            method="get"
            role="search"
            className="mt-1 flex max-w-3xl"
          >
            <label htmlFor="home-search-q" className="sr-only">
              {content.general.search}
            </label>
            <input
              id="home-search-q"
              name="q"
              type="search"
              autoComplete="off"
              placeholder={content.home.searchPlaceholder}
              className="border-primary h-13 rounded-e-none border-[1.5px] border-e-0 text-base"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark h-13 shrink-0 rounded-e-[var(--radius-input)] px-6 text-base font-semibold text-white"
            >
              {content.general.search}
            </button>
          </form>
        </div>
      </section>

      <section aria-labelledby="home-categories" className="max-w-page px-margin mx-auto w-full py-10">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 id="home-categories" className="text-primary-dark text-2xl font-bold">
            {content.home.categories}
          </h2>
          <Link href={localizePath(locale, "/collections")} className="text-link font-semibold">
            {content.header.allCategories} →
          </Link>
        </div>
        <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link
                href={localizePath(locale, `/collections/${collection.handle}`)}
                className="border-border group flex h-full flex-col items-center gap-3 rounded-lg border p-3 text-center no-underline hover:border-primary hover:shadow-sm"
              >
                <span className="flex aspect-square w-full max-w-28 items-center justify-center">
                  {collection.thumbnail ? (
                    <img
                      src={shopifyImageUrl(collection.thumbnail.url, { width: 224 })}
                      alt=""
                      width={112}
                      height={112}
                      loading="lazy"
                      className="size-full object-contain"
                    />
                  ) : null}
                </span>
                <span className="text-primary-dark text-sm leading-snug font-semibold group-hover:underline">
                  {collection.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-brands" className="max-w-page px-margin mx-auto w-full pb-10">
        <h2 id="home-brands" className="text-primary-dark mb-4 text-2xl font-bold">
          {content.home.brands}
        </h2>
        <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BRANDS.map((brand) => (
            <li key={brand.name}>
              <Link
                href={localizePath(locale, `/search?q=${encodeURIComponent(brand.name)}`)}
                aria-label={brand.name}
                className="border-border flex h-18 items-center justify-center rounded-lg border px-3 py-2 hover:shadow-sm"
              >
                <img
                  src={brand.src}
                  alt=""
                  loading="lazy"
                  className="max-h-11 max-w-full object-contain"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-border border-y bg-[#f5f6f8]">
        <ul
          role="list"
          className="max-w-page px-margin mx-auto grid grid-cols-1 gap-6 py-7 sm:grid-cols-2 lg:grid-cols-4"
        >
          {content.home.service.map((item) => (
            <li key={item.title} className="flex flex-col gap-1">
              <strong className="text-primary-dark">{item.title}</strong>
              <span className="text-on-surface-secondary text-sm">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
