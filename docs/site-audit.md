# e-centinela.com: current site audit and migration scope

Audit date: 2026-11-04. Covers the live site at https://e-centinela.com, which is to be rebuilt as the headless storefront in this repo (Next.js + Hydrogen, deployed at https://ecentinela.mbl-dev.com).

Status legend for the "New app" column: ✅ exists in this repo · 🟡 partly there / needs changes · ❌ missing.

## 1. Summary

- The live site is a custom Liquid theme (`Copy of controls-online-theme with WC - 23-JUL-21`, theme ID `120375607349`). It's built by Goplek, with later changes by Mobkii. It runs on the **`controls-online.myshopify.com`** store, not on `ecentinela`.
- It's a B2B-style industrial electrical catalog: **~5,577 products, 609 collections**, Spanish (default, `es-MX`) and English (`/en/`), with prices in **USD**.
- The key UX is **table-based ordering**. Collection pages list products as rows with part number, datasheet PDF, price, stock and a quantity box, plus a bulk "Actualizar carrito" button. There's also a **Quick Order** page for entering part numbers.
- Pricing and several features come from **theme-only apps** (wholesale tiers, currency converter, related products, pre-order, chat). Those apps don't run on a headless storefront and need a replacement or a decision to drop them.
- Biggest risks: **wholesale/tier pricing**, **migrating data** (products, collections, ~thousands of datasheet PDFs) from `controls-online` to `ecentinela`, and **customer accounts** (classic → new customer accounts).

## 2. Current site facts

| Item | Value |
|---|---|
| Domain | `e-centinela.com` (agent instructions at `/agents.md`, UCP at `/.well-known/ucp`) |
| Shopify store | `controls-online.myshopify.com` (shop ID 18321335) |
| Theme | Custom, jQuery + Bootstrap 3, old (2021 copy) |
| Languages | `es-MX` (default), `en` under `/en/` (hreflang set) |
| Currency | USD (store currency); currency converter app for others |
| Business | Eléctrica Centinela, S. de R.L. de C.V., Calzada Benito Juárez No. 2238 Local 5, Centro Comercial Lázaro Cárdenas, Fracc. Las Palmas, 21360 Mexicali, B.C. Tel. 686-592-9294 |
| Shipping message | "Envío gratuito en órdenes mayores a $300 USD (aplica solo a BC, BCS y parte de Sonora)" in the announcement bar |
| Checkout | Shopify checkout, Shop Pay, PayPal |
| Locations (inventory export) | "Calzada Benito Juárez No 2238" (stocked), "Border Electronics warehouse" (not stocked) |

## 3. Catalog and data to migrate

