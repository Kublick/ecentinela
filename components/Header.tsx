import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { categories, subcategories } from "@/lib/categories";
import { getContent } from "@/lib/content";
import { localizePath, type Locale } from "@/lib/i18n";

import { CartTrigger } from "./CartTrigger";
import { CategoryMenu } from "./CategoryMenu";
import { CurrencySwitch } from "./CurrencyProvider";
import { HeaderSearchInput, SearchField } from "./HeaderSearchInput";
import { LanguageSwitch, LanguageSwitchFallback } from "./LanguageSwitch";
import { MobileNavDialog } from "./MobileNavDialog";

/** "Productos Retirados" stays reachable from /collections, not the main menu. */
const DISCONTINUED_HANDLE = "productos-retirados-1";

/**
 * Site header, styled after e-centinela.com: a navy band with the logo, a
 * visible part-number search (a plain GET form to `/search`), account and cart,
 * then a darker band with the "Categorías" menu, the phone number and the
 * language switch.
 *
 * The categories menu is `CategoryMenu` (a disclosure button; arrow keys move
 * between categories, Escape closes it).
 */
export function Header({ locale, accountLink }: { locale: Locale; accountLink?: ReactNode }) {
  const content = getContent(locale);
  const nav = categories.map((category) => ({
    handle: category.handle,
    title: category.title,
    href: localizePath(locale, `/collections/${category.handle}`),
    subcategories: subcategories(category.handle).map((sub) => ({
      label: sub.label,
      href: localizePath(locale, sub.href),
    })),
  }));

  return (
    <header className="sticky top-0 z-40 text-white">
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

          <form
            action={localizePath(locale, "/search")}
            method="get"
            role="search"
            className="order-last flex w-full min-w-0 md:order-none md:w-auto md:flex-1"
          >
            <label htmlFor="header-search-q" className="sr-only">
              {content.general.search}
            </label>
            <Suspense fallback={<SearchField placeholder={content.header.searchPlaceholder} />}>
              <HeaderSearchInput placeholder={content.header.searchPlaceholder} />
            </Suspense>
            <button
              type="submit"
              aria-label={content.general.search}
              className="bg-lime text-primary-dark inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-e-[var(--radius-input)] hover:brightness-95"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="size-5"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          </form>

          <div className="ms-auto flex items-center gap-2 md:ms-0">
            {accountLink}
            <CartTrigger />
          </div>
        </div>
      </div>

      <nav aria-label={content.header.navigation} className="bg-primary-dark hidden md:block">
        <div className="max-w-page px-margin relative mx-auto flex items-center gap-6">
          <CategoryMenu
            categories={nav.filter((category) => category.handle !== DISCONTINUED_HANDLE)}
          />

          <Link
            href={localizePath(locale, "/collections")}
            className="text-white no-underline hover:underline"
          >
            {content.header.allCategories}
          </Link>

          <div className="ms-auto flex items-center gap-4 [&_a]:text-white">
            <CurrencySwitch />
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
