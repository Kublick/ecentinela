import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { categories, subcategories } from "@/lib/categories";
import { getContent, interpolate } from "@/lib/content";
import { localizePath, type Locale } from "@/lib/i18n";

import { CartTrigger } from "./CartTrigger";
import { HeaderSearch } from "./HeaderSearch";
import { LanguageSwitch, LanguageSwitchFallback } from "./LanguageSwitch";
import { MobileNavDialog } from "./MobileNavDialog";

/**
 * Site header, styled after e-centinela.com: a navy band with the logo, a
 * visible part-number search (`HeaderSearch`: a GET form to `/search` with a
 * predictive dropdown), account and cart,
 * then a darker band with the "Categorías" menu, the phone number and the
 * language switch.
 *
 * The categories menu is CSS only (`.mega` in `globals.css`): it opens on hover
 * or keyboard focus, and the hovered or focused category shows its
 * subcategories on the right.
 */
export function Header({ locale, accountLink }: { locale: Locale; accountLink?: ReactNode }) {
  const content = getContent(locale);
  const nav = categories.map((category) => ({
    title: category.title,
    href: localizePath(locale, `/collections/${category.handle}`),
    subcategories: subcategories(category.handle).map((sub) => ({
      label: sub.label,
      href: localizePath(locale, sub.href),
    })),
  }));

  return (
    <header className="relative z-40 text-white md:sticky md:top-0">
      <div className="bg-primary">
        <div className="max-w-page px-margin mx-auto flex flex-wrap items-center gap-x-8 gap-y-3 py-3 md:py-4">
          <div className="flex items-center gap-1">
            <MobileNavDialog
              categories={nav.map(({ title, href }) => ({ title, href }))}
              allHref={localizePath(locale, "/collections")}
            />
            <Link href={localizePath(locale, "/")} className="inline-flex shrink-0">
              <img
                src="/brand/logo-centinela-white.svg"
                alt="Eléctrica Centinela"
                width={232}
                height={42}
                className="h-auto w-40 md:w-56"
              />
            </Link>
          </div>

          <HeaderSearch
            categories={nav.flatMap((category) => [
              { label: category.title, href: category.href },
              ...category.subcategories,
            ])}
          />

          <div className="ms-auto flex items-center gap-2 md:ms-0">
            {accountLink}
            <CartTrigger />
          </div>
        </div>
      </div>

      <nav aria-label={content.header.navigation} className="bg-primary-dark hidden md:block">
        <div className="max-w-page px-margin relative mx-auto flex items-center gap-6">
          <div className="mega">
            <Link
              href={localizePath(locale, "/collections")}
              className="bg-secondary inline-flex h-12 items-center gap-2 px-4 font-semibold text-white no-underline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="size-4"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {content.header.categories}
            </Link>
            <div className="mega-panel">
              <ul role="list" className="mega-list">
                {nav.map((category) => (
                  <li key={category.href} className="mega-item">
                    <Link href={category.href}>{category.title}</Link>
                    <div className="mega-subs">
                      <p className="mb-4 flex items-baseline justify-between gap-4">
                        <span className="text-primary-dark text-lg font-bold">{category.title}</span>
                        <Link href={category.href} className="text-link text-sm font-semibold">
                          {interpolate(content.header.viewCategory, { title: category.title })} →
                        </Link>
                      </p>
                      <ul role="list" className="columns-3 gap-6 text-sm">
                        {category.subcategories.map((sub) => (
                          <li key={sub.href} className="break-inside-avoid">
                            <Link
                              href={sub.href}
                              className="text-on-surface block py-1 no-underline hover:underline"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            href={localizePath(locale, "/collections")}
            className="text-white no-underline hover:underline"
          >
            {content.header.allCategories}
          </Link>

          <div className="ms-auto flex items-center gap-4 [&_a]:text-white">
            <a href={content.header.phoneHref} className="no-underline hover:underline">
              {content.header.phone}
            </a>
            <Suspense fallback={<LanguageSwitchFallback />}>
              <LanguageSwitch />
            </Suspense>
          </div>
        </div>
      </nav>
    </header>
  );
}
