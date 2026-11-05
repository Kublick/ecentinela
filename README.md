# ecentinela-next

Headless storefront for the `ecentinela.myshopify.com` store, built with Next.js 16 (App Router) and [`@shopify/hydrogen`](https://www.npmjs.com/package/@shopify/hydrogen) 2026.10.

It started as a copy of Shopify's [Next.js Hydrogen example](https://github.com/Shopify/hydrogen/tree/main/examples/nextjs) (MIT, see `LICENSE.md`), moved out of the monorepo and set up to deploy on Coolify with Docker.

## Requirements

- Node.js 24+
- pnpm 10 (`corepack enable` picks the version pinned in `package.json`)

## Run locally

```sh
cp .env.example .env   # fill in the store values, see below
pnpm install
pnpm dev
```

Open <http://localhost:3000>. Without `PRIVATE_STOREFRONT_API_TOKEN` the app reads [mock.shop](https://mock.shop) sample data instead of the store.

Customer Accounts need HTTPS because Shopify OAuth rejects `http`. Use `pnpm dev:https` and open <https://local.tryhydrogen.dev:5173>.

## Environment variables

Server-only:

- `PRIVATE_STOREFRONT_API_TOKEN`: private Storefront API token.
- `SESSION_SECRET`: random secret, at least 32 characters. Generate one with `node -e "console.log(crypto.randomBytes(32).toString('base64url'))"`.
- `SITE_ORIGIN`: public origin of the site, e.g. `https://shop.e-centinela.com`.

Public (inlined into the browser bundle at build time):

- `NEXT_PUBLIC_STORE_DOMAIN`: `ecentinela.myshopify.com`.
- `NEXT_PUBLIC_STOREFRONT_API_TOKEN`: public Storefront API token.
- `NEXT_PUBLIC_SHOP_ID`: numeric shop ID.
- `NEXT_PUBLIC_STOREFRONT_ID`: numeric Hydrogen storefront ID.
- `NEXT_PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`: Customer Account API client ID.

`npx shopify hydrogen env pull` in a linked Hydrogen project writes these values to `.env` (named `PUBLIC_*` instead of `NEXT_PUBLIC_*`, and `SHOP_ID` for the shop ID).

## Deploy on Coolify

1. **New Resource → Public/Private Repository** → this repo, branch `main`.
2. **Build pack:** Dockerfile. **Ports exposed:** `3000`.
3. **Domains:** `https://shop.e-centinela.com` (any domain starting with `https://`). Coolify's proxy issues and renews a Let's Encrypt certificate.
4. **Environment variables:** add every variable above and mark each one as a **build variable** as well as a runtime one. Next.js prerenders pages from the store and inlines `NEXT_PUBLIC_*` during `next build`; a build without them falls back to mock.shop data.
5. **DNS:** point the domain's A record at the Coolify server, then deploy.
6. **Customer Accounts:** in Shopify admin → Hydrogen → your storefront → Customer Account API settings, add:
   - Callback URI: `https://shop.e-centinela.com/account/authorize`
   - JavaScript origin: `https://shop.e-centinela.com`
   - Logout URI: `https://shop.e-centinela.com`

Build arguments are stored in the image's build history, so keep the image on your own server and don't push it to a public registry.

## Scripts

| Script | Does |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server. |
| `pnpm dev:https` | Start the dev server with trusted local HTTPS. |
| `pnpm build` | Build the production app (standalone output in `.next/standalone`). |
| `pnpm start` | Run the standalone server after `pnpm build`. |
| `pnpm lint` | Run ESLint. |
| `pnpm typecheck` | Run TypeScript and Hydrogen GraphQL checks. |

## Pages

- `/`: home with hero, featured products, and featured collections.
- `/collections`: all collections.
- `/collections/:handle`: collection page with filters, sort, pagination, and active filter chips.
- `/products/:handle`: product page with gallery, URL-synced variants, add to cart, Shop Pay, and related products.
- `/search`: storefront search with filters, sort, pagination, and predictive search.
- `/cart`: cart page with Shop Pay and no-JS fallback for the cart drawer.
- `/account`: Customer Account OAuth page for real stores.
- `/sitemap.xml`: product and collection sitemap.
- `/robots.txt`: crawler rules for the storefront.

## Where to Start

- Pages live in `app/`.
- Shared UI lives in `components/`.
- Storefront, cart, Customer Account, analytics, and query helpers live in `lib/`.
- Global styling lives in `app/globals.css`.

## License

MIT. See [LICENSE.md](LICENSE.md).
