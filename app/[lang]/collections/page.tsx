import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { subcategories } from "@/lib/categories";
import { fetchCategoryCollections } from "@/lib/category-collections";
import { getContent, interpolate } from "@/lib/content";
import { shopifyImageUrl } from "@/lib/image";
import { localeAlternates, localizePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/collections">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  return {
    title: content.collections.title,
    description: content.collections.description,
    alternates: localeAlternates(locale, "/collections"),
    openGraph: {
      title: content.collections.title,
      type: "website",
      url: canonicalUrl(localizePath(locale, "/collections")),
    },
  };
}

/**
 * The full catalog index: a jump list of the 23 categories, then every
 * category with all of its subcategories in columns. The home page only shows
 * the categories themselves; this is where every product line is one click away.
 */
export default async function CollectionsPage({ params }: PageProps<"/[lang]/collections">) {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  const collections = await fetchCategoryCollections(locale);

  return (
    <div className="max-w-page px-margin mx-auto w-full py-8">
      <div className="mb-4">
        <Breadcrumbs locale={locale} items={[{ label: content.collections.title }]} />
      </div>

      <h1 className="text-primary-dark text-3xl font-bold">{content.collections.title}</h1>
      <p className="text-on-surface-secondary mt-2 mb-6">{content.collections.description}</p>

      <nav aria-label={content.collections.jumpTo} className="bg-tint mb-10 rounded-lg p-4">
        <ul role="list" className="columns-1 gap-6 text-sm sm:columns-2 lg:columns-4">
          {collections.map((collection) => (
            <li key={collection.id} className="break-inside-avoid">
              <a
                href={`#${collection.handle}`}
                className="text-primary-dark block py-1 font-semibold no-underline hover:underline"
              >
                {collection.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col">
        {collections.map((collection) => {
          const href = localizePath(locale, `/collections/${collection.handle}`);
          const subs = subcategories(collection.handle);
          return (
            <section
              key={collection.id}
              id={collection.handle}
              aria-labelledby={`${collection.handle}-heading`}
              className="border-border scroll-mt-36 border-t py-8"
            >
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="border-border flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white p-1">
                  {collection.thumbnail ? (
                    <img
                      src={shopifyImageUrl(collection.thumbnail.url, { width: 112 })}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                      className="size-full object-contain"
                    />
                  ) : null}
                </span>
                <h2
                  id={`${collection.handle}-heading`}
                  className="text-primary-dark text-xl font-bold"
                >
                  <Link href={href} className="no-underline hover:underline">
                    {collection.title}
                  </Link>
                </h2>
                <Link href={href} className="text-link ms-auto text-sm font-semibold">
                  {interpolate(content.header.viewCategory, { title: collection.title })} →
                </Link>
              </div>
              {subs.length > 0 ? (
                <ul
                  role="list"
                  className="columns-1 gap-8 text-sm sm:columns-2 md:columns-3 lg:columns-4"
                >
                  {subs.map((sub) => (
                    <li key={sub.href} className="break-inside-avoid">
                      <Link
                        href={localizePath(locale, sub.href)}
                        className="text-on-surface block py-1 no-underline hover:underline"
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
