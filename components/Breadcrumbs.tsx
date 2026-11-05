import Link from "next/link";

import { getContent } from "@/lib/content";
import { localizePath, type Locale } from "@/lib/i18n";

export type Crumb = {
  label: string;
  /** Unprefixed app path; localized here. */
  href?: string;
};

type BreadcrumbsProps = {
  locale: Locale;
  items: Crumb[];
};

/**
 * Server-rendered breadcrumb trail. The last crumb is `aria-current="page"`.
 * Reused by collection, collections, search, and product routes (F13). Takes
 * `locale` as a prop (not context) because it also renders from server pages.
 */
export function Breadcrumbs({ locale, items }: BreadcrumbsProps) {
  const content = getContent(locale);
  return (
    <nav aria-label={content.general.breadcrumb}>
      <ol
        role="list"
        className="text-on-surface-secondary flex flex-wrap items-center gap-1 text-sm"
      >
        <li key="home">
          <Link href={localizePath(locale, "/")} className="hover:text-on-surface no-underline">
            {content.general.home}
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              {item.href && !isLast ? (
                <Link
                  href={localizePath(locale, item.href)}
                  className="hover:text-on-surface no-underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-on-surface"
                  {...(isLast ? { "aria-current": "page" as const } : {})}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
