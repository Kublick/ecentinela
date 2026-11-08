import Link from "next/link";

import { getContent } from "@/lib/content";
import { localizePath, type Locale } from "@/lib/i18n";

const footerLinkClass =
  "min-h-touch-target text-link inline-flex items-center no-underline hover:underline";

/**
 * Site footer — shared chrome, server-rendered. Includes the `/cart` link that
 * keeps the cart route reachable when the drawer is unavailable.
 */
export function Footer({ locale }: { locale: Locale }) {
  const content = getContent(locale);
  return (
    <footer className="border-primary border-t-[6px] text-sm">
      <div className="max-w-page px-margin mx-auto grid grid-cols-1 gap-8 py-10 md:grid-cols-3 lg:grid-cols-5">
        <div className="text-on-surface-secondary flex flex-col gap-3 leading-relaxed md:col-span-3 lg:col-span-2">
          <img
            src="/brand/logo-centinela.png"
            alt="Eléctrica Centinela"
            width={246}
            height={45}
            loading="lazy"
            className="h-auto w-52"
          />
          <p className="max-w-md">{content.footer.address}</p>
          <a
            href={content.header.phoneHref}
            className="text-link inline-flex min-h-11 items-center self-start font-semibold md:min-h-6"
          >
            {content.header.phone}
          </a>
        </div>
        <nav aria-labelledby="footer-quick-links-heading">
          <h2 className="text-primary-dark mb-2 font-bold" id="footer-quick-links-heading">
            {content.footer.quickLinks}
          </h2>
          <ul role="list" className="flex flex-col">
            {content.footer.links.map((link) => (
              <li key={link.href}>
                <Link href={localizePath(locale, link.href)} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={localizePath(locale, "/search")} className={footerLinkClass}>
                {content.footer.search}
              </Link>
            </li>
            <li>
              <a href={content.footer.catalogHref} rel="nofollow" className={footerLinkClass}>
                {content.footer.catalog}
              </a>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-customer-care-heading">
          <h2 className="text-primary-dark mb-2 font-bold" id="footer-customer-care-heading">
            {content.footer.customerCare}
          </h2>
          <ul role="list" className="flex flex-col">
            <li>
              <Link href={localizePath(locale, "/cart")} className={footerLinkClass}>
                {content.cart.title}
              </Link>
            </li>
            <li>
              <Link href={localizePath(locale, "/account")} className={footerLinkClass}>
                {content.footer.account}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-information-heading">
          <h2 className="text-primary-dark mb-2 font-bold" id="footer-information-heading">
            {content.footer.information}
          </h2>
          <ul role="list" className="flex flex-col">
            {content.footer.infoLinks.map((link) => (
              <li key={link.href}>
                <Link href={localizePath(locale, link.href)} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="max-w-page px-margin border-border text-on-surface-secondary mx-auto flex flex-wrap justify-between gap-x-6 gap-y-2 border-t py-5">
        <p>
          &copy; {new Date().getFullYear()} {content.footer.legalName}
        </p>
        <p>
          {content.footer.paymentMethods}: Shop Pay · PayPal · Visa · Mastercard
        </p>
      </div>
    </footer>
  );
}
