import "server-only";
import { getContent } from "@/lib/content";
import { isCustomerLoggedIn } from "@/lib/customer-account";
import { localizePath, type Locale } from "@/lib/i18n";
import { isCustomerAccountsAvailable } from "@/lib/storefront-config";

const accountLinkClassName =
  "focus-visible:outline-accent inline-flex h-11 w-11 items-center justify-center rounded no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition motion-safe:active:scale-[0.97] hover:opacity-70";

/**
 * Header account link — an async Server Component resolved under `<Suspense>`
 * by `AppShell`. Uses plain `<a>` (not `next/link`) for both `/account` and
 * `/account/login`: `/account/login` is a Hydrogen-owned route intercepted in
 * `proxy.ts` (no app route file), and a `next/link` client-side RSC navigation
 * is fragile when the proxy responds to an RSC data fetch with a 303-to-
 * external. A plain `<a>` forces a full-page navigation the proxy intercepts
 * cleanly — the native choice for handler-intercepted paths.
 *
 * `/account/login` only exists when Customer Account handlers are registered
 * and has no locale prefix (it is a Hydrogen route, not an app page). Keep the
 * icon visible for mock/unconfigured stores by linking to `/account`, where
 * the page explains the required setup.
 */
export async function HeaderAccountLink({ locale }: { locale: Locale }) {
  const content = getContent(locale);
  const accountHref = localizePath(locale, "/account");
  const available = isCustomerAccountsAvailable(); // sync — no await
  if (!available) return <AccountIconLink href={accountHref} label={content.general.account} />;

  const loggedIn = await isCustomerLoggedIn();
  if (loggedIn) return <AccountIconLink href={accountHref} label={content.general.account} />;

  return <AccountIconLink href="/account/login" label={content.header.logIn} />;
}

function AccountIconLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className={accountLinkClassName} aria-label={label}>
      <img
        src="/icons/icon-user.svg"
        width="20"
        height="20"
        alt=""
        className="size-5 invert"
        aria-hidden="true"
      />
    </a>
  );
}

export function HeaderAccountLinkFallback({ locale }: { locale: Locale }) {
  // Icon-sized placeholder (not the word "Account"): the resolved link renders
  // a 20px user icon, so showing text here would flash and swap to an icon.
  // A dimmed icon matches the header's icon-button sizing.
  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy
      aria-label={getContent(locale).header.loadingAccount}
      className="inline-flex h-11 w-11 items-center justify-center opacity-40"
    >
      <img
        src="/icons/icon-user.svg"
        width="20"
        height="20"
        alt=""
        className="size-5 invert"
        aria-hidden="true"
      />
    </span>
  );
}
