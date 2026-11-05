/**
 * Trusted site origin for SEO. Comes from a `SITE_ORIGIN` environment variable,
 * never from attacker-influenceable
 * `host` / `x-forwarded-host` request headers. Defaults to the local dev origin
 * (Next.js dev port 3000) so the example works without extra config.
 */
export const SITE_ORIGIN =
  typeof process !== "undefined"
    ? (process.env.SITE_ORIGIN ?? "http://localhost:3000")
    : "http://localhost:3000";

/**
 * Whether search engines may index this deployment. Off unless
 * `ALLOW_INDEXING=true`, so sandbox and preview deployments (which show the
 * real store's catalog) never compete with the live site. Read at build time
 * by `robots.txt` and the root layout metadata, so in Coolify it must be a
 * build variable too. `next.config.ts` reads the same variable for the
 * `X-Robots-Tag` header.
 */
export function isIndexingAllowed(): boolean {
  return typeof process !== "undefined" && process.env.ALLOW_INDEXING === "true";
}

/**
 * Public origin for Customer Account OAuth redirects. Behind a reverse proxy
 * (Coolify/Traefik) `request.url` carries the container bind address
 * (`0.0.0.0:3000`), so production uses `SITE_ORIGIN`. Development keeps the
 * request origin so `dev:https` on `local.tryhydrogen.dev` still works.
 */
export function getPublicOrigin(request: Request): string {
  if (process.env.NODE_ENV === "production" && process.env.SITE_ORIGIN) {
    return new URL(process.env.SITE_ORIGIN).origin;
  }
  return new URL(request.url).origin;
}

/** Build an absolute canonical URL from a path. */
export function canonicalUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}

/**
 * Serialize JSON-LD and escape it for safe embedding in a
 * `<script type="application/ld+json">` tag. It escapes `<` so the payload
 * cannot break out of the script element.
 */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
