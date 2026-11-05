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
