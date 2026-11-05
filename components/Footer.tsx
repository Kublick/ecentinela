import Link from "next/link";

import { getContent } from "@/lib/content";
import { localizePath, type Locale } from "@/lib/i18n";

const footerLinkClass =
  "min-h-touch-target text-on-surface-secondary hover:text-on-surface focus-visible:outline-accent inline-flex items-center font-normal no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-colors";

/**
 * Site footer — shared chrome, server-rendered. Includes the `/cart` link that
 * keeps the cart route reachable when the drawer is unavailable.
 */
export function Footer({ locale, shopName = "CORE" }: { locale: Locale; shopName?: string }) {
  const content = getContent(locale);
  return (
    <footer className="max-w-page px-margin mx-auto w-full">
      <div className="border-border grid grid-cols-1 gap-8 border-t py-12 text-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="type-body-sm text-on-surface mb-4 font-medium">{shopName}</h2>
          <p className="text-on-surface-secondary">
            &copy; {new Date().getFullYear()} {shopName}
          </p>
        </div>
        <nav aria-labelledby="footer-quick-links-heading">
          <h2
            className="type-body-sm text-on-surface mb-4 font-medium"
            id="footer-quick-links-heading"
          >
            {content.footer.quickLinks}
          </h2>
          <ul role="list" className="flex flex-col gap-2">
            {content.footer.links.map((link) => (
              <li key={link.href}>
                <Link href={localizePath(locale, link.href)} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-customer-care-heading">
          <h2
            className="type-body-sm text-on-surface mb-4 font-medium"
            id="footer-customer-care-heading"
          >
            {content.footer.customerCare}
          </h2>
          <ul role="list" className="flex flex-col gap-2">
            <li>
              <Link href={localizePath(locale, "/search")} className={footerLinkClass}>
                {content.footer.search}
              </Link>
            </li>
            <li>
              <Link href={localizePath(locale, "/cart")} className={footerLinkClass}>
                {content.cart.title}
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="type-body-sm text-on-surface mb-4 font-medium">
            {content.footer.paymentMethods}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border-border text-on-surface-secondary rounded-sm border px-2 py-1 text-xs">
              Visa
            </span>
            <span className="border-border text-on-surface-secondary rounded-sm border px-2 py-1 text-xs">
              Mastercard
            </span>
            <span className="border-border text-on-surface-secondary rounded-sm border px-2 py-1 text-xs">
              PayPal
            </span>
            <span className="border-border text-on-surface-secondary rounded-sm border px-2 py-1 text-xs">
              Shop Pay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
