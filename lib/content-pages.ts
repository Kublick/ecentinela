import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import type { Locale } from "./i18n";
import { PAGE_QUERY, POLICIES_QUERY } from "./queries";
import { getStaticStorefrontClient } from "./storefront-static";

/** Online Store page by handle, or `null` when the store has none. */
export async function fetchPage(locale: Locale, handle: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");

  const { data, errors } = await getStaticStorefrontClient(locale).graphql(PAGE_QUERY, {
    variables: { handle },
  });
  if (errors) {
    console.error("[hydrogen] Page query failed", errors);
  }
  return data?.page ?? null;
}

/** Shop policy by handle (`privacy-policy`, `terms-of-service`, …), or `null`. */
export async function fetchPolicy(locale: Locale, handle: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("policies");

  const { data, errors } = await getStaticStorefrontClient(locale).graphql(POLICIES_QUERY);
  if (errors) {
    console.error("[hydrogen] Policies query failed", errors);
  }
  const shop = data?.shop;
  const policies = [
    shop?.privacyPolicy,
    shop?.termsOfService,
    shop?.refundPolicy,
    shop?.shippingPolicy,
  ];
  return policies.find((policy) => policy?.handle === handle) ?? null;
}
