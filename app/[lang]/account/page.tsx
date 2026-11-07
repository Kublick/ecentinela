import "server-only";
import { createCustomerAccountClient, gql } from "@shopify/hydrogen/customer-account";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { customerAccountConfig } from "@/lib/config";
import { getContent, type Content } from "@/lib/content";
import { getCustomerAccessToken } from "@/lib/customer-account";
import { localizePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { isCustomerAccountsAvailable } from "@/lib/storefront-config";
import { toURLSearchParams } from "@/lib/url-params";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/account">): Promise<Metadata> {
  return { title: getContent(await resolveLocale(params)).account.title };
}

const CUSTOMER_QUERY = gql(`
  query CurrentCustomer {
    customer {
      firstName
      lastName
      emailAddress {
        emailAddress
      }
    }
  }
`);

type AccountCustomer = {
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: { emailAddress?: string | null } | null;
};

type AccountPageProps = PageProps<"/[lang]/account">;

/**
 * `/account` — core Customer Accounts surface (name + email only).
 *
 * No `export const dynamic` / `export const fetchCache`: under
 * `cacheComponents: true`, `force-dynamic` is not allowed. The page relies on
 * the `AppShell` dynamic context (`await connection()` in the root layout's
 * shell), which opts the whole subtree into dynamic rendering — any
 * `headers()`/`cookies()` read inside (e.g. `getCustomerAccessToken()` →
 * `createCurrentRequest()` → `headers()`) is then automatically dynamic, the
 * same convention `cart/page.tsx` follows.
 *
 * Token refresh is delegated to the `/account/refresh` handler (intercepted in
 * `proxy.ts`): the page only **reads** the token via `getAccessToken`
 * (read-only, no mutation, no render-time commit — the proxy runs before RSC
 * render and cannot commit mutations that occur during render). When no usable
 * token is present, the page `redirect()`s to `/account/refresh?return_to=…`;
 * the handler refreshes, commits the cookie on its response, and redirects
 * back to `/account`, which now reads a valid token.
 */
export default async function AccountPage({ params, searchParams }: AccountPageProps) {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  const available = isCustomerAccountsAvailable(); // sync — no await
  const urlSearchParams = toURLSearchParams(await searchParams);
  const loginFailed = urlSearchParams.get("login") === "failed";
  const refreshAttempted = urlSearchParams.get("refreshed") === "1";

  if (!available) return <AccountShell content={content} notice="real-store" />;

  const { accessToken, requestContext } = await getCustomerAccessToken();
  if (!accessToken && !loginFailed && !refreshAttempted) {
    // Delegate the refresh to the `/account/refresh` handler instead of calling
    // `getOrRefreshAccessToken` here: this page only *reads* the token during
    // RSC render, and the proxy runs before render — it cannot commit a cookie
    // mutation that happens during render. Refreshing in-page would break that
    // no-render-commit invariant. The handler refreshes, sets the cookie on its
    // own response, and redirects back with `refreshed=1`.
    const returnTo = localizePath(locale, "/account?refreshed=1");
    redirect(`/account/refresh?return_to=${encodeURIComponent(returnTo)}`);
  }
  if (!accessToken) return <AccountShell content={content} loginFailed={loginFailed} />;

  // Build the client per-call (Next has no RR "context" equivalent; per-call
  // construction from `headers()` is the native Next approach, matching
  // `getStorefrontClient`).
  const customerAccount = createCustomerAccountClient({
    shopId: customerAccountConfig.shopId,
    requestContext,
  });

  // Keep the try/catch so a network/timeout failure surfaces as a friendly
  // error card instead of an unhandled 500 in RSC render.
  let customer: AccountCustomer | undefined;
  let error: string | undefined;
  try {
    const { data, errors } = await customerAccount.graphql(CUSTOMER_QUERY, { accessToken });
    customer = errors ? undefined : data.customer;
    error = errors?.[0]?.message;
  } catch {
    error = content.account.requestFailed;
  }

  return <AccountShell content={content} customer={customer} error={error} />;
}

type AccountShellProps = { content: Content } & (
  | { notice: "real-store" }
  | { loginFailed: boolean }
  | { customer?: AccountCustomer | null; error?: string }
);

function AccountShell(props: AccountShellProps) {
  const { content } = props;
  return (
    <div className="max-w-page px-margin mx-auto w-full py-16" aria-labelledby="account-heading">
      <h1 id="account-heading" className="type-display mb-4">
        {content.account.title}
      </h1>
      <p className="type-body-lg text-on-surface-secondary max-w-xl">{content.account.intro}</p>

      {"notice" in props && <RealStoreNotice content={content} />}
      {"loginFailed" in props && <LoginPanel content={content} loginFailed={props.loginFailed} />}
      {"customer" in props &&
        (props.error ? (
          <CustomerAccountError message={props.error} />
        ) : (
          <CustomerCard content={content} customer={props.customer} />
        ))}
    </div>
  );
}

function RealStoreNotice({ content }: { content: Content }) {
  return (
    <section
      className="border-border bg-surface mt-8 rounded border p-8"
      aria-labelledby="notice-heading"
    >
      <h2 id="notice-heading" className="type-heading-lg mb-3">
        {content.account.realStoreHeading}
      </h2>
      <p className="type-body text-on-surface-secondary max-w-xl">{content.account.realStoreBody}</p>
    </section>
  );
}

function LoginPanel({ content, loginFailed }: { content: Content; loginFailed: boolean }) {
  return (
    <section
      className="border-border bg-surface mt-8 rounded border p-8"
      aria-labelledby="login-heading"
    >
      <h2 id="login-heading" className="type-heading-lg mb-3">
        {content.account.signInHeading}
      </h2>
      <p className="type-body text-on-surface-secondary mb-6 max-w-xl">
        {content.account.signInBody}
      </p>
      {loginFailed ? (
        <p
          tabIndex={-1}
          role="alert"
          autoFocus
          className="border-border bg-surface-secondary text-on-surface focus-visible:outline-focus mb-6 rounded border p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {content.account.loginFailed}
        </p>
      ) : null}
      {/* Plain `<a>` — `/account/login` is handler-intercepted in `proxy.ts`. The
          lint rule matches it against the dynamic `[lang]` page routes. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/account/login"
        className="rounded-button button-primary focus-visible:outline-focus inline-flex h-11 items-center justify-center px-5 text-sm font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {content.account.logIn}
      </a>
    </section>
  );
}

function CustomerAccountError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="border-border bg-surface-secondary text-on-surface mt-8 rounded border p-4"
    >
      {message}
    </p>
  );
}

function CustomerCard({
  content,
  customer,
}: {
  content: Content;
  customer?: AccountCustomer | null;
}) {
  const name =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") ||
    content.account.customerFallback;

  return (
    <section
      className="border-border bg-surface mt-8 rounded border p-8"
      aria-labelledby="identity-heading"
    >
      <h2
        id="identity-heading"
        className="type-body text-on-surface-secondary mb-3 text-sm font-semibold tracking-[0.2em] uppercase"
      >
        {content.account.identityHeading}
      </h2>
      <p className="type-heading-lg mb-2">{name}</p>
      {customer?.emailAddress?.emailAddress ? (
        <p className="type-body text-on-surface-secondary">{customer.emailAddress.emailAddress}</p>
      ) : null}
      <form method="post" action="/account/logout" className="mt-8">
        <button
          type="submit"
          className="rounded-button button-outline focus-visible:outline-focus inline-flex h-11 items-center justify-center px-5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {content.account.logOut}
        </button>
      </form>
    </section>
  );
}