| Data | Count / notes | Status |
|---|---|---|
| Products | ~5,577 in the sitemap (5,925 in `inventory_export_1.csv`, some probably unpublished). Single variant each, handle = part number (e.g. `b100pu1519jj`) | ❌ not in `ecentinela` yet; needs **Products → Export** from `controls-online` |
| Collections | 609 (22 top-level categories + subcategories, brand/series collections, e.g. `auer-modul-signal-70`, `cables-monopolares-calibre-22-awg`) | ❌ export/recreate (smart collection rules don't come with the product CSV) |
| Datasheet PDFs | One per product, stored in Shopify Files as `/cdn/shop/files/{handle}.pdf` | ❌ copy the files to the new store; ideally link them with a product metafield instead of relying on the filename |
| Product images | On Shopify CDN, product CSV includes image URLs | ❌ comes with the product import |
| Inventory | Per-location stock, shown as "N en existencia" | 🟡 CSV ready, import after products and locations exist |
| Pages | 7 (see §4) | ❌ recreate content |
| Blogs | `news`, `cursos-presenciales-eaton`: **both empty** | Decide: drop or keep |
| Translations | English versions of products, collections and pages | ❌ export with Translate & Adapt (or whichever translation app is in use) |
| Customers | Classic accounts, some tagged for wholesale pricing | ❌ customer CSV export; decide on B2B approach (§7) |
| URL redirects | Unknown count | ❌ export from **Content → Menus/URL redirects** |

## 4. Page inventory

| URL pattern | What it is | New app |
|---|---|---|
| `/` | Home: category sidebar, featured transformers, brand logos, catalog PDF link | 🟡 home exists; layout and content differ |
| `/collections` | All collections | ✅ |
| `/collections/{handle}` | **Table view** with 20 rows per page and numbered pagination, no sort or filters (see §5.2) | 🟡 exists as a card grid with filters/sort; needs a table view |
| `/collections/all` | All products | 🟡 works only if a collection with handle `all` exists in the new store |
| `/products/{handle}` | Product page (not inspected, see §9) | 🟡 exists |
| `/search?q=` | Results list, 10 per page, numbered pagination (Searchanise widget also loaded) | ✅ search + predictive search |
| `/cart` | Cart page | ✅ |
| `/account/login`, `/account` | Classic customer accounts | 🟡 new customer accounts only; login fixed for Coolify |
| `/pages/quick-order` | **Quick Order** form (§5.4) | ❌ |
| `/pages/contact` | Contact form + address/phone | ❌ |
| `/pages/nosotros` | About us (mission, vision) | ❌ needs `/pages/{handle}` route |
| `/pages/about-us` | Actually **Términos y Condiciones** (purchase terms) | ❌ |
| `/pages/privacy-policy` | Privacy | ❌ |
| `/pages/search-results-page` | Search results page used by an app (likely Searchanise) | Probably drop |
| `/pages/product-lookup-preview` | Page for the ELS "Product Lookup" app | Probably drop (replace with Quick Order/SKU search) |
| `/policies/{terms-of-service,refund-policy,privacy-policy}` | Shopify policies | ❌ needs `/policies/{handle}` route |
| `/blogs/news`, `/blogs/cursos-presenciales-eaton` | Empty blogs | ❌ decide |
| `/en/...` | English versions of everything above | ❌ needs locale routing |
| `/sitemap.xml`, `/robots.txt` | SEO | ✅ (check it covers pages, policies, `/en/`) |
| `/agents.md`, `/.well-known/ucp` | Shopify agentic commerce (served by Shopify on Liquid) | ❌ check whether Hydrogen/Shopify can provide these headless |

## 5. Features by area

### 5.1 Global layout

- **Announcement bar** with the free-shipping message (Essential Announcement Bar app).
- **Header:** logo, search box, **Orden Rápida** link, **Contacto** link, **Catálogo** link (PDF from **2017**, `catalogo-feb2017.pdf`), mini cart showing "(N) Artículos $total", login link.
- **Category sidebar/menu** with 22 top-level categories:

  | Label | Handle |
  |---|---|
  | Borneras de Conexión | `borneras-de-conexion` |
  | Botonería / Selectores / Indicadores | `botoneria-selectores-indicadores` |
  | Cables | `cables` |
  | Control de Motores | `control-de-motores` |
  | Control de Proceso y Medición | `control-de-proceso-y-medicion-1` |
  | Controladores Programables | `controladores-programables` |
  | Desconectadores / Protección de Circuitos | `circuitos-de-proteccion-fusibles-desconectadores-1` |
  | Equipo de Señalización | `equipo-de-senalizacion-1` |
  | Fuentes de Alimentación | `fuentes-de-poder` |
  | Fusibles y Accesorios | `motores` ⚠️ handle doesn't match the label |
  | Gabinetes / Manejo Térmico | `gabinetes-manejo-termico` |
  | Herramienta | `herramienta` |
  | Instrumentos de Prueba y Medición | `instrumentos-de-prueba-y-medicion` |
  | Interruptores de Límite / Sensores | `interruptores-de-limite-sensores` |
  | Inversores de Frecuencia | `inversores-de-frecuencia-1` |
  | Manejo de Alambrado | `manejo-de-alambrado` |
  | Monitores / Relevadores / Temporizadores | `relevadores-temporizadores` |
  | Neumática | `neumatica` |
  | Productos de Potencia Eléctricos | `productos-de-potencia-electricos-1` |
  | Químicos y Adhesivos | `quimicos-y-adhesivos-1` |
  | Seguridad | `seguridad` |
  | Transformadores | `transformadores` |
  | Productos Retirados (discontinued) | `productos-retirados-1` |

  The other ~586 collections aren't in the main menu. Check how customers reach them (sub-menus, links in descriptions, search).
- **Breadcrumbs** on collection pages.
- **Footer:** Acerca de Nosotros, Privacidad, Términos y Condiciones, Terms of Service, Refund policy, "Compra con confianza", PayPal badge, Goplek credit.
- **Brand strip** (home) with logos linking to manufacturer sites: Bussmann, Eaton, ABB, Finder, Legrand, Weidmüller, Siemens, Time Mark, Bernstein, Moeller, Micron, Fluke, Eldon, SGE, Auer Signal, Amprobe, China Pneumatic (XCPC).
- **Floating chat:** WhatsApp button and Shopify Inbox.

### 5.2 Collection page (main ordering UI)

Each product is a **table row**:

| Column | Source |
|---|---|
| Thumbnail + **part number** (links to the product) | Product image, handle/SKU |
| Description (rich text, bold specs) | Product description |
| Proveedor (vendor) | `vendor` |
| Ficha técnica (PDF icon) | `/cdn/shop/files/{handle}.pdf` |
| Precio (USD $) | Price; hidden **quantity tiers** in the markup (e.g. 1-2 $120.00, 3-4 $117.50, 5+ $112.00) from the wholesale app |
| Ordenar | Number input per row |
| Disponibilidad | "**N en existencia**" (exact stock count) |

- Heading shows the count, e.g. "81 Productos Relacionados".
- **"Actualizar carrito"** adds every row with quantity > 0 in one go.
- Numbered pagination, 20 per page. No sort, no filters.
- On mobile, the description moves under the part number and each row has its own add-to-cart form.

### 5.3 Product page

Not inspected (see §9). From the collection rows and catalog data, it should at least show: part number, title, description, vendor, price + quantity tiers, stock count, datasheet PDF, add to cart, related products (Tipo Related Products), "also bought" (Globo), recently viewed, and pre-order status where it applies.

### 5.4 Quick Order (`/pages/quick-order`)

- Custom theme code (jQuery), not an app.
- 10 rows of **part number + quantity**. Typing a code autocompletes from `/search?type=product&q=`. One button adds all rows to the cart (`/cart/add.js`).
- Copy: "Ingrese los números de las partes y las cantidades, después presione el botón Añadir a Carrito."
- New app: build it with predictive search on SKU + a multi-line cart add. Consider pasting a list or uploading a CSV of part numbers.

### 5.5 Search

- Native `/search` with a results list, 10 per page.
- Searchanise is also loaded (instant search widget), along with the ELS **Product Lookup** app.
- New app: predictive search exists. Make sure it matches on **SKU/part number**, which is how these customers search.

### 5.6 Cart and checkout

- Cart page, plus a mini cart in the header. DeepCart/CartJS scripts are loaded.
- Checkout is Shopify's, so it carries over as-is (Shop Pay, PayPal, shipping rates for the free-shipping zones).

### 5.7 Customer accounts

- **Classic** accounts (`/account/login` with the `customer_login` form).
- The wholesale app uses customer membership (tags) for pricing.
- The new app uses **new customer accounts** (passwordless email code), and existing customers will need to know about that. The store has to switch to new customer accounts in **Settings → Customer accounts**.

### 5.8 Contact

- Contact form with fields: name, email, phone, **Order Number**, message.
- Shopify's `contact` form isn't available through the Storefront API. Options: a server action that sends email (SMTP/Resend), the Shopify Forms app, or create the customer with `customerCreate`, tag it and email the team.

## 6. Apps and integrations on the live site

| App / script | What it does | Headless plan | Priority |
|---|---|---|---|
| **Wholesale Pricing & Membership Manager** (SpurIT) | Quantity tier prices, member pricing | ⚠️ Theme-only. Replace with Shopify **B2B** catalogs + quantity price breaks (Plus), or a discount app built on Shopify Functions so prices apply at checkout | **High** |
| Beast Currency Converter (Doubly) | Shows prices in other currencies | Use Shopify **Markets** (MXN market) + `@inContext(country:)` in the Storefront API | Medium |
| GTranslate | Language switcher (its snippet is **missing**, causing a Liquid error) | Shopify Translate & Adapt + `/en/` locale routing | Medium |
| Essential Announcement Bar | Top bar message | Metaobject or env/config string | Low |
| Essential Pre-order / Presale | Pre-order button for unavailable items | Selling plans or a "Sobre pedido" (made to order) label when stock = 0. Check whether it's used | Medium |
| Globo Also Bought | Cross-sell | Storefront API `productRecommendations(intent: COMPLEMENTARY)` + Search & Discovery app | Low |
| Tipo Related Products | Related products | `productRecommendations(intent: RELATED)` | Low |
| QE Recently Viewed | Recently viewed products | Client-side `localStorage` | Low |
| ELS Product Lookup | SKU lookup | Replace with Quick Order + SKU search | Medium |
| Searchanise | Search widget | Native search + predictive search (or keep Searchanise's API if it's worth it) | Low |
| WhatsApp Chat Button (SuperLemon) | Floating WhatsApp | Simple `wa.me` link component | Low |
| Shopify Inbox | Live chat | Check headless support; otherwise WhatsApp only | Low |
| Yeps | Unconfirmed (app block on every page) | Ask the store what it's used for | ? |
| Google AdSense script, Google site verification, Google Analytics | Ads/verification/analytics | Re-add verification meta; GA4 via Shopify analytics/Customer Privacy | Medium |
| Hulk (leftover) | Uninstalled app, leftover snippet reference | Drop | – |

## 7. Decisions needed

1. **Wholesale/tier pricing:** is it still used? Which customers get it? Is the store on Shopify Plus (native B2B) or not?
2. **Which store is the source of truth?** Products live on `controls-online`. Do we migrate everything to `ecentinela`, or point the headless app at `controls-online` and skip migration?
3. **Collection UX:** keep the table + bulk quantity ordering (recommended for this audience) or switch to cards? Add filters by vendor/specs?
4. **Languages/currency:** keep English? Show MXN prices?
5. **Customer accounts:** OK to move customers to new customer accounts (passwordless)?
6. **Content to drop:** empty blogs, the 2017 PDF catalog, `search-results-page`, `product-lookup-preview`, "Productos Retirados".
7. **Domain cutover:** when does `e-centinela.com` move from the Liquid theme to the headless app? Plan redirects and Search Console.

## 8. SEO and URL parity

- Keep the same paths: `/products/{handle}`, `/collections/{handle}`, `/pages/{handle}`, `/policies/{handle}`, `/blogs/...`, and the `/en/` prefix. The Next app already uses the first two.
- Keep the same product and collection **handles** when importing, so existing Google rankings and links keep working.
- Sitemap must include all ~5.6k products, 609 collections, pages and English versions (split into multiple sitemap files like Shopify does).
- Set `hreflang` (es/en/x-default) and canonical URLs from `SITE_ORIGIN`.
- Carry over the Google site verification meta tag.
- Recreate Shopify URL redirects, or handle them in the app (`not-found.tsx` already checks Shopify redirects).

## 9. Gaps in this audit

- **Product pages weren't inspected.** `/products/*` returned `429` with `Retry-After: 60` on every attempt for the identified audit agent. Check by hand in a browser: layout, images/gallery, specs, tier pricing, stock, datasheet, related products, pre-order, English version.
- Logged-in behavior (wholesale prices, order history) wasn't checked; it needs a wholesale test account.
- The mobile layout was only inferred from CSS classes.
- Sub-menus for the ~586 collections not in the main menu weren't traced.

## 10. Problems found on the live site

- `Liquid error (layout/theme line 194): Could not find asset snippets/gtranslate.liquid` appears on every page.
- Leftover reference to the uninstalled Hulk app.
- `/pages/about-us` holds the Terms and Conditions, while the real about page is `/pages/nosotros`.
- The "Fusibles y Accesorios" menu item points to `/collections/motores`.
- Both blogs are empty but listed in the sitemap.
- Header "Catálogo" links to a PDF from February 2017.
- Footer mixes Spanish and English labels ("Terms of Service", "Refund policy").

## 11. Follow-up checklist

### Data
- [ ] Export products CSV from `controls-online` (Products → Export → All products)
- [ ] Export collections (incl. smart collection rules) and recreate them in `ecentinela`
- [ ] Copy the datasheet PDFs to `ecentinela` Files; add a `custom.datasheet` file metafield to products
- [ ] Create locations, import products, then import inventory (`inventory_export_1.csv`)
- [ ] Export and import English translations
- [ ] Export URL redirects
- [ ] Export customers (and wholesale tags)

### App features
- [ ] Spanish UI strings (`es-MX` default) + `/en/` locale routing
- [ ] Header: announcement bar, Quick Order, Contacto, Catálogo, mini cart with count and total
- [ ] Category menu with the 22 categories (+ sub-categories)
- [ ] Collection **table view** with per-row quantity + bulk "Actualizar carrito"
- [ ] Show stock count (`quantityAvailable`, needs the `unauthenticated_read_product_inventory` scope)
- [ ] Datasheet PDF link on collection rows and product pages
- [ ] Product page parity (after checking it by hand, see §9)
- [ ] Quick Order page (SKU autocomplete, 10+ rows, add all to cart)
- [ ] SKU-first search
- [ ] `/pages/[handle]` route (Nosotros, Términos, Privacidad)
- [ ] `/policies/[handle]` route
- [ ] Contact page + form handling
- [ ] Brand strip on home
- [ ] WhatsApp button
- [ ] Related / complementary products
- [ ] Recently viewed
- [ ] Tier/wholesale pricing (after decision §7.1)
- [ ] Currency (MXN market) if wanted
- [ ] Google verification + analytics
- [ ] Sitemap/hreflang covering all products, collections, pages, `/en/`
- [ ] Footer with legal links, payment badges, business address

### Launch
- [ ] Switch `ecentinela` to new customer accounts and register callback URLs for the production domain
- [ ] Load-test collection pages with real data (5.6k products, 609 collections)
- [ ] DNS cutover plan for `e-centinela.com` + Search Console
