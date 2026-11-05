import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { getContent } from "@/lib/content";
import { localizePath, type Locale } from "@/lib/i18n";

import { CartTrigger } from "./CartTrigger";
import { LanguageSwitch, LanguageSwitchFallback } from "./LanguageSwitch";
import { MobileNavDialog } from "./MobileNavDialog";
import { PredictiveSearchTrigger } from "./PredictiveSearchTrigger";

/**
 * Site header: server shell + small client islands. Server-rendered: logo
 * `<Link>`, desktop nav `<Link>`s, and a real `<Link href="/search">` search
 * trigger that is reachable without JS. Client islands: `CartTrigger`,
 * `PredictiveSearchTrigger`, `LanguageSwitch` and `MobileNavDialog`.
 *
 * The cart trigger opens the `<dialog>` drawer via `showModal()`. The footer
 * `/cart` link is the full-page fallback when the drawer is unavailable.
 */
export function Header({
  locale,
  accountLink,
  shopName = "CORE",
}: {
  locale: Locale;
  accountLink?: ReactNode;
  shopName?: string;
}) {
  const content = getContent(locale);
  return (
    <header className="border-border bg-surface sticky top-0 z-40 border-b">
      <div
        className="max-w-page px-margin mx-auto flex h-16 w-full items-center justify-between"
        data-header-nav-group
      >
        <div className="flex items-center gap-2">
          <MobileNavDialog />
          <Link
            href={localizePath(locale, "/")}
            className="text-on-surface focus-visible:outline-accent inline-flex items-center rounded-sm text-lg font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {shopName}
          </Link>
        </div>

        <nav
          aria-label={content.header.navigation}
          className="mx-8 hidden min-w-0 flex-1 items-center gap-8 md:flex"
        >
          {content.header.navItems.map((item) => (
            <Link
              key={item.href}
              href={localizePath(locale, item.href)}
              className="text-on-surface focus-visible:outline-accent shrink-0 rounded-sm text-sm font-normal whitespace-nowrap no-underline hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-opacity"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0">
          <Suspense fallback={<LanguageSwitchFallback />}>
            <LanguageSwitch />
          </Suspense>
          <PredictiveSearchTrigger />
          <noscript>
            <form
              action={localizePath(locale, "/search")}
              method="get"
              role="search"
              className="sr-only"
            >
              <label htmlFor="header-search-q">{content.general.search}</label>
              <input id="header-search-q" name="q" type="search" autoComplete="off" />
              <button type="submit">{content.search.submit}</button>
            </form>
          </noscript>

          {accountLink}

          <CartTrigger />
        </div>
      </div>
    </header>
  );
}
