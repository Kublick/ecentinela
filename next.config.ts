import type { NextConfig } from "next";

/**
 * Next.js 16 config for the Hydrogen Next.js example.
 *
 * `cacheComponents: true` enables Cache Components / `use cache`.
 *
 * No `next/image` remote patterns — we use plain `<img>` + the `hydrogen-image`
 * helper (F12; Hydrogen ships no Image component and we size CDN URLs ourselves).
 *
 * `output: "standalone"` emits a self-contained `server.js` for the Docker
 * image deployed on Coolify.
 *
 * `experimental.globalNotFound` serves `app/global-not-found.tsx` with a real
 * 404 for unmatched URLs; the root layout lives under `app/[lang]`.
 *
 * Unless `ALLOW_INDEXING=true` (see `isIndexingAllowed` in `lib/site.ts`),
 * every response carries `X-Robots-Tag: noindex, nofollow` so sandbox and
 * preview deployments stay out of search results.
 */
export default function nextConfig(): NextConfig {
  const allowIndexing = process.env.ALLOW_INDEXING === "true";
  return {
    output: "standalone",
    async headers() {
      if (allowIndexing) return [];
      return [
        {
          source: "/:path*",
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        },
      ];
    },
    cacheComponents: true,
    experimental: {
      globalNotFound: true,
    },
    // React Strict Mode is disabled because `@shopify/hydrogen/react`'s
    // `PredictiveSearchProvider` destroys its store in the Strict Mode effect
    // cleanup (double-invoke), and `useMemo` returns the same (now-destroyed)
    // store instance for the second mount — so the predictive search store is
    // permanently `destroyed` and `store.search()` no-ops, breaking header
    // autocomplete. Disabling Strict Mode avoids the destroy; the cart provider
    // is unaffected (it recreates its store). Re-enable once the provider is
    // Strict-Mode-safe upstream.
    reactStrictMode: false,
  };
}
