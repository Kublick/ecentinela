import type { MetadataRoute } from "next";

import { isIndexingAllowed, SITE_ORIGIN } from "@/lib/site";

/**
 * `/robots.txt`. With `ALLOW_INDEXING=true`, allows all crawlers, points to
 * the sitemap, and disallows the cart + API surfaces. Otherwise (sandbox and
 * preview deployments) it disallows everything.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexingAllowed()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/api/"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
