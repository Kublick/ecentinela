# Layout research and proposed design

Research date: 2026-11-06. Looks at how industrial and electrical distributors lay out large part-number catalogs, which starter templates fit, and what first-party usability research says. It ends with a page-by-page design proposal to review before the layout work starts. Read it alongside `docs/site-audit.md`, which describes the live e-centinela.com site.

Labels used below: **Seen** means I looked at the page myself (fetched it or opened it in a browser) on the date above. **Recommendation** marks my own proposal, not a fact about any site or tool.

## 1. Summary

- **Every distributor that loaded uses a table, not a card grid, on its listing pages.** Digi-Key, AutomationDirect and McMaster-Carr all list products as rows with the part number, price and stock, followed by spec columns (§2). Baymard's research says desktop listings of spec-heavy B2B parts should be product tables, and mobile should switch to a list view ([Baymard](https://baymard.com/blog/use-product-tables-for-desktop-product-listings)). The live site's ordering table is the right base, and so is this repo's `ProductTable`.
- **Distributors don't show a hero image.** They put a category directory at the top of the home page: McMaster opens with an A–Z list of about 29 categories, and AutomationDirect has a "Shop All Products" block per category with subcategory tiles. **Recommendation:** replace the lifestyle hero on our home page with search, Quick Order and the 23 categories.
- **Search is the main way in, and it takes part numbers.** RS's placeholder reads "Search by keyword, manufacturer part no. or RS part no." ([RS](https://uk.rs-online.com/web/)). **Recommendation:** use a wide search field in the header with similar Spanish copy.
- **Ordering by part number is a standard tool, usually close to the cart.**
  - AutomationDirect has a "Quick Order" link in the header that opens a 10-row Part Number + Qty modal on the cart page. The cart page also offers Quote/BOM and CSV upload.
  - Digi-Key's cart has a "Manual Entry" form (Quantity, Part Number, Customer Reference) and an "Upload a List" link in the header.
  - **Recommendation:** keep the `/pages/quick-order` page and add a "Upload/paste a list" option and a quick-add row on the cart page.
- **Categories are reached two ways:** a mega menu (Digi-Key, RS) and subcategory tiles at the top of a category page (AutomationDirect, McMaster). Our subcategories are text-only tags (366 in total, up to 46 per category, mostly "Brand + line"). **Recommendation:** use a two-pane category menu in the header, and on the category page show the subcategories grouped by brand above the table.
- **Product pages put the datasheet, stock and specs up front.**
  - Digi-Key: "Datasheet" link, "In-Stock" count, attribute table, price-break table.
  - AutomationDirect: Downloads tab with spec PDFs, "31 Available".
  - Baymard's B2B study calls datasheets, pricing tables and stock "core" product-page content ([Baymard](https://baymard.com/blog/b2b-electronic-components-machinery-launch)).
- **Mexican distributors (§2.6) add things the US sites don't show:**
  - **Tax status next to the price:** "Pesos Mexicanos (MN) + IVA" on idsupply, "Precios sin IVA" on Syscom.
  - **Invoicing:** "Facturación el mismo día" on idsupply; a SAT product code on each Syscom product.
  - **WhatsApp in the header**, plus phone numbers per city.
  - **"Solicitar cotización"** as a main call to action (idsupply), next to the cart.
  - Newark México shows prices in **USD** with a per-row qty box and an "Añadir" button. That's the closest match to e-centinela's table.
  - **Recommendation:** add the IVA label, the invoicing note, a WhatsApp header link and a "Solicitar cotización" action.
- **shadcn/ui is a good fit as a component source, but there's nothing to fork.**
  - It's MIT licensed and works with Tailwind v4 and React 19. I found no ecommerce blocks.
  - Vercel's `commerce` template is archived. Its successor, `vercel/shop`, uses Next.js 16, Tailwind 4, shadcn/ui and the Hydrogen SDK, but it's a B2C storefront.
  - StackZero's commerce-ui (MIT) installs through the shadcn CLI. Its blocks are B2C product cards, reviews, a cart page and a product page. It has no table, header, mega menu or quick order (§3.1).
  - **Recommendation:** add shadcn to this repo for a handful of primitives (§3.4) and keep the existing Hydrogen cart and drawer code. Borrow StackZero's Quantity Input and Price Format components at most.

## 2. Comparison of the sites studied

### 2.1 What could be checked

| Site | Result |
|---|---|
| AutomationDirect | ✅ Fetched; I also opened the listing and Quick Order in a browser |
| Digi-Key (.com and .com.mx) | ✅ Fetched (home, listing, product, cart) |
| McMaster-Carr | ✅ Partly fetched; I opened a category and a listing table in a browser |
| RS (uk.rs-online.com) | 🟡 Home page only. Category, listing and product pages returned 403. mx.rs-online.com returned 403 |
| Cyberpuerta.mx (Mexican; mostly IT/consumer, but has an industrial-control section) | ✅ Fetched (home, contactor listing, product) |
| Grainger (.com and .com.mx) | ❌ Error page, then 403, including in a real browser |
| Mouser (.com and .mx) | ❌ Bot wall ("Please enable JS and disable any ad blocker"), including in a real browser |
| Galco, Zoro, Allied Electronics (now redirects to us.rs-online.com) | ❌ 403 |
| idsupply.com.mx (Mexican, automation and MRO reseller) | ✅ Opened in a browser: home, brand-filtered results, product page, empty cart, `/collections` |
| Newark México (mexico.newark.com, part of Avnet) | ✅ Opened in a browser: home, fuse category, listing table, product page. WebFetch timed out |
| Syscom (syscom.mx, Mexican wholesale distributor) | ✅ Opened in a browser: Siemens results, product page. WebFetch got a 403 |
| Logicbus (tienda.logicbus.com.mx) | ❌ Cloudflare "Sorry, you have been blocked", including in a real browser |
| Tecnosinergia | ❌ Empty response |

Mexican sites are compared separately in §2.6. Searches for other Mexican industrial-electrical stores mostly returned directories (dirind.com) and Mercado Libre or eBay listings, not catalogs. Nothing below is filled in from memory for the blocked sites.

### 2.2 Comparison table

| | AutomationDirect | Digi-Key | McMaster-Carr | RS | Cyberpuerta.mx |
|---|---|---|---|---|---|
| **Header search** | Text box "Search" next to the logo, plus a search-history button | Search box (the fetch didn't capture its placeholder); "Upload a List" in the top bar | Wide box "Search" with an image-search icon | "Search by keyword, manufacturer part no. or RS part no." | Search box (placeholder not captured) |
| **Order by part number** | "Quick Order" in the header opens a 10-row modal (Part Number, Fav, Qty). The cart page also has Add Quote/Bom and CSV Upload | Cart page "Manual Entry" (Quantity, Part Number, Customer Reference), "Upload a File", "Bulk Add" | "Order" and "Order History" links in the header | Not seen; `/web/quickorder/` returned 404 | None |
| **Account / cart** | Login/Register, "Accounts & Orders", cart icon with count and $ total | "Account & Lists" (Orders, Carts, Lists, Quotes), cart count, "Request a Quote" | Log in, Order, Order History, phone in the header | Login / Sign up, "View Basket (0)" | "Hola, inicia sesión", "Tu carrito de compras" |
| **Category navigation** | Left category list. Category pages show image tiles at least 3 levels deep | "Products" mega menu: ~17 families, each with subcategories and "See All" | "Browse Catalog" menu. Category pages show subcategory tiles with product counts, filters on the left | Four-column "Menu" mega menu | "Categorías" menu, category tiles on home |
| **Listing layout** | List / Grid / **Table** toggle. Table: Item Code, Price, New, Stock ("200 Available"), Specs (PDF icon), Compare, then Brand, Series, Amperage, Coil Voltage, HP, Poles. Facets on the left with counts. Sortable headers | **Table**: Mfr Part #, Quantity Available, Price (mini break list), Series, Package, then category-specific specs. "Download Table", "Stacked / Scrolling", numbered pages, 25 per page | **Table** inside each product group: spec columns, then part number and price-break columns "1-9" / "10-Up" | Blocked | **Card grid**, 24 per page: brand, name, part number, price, stock ("Solo 5 pzas."), "Agregar", "Comparar". Filters on the left |
| **Per-row qty / bulk add** | Not in table view (only Compare checkboxes) | Not seen in the fetch | No inputs in the table; ordering happens after clicking a part number | — | No; one "Agregar" per card |
| **Product page** | Downloads tab (spec PDF, cut sheet, CAD), "31 Available", Qty and Add to BOM, tabs (Specs, Q&A, Downloads, Compliance) | "Datasheet" link, "In-Stock: 52,203", attributes table that links into filters, price breaks per packaging, substitutes table | Not checked | Blocked | Part number shown as "SKU", price, stock, "Agregar al carrito", "Especificaciones esenciales". No datasheet |
| **Home page** | New and trending carousel, promo carousel, then "Shop All Products" with a block of subcategory tiles per category | Mega menu header, service panels, grid of product category cards | A–Z "Choose a Category" list, category blocks of text links, four promo tiles, services | Promo carousel, "Browse the shop" (12 category tiles), brands, 4 featured products, newsletter | Promo carousel, deals countdown, "Descubre nuestras categorías", brands |
| **Spanish / Mexico** | — | digikey.com.mx is in Spanish ("Cargar una lista", "Finalizar Pedido") with Spanish table headers and **prices in USD** | — | mx.rs-online.com exists (403) | Spanish, MXN |

### 2.3 Sources per site

- **AutomationDirect**
  - Header, Quick Order link, category tiles and home sections: https://www.automationdirect.com/adc/home/home, https://www.automationdirect.com/adc/shopping/catalog/motor_controls, https://www.automationdirect.com/adc/shopping/catalog/motor_controls/iec_magnetic_contactors
  - Table view columns, facets and header search box (seen in a browser): https://www.automationdirect.com/adc/shopping/catalog/motor_controls/iec_magnetic_contactors/iec_contactors
  - Quick Order modal and cart tools (seen in a browser): https://www.automationdirect.com/adc/cart/cart?openQuickOrder=true
  - Product page: https://www.automationdirect.com/adc/shopping/catalog/relays_-z-_timers/timer_relays/t30r-nd-30-24ad
- **Digi-Key**
  - Home and header: https://www.digikey.com/
  - Listing: https://www.digikey.com/en/products/filter/fuses/139
  - Product: https://www.digikey.com/en/products/detail/vishay/MFU0603FF01000P500/1202604
  - Manual Entry: https://www.digikey.com/ordering/shoppingcart
  - Mexico: https://www.digikey.com.mx/, https://www.digikey.com.mx/es/products/filter/fusibles/139
- **McMaster-Carr**
  - Header and home: https://www.mcmaster.com/
  - Category tiles and filters: https://www.mcmaster.com/products/fuses/
  - Table with "1-9" / "10-Up" price columns (seen in a browser): https://www.mcmaster.com/products/fuses/ul-class-j-time-delay-fuses-for-tight-spaces~~/
- **RS:** https://uk.rs-online.com/web/, https://www.rs-online.com/, https://es.rs-online.com/web/
- **Cyberpuerta**
  - https://www.cyberpuerta.mx/
  - https://www.cyberpuerta.mx/Energia/Control-Industrial/Contactores/
  - https://www.cyberpuerta.mx/Energia/Control-Industrial/Contactores/ABB-Contactor-1SBL237001R1300-3-Polos-250V-25A.html

### 2.4 Notes

- **Wide tables are normal.** Digi-Key's fuse table has about 20 columns and offers a "Scrolling" mode. AutomationDirect's table scrolls sideways past the spec columns. Our products don't have structured specs (the description is rich text), so our table stays narrow. That's a plus on mobile.
- **Only Newark México has a quantity box on every row.**
  - Each row has a qty input and its own "Añadir" button (§2.6).
  - Digi-Key, AutomationDirect and McMaster push ordering to the product page, the cart or a Quick Order tool.
  - No site I saw has the live e-centinela pattern of one bulk button for the whole table. It suits buyers who reorder the same parts.
  - **Recommendation:** keep the bulk button, since it's the main must-keep in `site-audit.md` §5.2.
- **Digi-Key Mexico charges in USD** with Spanish copy, the same as e-centinela today. That's a reasonable model if a MXN market isn't set up (`site-audit.md` §7.4).
- **The research doesn't cover Quick Order.** No Baymard or NN/g article I found covers part-number entry or reorder, so the Quick Order design rests on the distributor examples above.

### 2.5 Usability guidance (first-party research)

- **Baymard, product tables.** Use product tables for spec-heavy desktop listings, with filters on several parameters and sorting by spec columns. On mobile, use a list view. https://baymard.com/blog/use-product-tables-for-desktop-product-listings
- **Baymard, B2B electronic components study.** The product table is critical. Sticky scrollbars, persistent column headings and tooltips on sort arrows help. Product pages need datasheets, pricing tables, stock and shipping status, and compatible-parts info. https://baymard.com/blog/b2b-electronic-components-machinery-launch
- **Baymard, long filter lists.** When a filter has roughly 15–20 or more options, let people search within it, and order the options logically. This applies to our categories with 28–46 subcategories. https://baymard.com/research-articles/allow-search-for-long-filter-options-lists
- **Baymard, quick views.** Avoid quick-view overlays for spec-driven products. Put enough detail in the list itself. https://baymard.com/blog/ecommerce-quick-views
- **NN/g, data tables.**
  - Make the first column a readable identifier and freeze the header row.
  - Filters should be visible, and it should be obvious when one is active.
  - Use checkboxes for batch actions.
  https://www.nngroup.com/articles/data-tables/
- **NN/g, B2B specs.** Publish specs as HTML as well as PDF. Chunk long spec lists into tables with subheadings. https://www.nngroup.com/articles/b2b-specs/
- **NN/g, B2B usability.** Show prices, and give enough product detail to judge fit without registering. https://www.nngroup.com/articles/b2b-usability/
- **NN/g, mega menus.** Use medium-sized groups with distinct labels and a short hover delay (about 0.5 s). Make the menu work with a keyboard and screen reader, and link top-level items to real pages. https://www.nngroup.com/articles/mega-menus-work-well/
- **NN/g, filters vs facets.** Faceted navigation costs a lot to build and maintain, so first check that shoppers need it. https://www.nngroup.com/articles/filters-vs-facets/

### 2.6 Mexican distributors

All three were opened in a real browser on 2026-11-06. I didn't add anything to a cart or submit any form.

| | idsupply.com.mx | Newark México | Syscom |
|---|---|---|---|
| **Platform** | Shopify (`window.Shopify` present). Theme "Ignite" 2.4.0, theme store ID 3027. Search and filters from **Searchanise**: its scripts load from `searchanise-ef84.kxcdn.com`, and `/pages/search-results-page` is its results page. `rb_vendor` is its brand filter parameter. Some sections are built with GemPages (`assets.gemcommerce.com`) | Not checked | Not checked |
| **Header** | Top bar "Respuesta Inmediata por: Whatsapp \| e-mail \| +52(33)… \| +52(81)… \| +52(55)…", plus Whatsapp and Iniciar sesión. Logo, then a search box with a "Todos" product-type dropdown and a rotating placeholder ("Servomotores...", "Arrancadores..."). A "Tel. Nacional CDMX-MTY-GDL" box and a cart icon (no total). Nav: Inicio · Productos · Contacto · Marcas ▾ · Nosotros | Search "Palabra clave / N.° de pieza" with a "Todos" dropdown. Cart showing "0 elementos $0.00". Bar: Todos los productos ▾ · Fabricantes ▾ · Recursos ▾ · "Carga de lista de materiales (BOM)" · Herramientas ▾. Links to "Pedido rápido" (`/orden-rapida`) and "Solicitar una cotización" | Search "Buscar productos"; Iniciar Sesión; Carrito |
| **Category navigation** | **No category menu.** "Marcas ▾" lists 24 brands, each a link to `search-results-page?rb_vendor=…`. "Productos" opens the unfiltered results page. `/collections` is an empty theme placeholder ("Add a brief introduction to the page.") | Category landing pages with text subcategory links and counts ("Fusibles (8,169)"), then "Ver todos los productos" | Left filters: Categorías (with a search box), Marcas (with a search box), Tipos |
| **Listing** | **Card grid**, 30 per page, with a grid/list toggle and a "Relevancia" sort. Cards show "Allen Bradley 1747-L551", a description excerpt, the part number, the price in MXN and a "VISTA RÁPIDA" (quick view) button. **No qty or add to cart on the listing.** Facets with **English labels**: "Price, $", "Availability" (In Stock 523 / Pre-Order 3017), "Vendor", "Product type" (spelling duplicates: Automatización / Automatizacion / Automatizaciòn), "Discount". The page said "Mostrando 3548 resultados" with the Allen Bradley chip active, while the Vendor facet listed Allen Bradley at 1,722 | **Table**: Comparar · Número de pieza del fabricante · Código Farnell · Fabricante / Descripción (with a "Data Sheet" link) · Disponibilidad ("12 En stock") · Precio para · **Precio en USD** (breaks 1+/5+/10+/25+/50+) · **Cantidad (input) + "Añadir" on every row** · then spec columns. Filters are dropdown buttons above the table, plus "En stock" and "Apto para nuevos diseños" checkboxes and a "Buscar en..." box | **Card grid**: brand, name, part number (with a copy button). **No price until you log in**: each card shows "Iniciar sesión". Filters include **Sucursal** ("Todas las sucursales"), "Con existencias", "Caja abierta", "Producto Nuevo". "Descargar listado". Note "Precios sin IVA" |
| **Product page** | Title, description, "SKU: 1747-L551", "Condición: Nuevo", "Disponible para ordenar!", "**$ 34,251.00 Pesos Mexicanos (MN) + IVA**", qty and "AGREGAR AL CARRITO". Payment badges (Mercado Pago, Visa, Mastercard, Amex). Icons: "**Facturación el mismo día**", "Envío sin costo en pedidos mayores a $4,000.00 MN", "Garantía directa por 1 año". Accordions: Disponibilidad y Entrega, Especialistas…, Aviso sobre Marcas. A quote form ("Enviar Solicitud"). **No datasheet** | "No. Parte Fabricante" with "Copiar"; manufacturer lead time ("6 semanas"); "Hoja de datos técnicos – Data Sheet"; "12 En Stock"; "Envío estándar sin costo en pedidos superiores a $150 Dlls"; a price-break table (Cantidad / Precio en USD); "Añadir a la cesta"; "Mínimo: 1 / Múltiple: 1"; "Su número de pieza" | Part number as the heading, bullet specs, Modelo, Marca, **SAT 39121602** (the SAT product code used on invoices), "3 años de garantía", "Inicia sesión para ver precios especiales". Tabs include **Descargas** with a "Ficha Técnica" PDF. "Alternativas similares" with spec chips |
| **Home** | Hero "Automatización, equipo eléctrico y redes industriales" with brand logos and "**Solicitar Cotización**", value props ("Precios preferentes para mayoristas", "Envío sin costo… mayores a $4,000 MN", "Pagos… transferencia, PayPal y Mercado Pago"), a contact and quote form, and a reseller disclaimer | Promo banners, category links, service points, an account links block ("Pedido rápido", "Cotizaciones") | Not checked |
| **Cart** | Empty cart shows "Tu carrito esta vacío" plus product cards under an untranslated "Featured collection" heading | Not opened | Not opened |

**Sources:**
- **idsupply**
  - https://idsupply.com.mx/
  - https://idsupply.com.mx/pages/search-results-page?page=2&rb_vendor=Allen%20Bradley
  - https://idsupply.com.mx/products/allen-bradley-1747-l551
  - https://idsupply.com.mx/cart
  - https://idsupply.com.mx/collections
- **Newark México**
  - https://mexico.newark.com/
  - https://mexico.newark.com/c/proteccion-de-circuitos/fusibles-accesorios-para-fusible/fusibles/fusibles-de-potencia-electrica-e-industrial
  - https://mexico.newark.com/eaton-bussmann/lpj-30sp/fuse-30a-600v-time-delay/dp/02B4585
- **Syscom**
  - https://www.syscom.mx/products?query=SIEMENS&refinement%5Bmarca%5D=SIEMENS
  - https://www.syscom.mx/products/245540

**What Mexican buyers see that the US sites don't show:**
- **IVA status next to the price:** idsupply says "+ IVA" and Syscom says "Precios sin IVA". None of the US sites I checked label tax.
- **Factura:** idsupply promises "Facturación el mismo día", and Syscom shows each product's SAT code. Business buyers need a CFDI invoice.
- **Currency:** idsupply prices in MXN. Newark México and Digi-Key México price in USD, as e-centinela does today.
- **WhatsApp and per-city phone numbers** in the header (idsupply), and a floating WhatsApp button (idsupply; e-centinela has one today).
- **Quote requests:** "Solicitar Cotización" is idsupply's hero button, and there's a quote form on every product page. Newark has "Solicitar una cotización".
- **Login-gated or wholesale pricing:** Syscom shows no price until login. idsupply advertises "Precios preferentes para mayoristas" through quotes.
- **Local payment methods:** Mercado Pago and bank transfer (idsupply).
- **Branch stock:** Syscom filters by branch (Sucursal). e-centinela has two locations in its inventory export (`site-audit.md` §2).

**What not to copy from idsupply:**
- Brand-only navigation with no category tree.
- A card grid without qty on the listing, plus quick views (Baymard advises against them).
- English facet labels on a Spanish site, and spelling duplicates in the product types.
- A result count that doesn't match the active filter.

## 3. Templates and shadcn

### 3.1 What exists

| Option | What it is | License | Fit for a B2B parts table |
|---|---|---|---|
| **shadcn/ui** | Copy-in components on Base UI (the default since July 2026), Radix or React Aria. Updated for Tailwind v4 and React 19 ([changelog](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default), [Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)) | MIT ([LICENSE](https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md)) | Good for primitives. Table, Data Table (a TanStack guide), Command, Sheet, Drawer, Navigation Menu, Sidebar, Pagination, Input, Button, Badge, Breadcrumb, Tabs and Combobox all exist ([components](https://ui.shadcn.com/docs/components)). The blocks page lists dashboard, sidebar, login and signup blocks. I found no ecommerce blocks ([blocks](https://ui.shadcn.com/blocks)), and `/examples` and `/templates` returned 404 |
| **Vercel Next.js Commerce** (`vercel/commerce`) | Archived and deprecated; the README points to `vercel/shop`. Next 15 canary, Tailwind 4, Headless UI, no shadcn ([repo](https://github.com/vercel/commerce), [package.json](https://raw.githubusercontent.com/vercel/commerce/main/package.json)) | MIT | Poor. Deprecated, grid-only B2C |
| **Vercel Shop** (`vercel/shop`) | Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, and the Shopify Storefront API through the Hydrogen SDK. Collections, predictive search, optimistic cart ([repo](https://github.com/vercel/shop)). It's also the Next.js starter Hydrogen points to ([Hydrogen repo](https://github.com/Shopify/hydrogen)) | MIT | Same stack as this repo, but B2C, and no B2B, table or quick order is mentioned. Useful as a reference for how shadcn sits next to Hydrogen; not worth forking, since this repo already has the Hydrogen wiring |
| **Hydrogen React Router template** | Hydrogen's official starter. The old `skeleton` template URL returns 404 ([repo](https://github.com/Shopify/hydrogen)) | MIT | Different framework; conventions only |
| **Dawn** | Shopify's reference Liquid theme | The license limits use to Shopify themes: "All other uses of the Software are strictly prohibited" ([LICENSE](https://raw.githubusercontent.com/Shopify/dawn/main/LICENSE.md)) | **Can't reuse its code** in this app |
| **StackZero commerce-ui** ([ui.stackzero.co](https://ui.stackzero.co/), repo [stackzero-labs/ui](https://github.com/stackzero-labs/ui)) | Free copy-paste commerce components and blocks, marked "beta". The home page says "23 components \| 44 examples \| 44 blocks". Blocks: Address, Banners, Product Card, Product Variants, Reviews, Carts (Alpha) and one Product Page (Alpha). Components: Image Carousel, Image Viewer, Phone Number Input, Price Format, **Quantity Input**, ratings, variant selectors ([docs](https://ui.stackzero.co/docs/installation)). Installed with the **shadcn CLI** from its registry, e.g. `pnpm dlx shadcn@latest add https://ui.stackzero.co/r/product-card-01-block.json` ([CLI](https://ui.stackzero.co/docs/cli)). Styled for Tailwind v4; the docs use `clsx` + `tailwind-merge` for `cn` ([installation](https://ui.stackzero.co/docs/installation)). The repo's own site runs Next 15.2.4, React 19, Tailwind 4.1 and `@radix-ui/*` packages, plus `motion` ([package.json](https://raw.githubusercontent.com/stackzero-labs/ui/main/package.json)). The only paid item is "Xeon", a $29 SaaS landing-page template on Next.js 14 sold through Gumroad ([Xeon](https://ui.stackzero.co/docs/templates/xeon)) | MIT (README; [repo](https://github.com/stackzero-labs/ui)) | **Low.** No table, listing, header, mega menu, search, quick order or cart drawer. Its product page and cart blocks are B2C (ratings, color variants, "VAT (20%)") ([product pages](https://ui.stackzero.co/docs/pages/products), [carts](https://ui.stackzero.co/docs/blocks/carts)). Worth borrowing: **Quantity Input** and **Price Format**. Not checked: whether its components resolve against a Base UI shadcn setup (its repo uses Radix) or run on Next 16 |
| **Shopify B2B "Quick order list"** | A theme section on a product page: a table with one row per variant (image, title, SKU, unit price, qty, line total, remove), live subtotal, "Remove all", stock-limit errors ([Shopify Help](https://help.shopify.com/en/manual/b2b/store-customization/quick-order-list)) | n/a (theme feature) | A pattern to borrow (live subtotal, per-row errors), not code. Our products have one variant each, so it doesn't apply directly |

**Conclusion:** no template fits a table-first B2B parts catalog, StackZero included. **Recommendation:** build from shadcn primitives in this repo.

**On StackZero (recommendation):**
- It doesn't change the plan. It's an add-on registry on top of shadcn, not a replacement.
- If we take its Quantity Input (for the table and cart steppers) or Price Format, initializing shadcn with Radix (`init -b radix`) avoids mixing primitive libraries, since StackZero's own repo uses `@radix-ui/*`.
- Its Quantity Input would replace our `QuantityStepper.tsx`. Only do that if it's clearly better, since ours already works with the cart.

### 3.2 Adopt shadcn? Recommendation: yes, selectively

- **Why:**
  - Hand-building an accessible mega menu, a combobox (Quick Order autocomplete), a filter sheet and tooltips is the expensive part of the layout work. shadcn gives tested versions of those.
  - It's MIT and copy-in, so no runtime dependency on a UI vendor.
- **Keep what works:**
  - `CartDrawer` (native `<dialog>`, built to the `hydrogen-cart-drawer` guide)
  - `ProductTable`'s cart logic (`Shopify.actions.updateCart`)
  - `PredictiveSearchModal`'s data wiring
  - the `globals.css` tokens
  - Restyle these rather than replace them.
- **Data Table (TanStack): not needed.** Sorting and pagination already run on the server through the Storefront API (the `SortSelect` and `Pagination` in `CollectionBrowser`), and a page holds 20–50 rows. The plain `Table` component is enough.

### 3.3 Install in this repo (Tailwind v4, existing project)

The commands come from the official docs; the merge notes are my recommendation.

1. Prerequisites: Tailwind and the `@/*` alias. Both are already set up (`tailwindcss` ^4.2.4 in `package.json`; `"@/*": ["./*"]` in `tsconfig.json`).
2. `pnpm dlx shadcn@latest init`. Add `-b radix` only if we prefer Radix over the Base UI default ([install for Next.js](https://ui.shadcn.com/docs/installation/next), [Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)).
3. What it adds, per the manual-install page ([manual](https://ui.shadcn.com/docs/installation/manual), [components.json](https://ui.shadcn.com/docs/components-json)):
   - the packages `shadcn`, `class-variance-authority`, `cn`, `lucide-react` and `tw-animate-css`
   - `lib/utils.ts` (`export { cn } from "cn"`)
   - `components.json`, with `tailwind.config` empty for v4. `style`, `baseColor` and `cssVariables` can't be changed after init.
   - In `globals.css`:
     - `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"`
     - a `@custom-variant dark`
     - an `@theme inline` block mapping `--color-primary`, `--color-background` and so on to `:root` variables
     - `oklch` colors
4. **Merge by hand.** `app/globals.css` already defines `--color-primary` (brand `#1b4332`), `--color-border`, the radius tokens and others in `@theme`. Those names overlap with shadcn's `@theme inline` names.
   - **Recommendation:** keep our `@theme` as the source of truth. Set shadcn's `:root` variables from our tokens (`--primary: var(--color-primary)`, `--border: var(--color-border)`, `--radius: 0.5rem`), and drop shadcn's duplicate `@theme inline` entries.
   - Skip the `.dark` block unless dark mode is wanted.
   - The docs don't describe merging into an existing `@theme` ([Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)), so plan a short manual pass and check that the existing `button-primary` and `type-*` classes still render.
5. Add only what the layout uses: `pnpm dlx shadcn@latest add table navigation-menu command popover sheet input button badge pagination breadcrumb tooltip tabs`.
6. Run `pnpm lint && pnpm typecheck && pnpm test` and compare the collection page before and after.

### 3.4 Component map (recommendation)

| Need | shadcn component | Replaces / wraps |
|---|---|---|
| Category mega menu | Navigation Menu | New. Today the header has a single "Categorías" link |
| Mobile category navigation, filter panel | Sheet (side panel) | `MobileNavDialog`; the filter sidebar on mobile |
| Search and Quick Order autocomplete | Command (+ Popover) | Search stays on `PredictiveSearchModal` data; Quick Order is new |
| Ordering table | Table | Restyles `ProductTable`'s markup; cart logic stays |
| Stock, "Nuevo", "Sobre pedido" labels | Badge | Plain text today |
| Pagination, breadcrumbs | Pagination, Breadcrumb | `Pagination` in `CollectionBrowser`, `Breadcrumbs.tsx` |
| Product page sections (Description / Specs / Downloads) | Tabs | New |
| Datasheet icon label, sort hints | Tooltip | New |
| Qty steppers (optional) | StackZero Quantity Input (from its registry) | `QuantityStepper.tsx` |

## 4. Proposed design for review

Everything in this section is a **recommendation**. Copy is in Spanish (the default locale); English mirrors it under `/en`.

### 4.1 Global header and navigation

**Layout:** three bands, sticky as a unit on desktop. On scroll, only band 2 stays sticky.

1. **Announcement bar:** the free-shipping message. It already renders from `content.announcement` in `app/[lang]/layout.tsx`.
2. **Main band:**
   - the live site's white logo SVG (§4.9) on the navy band
   - **wide search** (about 50% of the width). Keep the live site's placeholder, "Número de Parte / Palabra Clave". Returning buyers know it, and it matches Newark México's "Palabra clave / N.° de pieza".
   - "Orden rápida" button
   - account
   - cart showing "(N) $total USD" (the live site shows count and total, and so do AutomationDirect and Newark México)
3. **Nav band:**
   - a "Categorías ▾" mega menu trigger
   - links: Orden rápida · Marcas · Solicitar cotización · Contacto
   - right-aligned: phone 686-592-9294 and **WhatsApp**. McMaster and AutomationDirect put the phone in the header, and idsupply puts WhatsApp and phone numbers in its top bar (§2.6).

**Mega menu (two-pane, keyboard accessible, ~0.5 s hover delay per NN/g):**
- **Left pane:** the 23 categories in the order of `lib/categories.json`. "Productos Retirados" goes last and dimmed.
- **Right pane:** the hovered or focused category's subcategories, **grouped by brand**. Most tags start with a brand ("Eaton Pulsadores 22mm", "Weidmuller Clemas de paso"); tags without one go under "Otros". Up to 46 tags per category means 3–4 columns.
- **What to filter out:** drop the tag that equals the category name ("Borneras de Conexión"), and merge the case and spacing duplicates that `lib/categories.ts` already handles.
- **Links:** each category links to `/collections/{handle}`, and each subcategory to the URL `subcategoryRedirect` already understands (`/collections/{handle}/{tag-handle}` → the collection with the tag filter applied).

**Mobile:** hamburger → Sheet from the left with the category list. Tapping a category drills into its brand-grouped subcategories with a "← Categorías" back row. Search stays visible as a full-width field under the logo row.

**Changes from today:** `Header.tsx` is a single 64 px row with the logo "CORE", one nav link and a search icon. It gains the real logo, the visible search field, Orden rápida, Solicitar cotización, the cart total, the phone and WhatsApp, and the mega menu.

**StackZero starting point:** none. It has no header or navigation blocks. Use shadcn Navigation Menu and Sheet.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Envío gratuito en órdenes mayores a $300 USD (aplica solo a BC, BCS y Sonora)│  green band
├──────────────────────────────────────────────────────────────────────────────┤
│ [✕ ELÉCTRICA CENTINELA]  [🔍 Número de Parte / Palabra Clave            ]     │  navy band
│                                     [Orden rápida]  Mi cuenta  🛒 (3) $412.50 │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☰ Categorías ▾  Orden rápida  Marcas  Cotización  Contacto  ☎ 686-592-9294 WA│
└──────────────────────────────────────────────────────────────────────────────┘
  Mega menu open on "Control de Motores":
┌───────────────────────────┬──────────────────────────────────────────────────┐
│ Borneras de Conexión      │ CONTROL DE MOTORES                   Ver todo →  │
│ Botonería / Selectores    │ ABB                 Eaton               Lovato   │
│ Cables                    │  Contactores 5-10HP  Contactores 3-10HP  Serie BF │
│▶Control de Motores        │  Contactores 15-25HP Contactores 15-20HP Serie BG │
│ Control de Proceso        │  Guardamotores       Guardamotores       Siemens  │
│ Controladores Programables│  Relevadores Térm.   Relev. Sobrecarga   Contact. S1│
│ Desconectadores / Protec. │  …                   …                   Guardam. │
│ …                         │                                                  │
│ Productos Retirados       │                                                  │
└───────────────────────────┴──────────────────────────────────────────────────┘
```

### 4.2 Home

**Layout** (modeled on the McMaster and AutomationDirect directories, not a hero):

1. **Search band:**
   - heading "Material eléctrico industrial en Mexicali"
   - a large search field
   - two buttons, "Orden rápida" and "Descargar catálogo" (only if a current PDF exists, see §5)
2. **Category grid:** 23 tiles, 4 per row on desktop. Each tile has a small image or icon, the name, and the top 3–4 subcategories as text links plus "Ver todo".
3. **Brand strip:** the 17 brands from `site-audit.md` §5.1. **Recommendation:** link each brand to our own search filtered by vendor, not to the manufacturer's site.
4. **Optional "Novedades / Más vendidos" table:** a short `ProductTable` (5–10 rows), not cards.
5. **Service band:**
   - pickup and address in Mexicali
   - the free-shipping zones
   - phone and WhatsApp
   - business hours

**Service band copy:** add "Facturamos (CFDI)" and "Precios en USD + IVA" to the service band. Both idsupply and Syscom state invoicing and tax status up front (§2.6). Confirm the wording with the business (§5).

**Key components:** search input (Command), category tile, brand strip, `ProductTable`.

**Brand strip images:** reuse the live site's logo files, listed in §4.9.

**StackZero starting point:** none. Its Banners blocks are B2C promos (countdowns, "Shop Now"), and we're dropping the hero.

**Changes from today:** `app/[lang]/page.tsx` has an Unsplash hero, a "best sellers" `ProductCard` grid and "shop by category" cards. Remove the hero and replace the card grid with the category directory.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [header]                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Material eléctrico industrial en Mexicali                                   │
│  [🔍 Número de parte, marca o descripción                         ][Buscar]   │
│  [Orden rápida]   [Descargar catálogo PDF]                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Categorías                                                                  │
│ ┌────────────────┐┌────────────────┐┌────────────────┐┌────────────────┐     │
│ │[img] Borneras  ││[img] Botonería ││[img] Cables    ││[img] Control de│     │
│ │ Weidmuller …   ││ Eaton 22mm …   ││ Termopar …     ││ Motores        │     │
│ │ GE Tablillas … ││ ABB 22mm …     ││ Monopolares …  ││ ABB Contact. … │     │
│ │ Ver todo →     ││ Ver todo →     ││ Ver todo →     ││ Ver todo →     │     │
│ └────────────────┘└────────────────┘└────────────────┘└────────────────┘     │
│   … 23 tiles, 4 per row …                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  Marcas: Bussmann · Eaton · ABB · Finder · Weidmüller · Siemens · Fluke · …  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Novedades   (ordering table, 8 rows)                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  📍 Calz. Benito Juárez 2238, Mexicali · ☎ 686-592-9294 · WhatsApp · L–V …   │
│  Facturamos (CFDI) · Precios en USD + IVA · Envío gratis > $300 USD en BC…   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Category page (ordering table)

**Layout, desktop:**
- breadcrumb
- H1 with the count ("Control de Motores · 412 productos")
- **subcategory chips grouped by brand** above the table: a compact text version of AutomationDirect's and McMaster's subcategory tiles. With more than about 12 chips, show the first row and a "Ver todas (36)" toggle.
- left sidebar (240 px, as today), with:
  - Subcategoría: checkbox list with a search box, per Baymard's guidance for lists over about 15–20 options
  - Marca (vendor)
  - Disponibilidad ("En existencia")
  - Precio
- above the table: "Mostrando 1–50 de 412", a sort control (Número de parte, Precio ↑↓, Existencia), and a per-page choice (25/50/100)

**Table columns:** Número de parte (sticky first column, links to the product, shows a small thumbnail) · Descripción (2 lines, expandable) · Marca · Ficha técnica (PDF icon + tooltip) · Precio USD · Existencia ("200 en existencia", or a "Sobre pedido" badge) · Cantidad (number input).

**Price and stock labels:**
- The price column header states currency and tax: "Precio USD" plus "+ IVA" if prices exclude IVA (§5). idsupply and Syscom both say this next to the price.
- If stock is split by location, the Existencia cell can show the Mexicali store first ("14 en tienda") and the other warehouse as "Sobre pedido". This follows Syscom's branch filter, and is open question 5.

**Sticky bottom action bar:** appears as soon as any quantity is above 0. It reads "3 partidas · $412.50 USD", with buttons [Limpiar] and [Agregar al carrito]. This replaces the live site's single "Actualizar carrito" button at the end of the table, so the bulk add stays reachable on a 50-row page. The sticky header row follows the NN/g guidance to freeze headers.

**Mobile:** each row turns into a stacked list item (Baymard: list view on mobile):
- part number and price on the first line
- 2 lines of description
- stock and a datasheet link
- a qty stepper

Filters open in a Sheet from a "Filtros (2)" button. Subcategory chips scroll sideways. The same sticky bar sits at the bottom.

**Changes from today:**
- `CollectionBrowser` + `ProductTable` already provide the table, the filter sidebar, sort, pagination and bulk add.
- New:
  - the subcategory chip block
  - the sticky action bar (the bulk button currently sits with the table)
  - the sticky header and first column
  - a search box inside the subcategory filter
  - the mobile list layout (today columns are just hidden at `sm`/`md`/`lg`)
  - per-page choice
- Restyle with the shadcn Table, Badge and Sheet.

**StackZero starting point:** only its Quantity Input, for the mobile steppers. The table itself has no StackZero equivalent. Newark México's listing table (§2.6) is the closest visual reference.

```
Desktop
┌──────────────────────────────────────────────────────────────────────────────┐
│ Inicio › Categorías › Control de Motores                                     │
│ Control de Motores                                           412 productos   │
│ ABB:   [Contactores 5-10 HP][Contactores 15-25 HP][Guardamotores][Rel. Térm.]│
│ Eaton: [Contactores 3-10 HP][Guardamotores y Acc.][Relev. Sobrecarga ZB] …   │
│ Siemens: [Contactores S1][Contactores S2][Guardamotores 3RV]   Ver todas (36)│
├───────────────┬──────────────────────────────────────────────────────────────┤
│ Filtros       │ Mostrando 1–50 de 412     Ordenar: [Número de parte ▾] [50 ▾]│
│ Subcategoría  │ [x Eaton Guardamotores] [Limpiar filtros]                    │
│ [🔍 filtrar ] │┌────────────┬───────────────────┬──────┬───┬───────┬────────┬─────┐
│ ☐ ABB Contac..││Nº de parte │Descripción        │Marca │PDF│Precio │Existen.│Cant.│
│ ☐ Eaton Guar..│├────────────┼───────────────────┼──────┼───┼───────┼────────┼─────┤
│ …             ││▣ PKZM0-10  │Guardamotor 6.3-10A│Eaton │ 📄│$62.40 │ 14 en  │[ 2 ]│
│ Marca         ││▣ PKZM0-16  │Guardamotor 10-16A │Eaton │ 📄│$64.10 │ 3 en   │[   ]│
│ ☐ ABB  ☐ Eaton││▣ 1SAM25000…│Guardamotor MS132  │ABB   │ 📄│$71.00 │Sobre   │[ 1 ]│
│ Disponibilidad││            │                   │      │   │       │pedido  │     │
│ ☐ En existencia│ …                                                       │     │
│ Precio        │└────────────┴───────────────────┴──────┴───┴───────┴────────┴─────┘
│ [$ min][$ max]│                  ‹ 1 2 3 … 9 ›                               │
├───────────────┴──────────────────────────────────────────────────────────────┤
│ ▓ 2 partidas · $195.80 USD                     [Limpiar] [Agregar al carrito]▓│ ← sticky
└──────────────────────────────────────────────────────────────────────────────┘
```

```
Mobile (375 px)
┌───────────────────────────────┐
│ ☰ CENTINELA        👤  🛒 (3)  │
│ [🔍 Número de parte…        ]  │
├───────────────────────────────┤
│ Control de Motores · 412      │
│ [ABB Contact.][Eaton Guard.]→ │  ← horizontal scroll
│ [Filtros (1)]  [Ordenar ▾]    │
├───────────────────────────────┤
│ PKZM0-10            $62.40    │
│ Guardamotor 6.3-10A, Eaton    │
│ 14 en existencia · 📄 Ficha   │
│                  [ − ][2][ + ]│
├───────────────────────────────┤
│ PKZM0-16            $64.10    │
│ Guardamotor 10-16A, Eaton     │
│ 3 en existencia · 📄 Ficha    │
│                  [ − ][ ][ + ]│
├───────────────────────────────┤
│ …                             │
├───────────────────────────────┤
│▓ 1 partida · $124.80 [Agregar]▓│ ← sticky
└───────────────────────────────┘
```

### 4.4 Product page

**Layout:**
- **Two columns.** Left: image (most products have one small image). Right: the buy box:
  - Part number as the H1, in large monospace, with a copy button. The title goes underneath.
  - Brand
  - Price in USD, with the tax label ("+ IVA" if prices exclude it; idsupply shows "Pesos Mexicanos (MN) + IVA")
  - Existencia: "14 en existencia", or "Sobre pedido" when stock is 0
  - qty stepper and [Agregar al carrito]
  - a prominent **[📄 Ficha técnica (PDF)]** button
  - a secondary **[Solicitar cotización]** link, which opens WhatsApp or the contact form with the part number and quantity filled in. idsupply has a quote form on every product page, and Newark has "Solicitar una cotización".
  - trust lines: the shipping note, "Facturamos (CFDI)" (idsupply: "Facturación el mismo día"), and payment methods
- **Below, tabs:**
  - Descripción (the rich-text description)
  - Especificaciones (an HTML spec table, if structured specs ever exist, as NN/g recommends; until then this tab is hidden)
  - Descargas (datasheet and any other PDFs)
- **Then two short tables** (no carousels):
  - "Productos relacionados" (same subcategory)
  - "Accesorios" (Storefront API recommendations, per `site-audit.md` §6)
- **Breadcrumb:** Categoría › Subcategoría.

**Changes from today:**
- `ProductDetails.tsx` shows the title as H1, the vendor, a quantity stepper and the description.
- New:
  - part number as H1
  - stock count
  - datasheet button (the `custom.datasheet` metafield, already read by collection rows)
  - Tabs
  - related products as a table
  - subcategory breadcrumb
- Drop the variant picker UI (one variant per product).

**StackZero starting point:** "Product Page – 01" (`npx shadcn add product-01-page`) has a similar two-column buy box with stock, qty and add to cart. It's mostly B2C parts we'd remove: color variants, "Buy Now", rating breakdowns. **Recommendation:** use it as a layout reference only, and build on `ProductDetails.tsx`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Inicio › Control de Motores › Eaton Guardamotores y Accesorios               │
├──────────────────────────────┬───────────────────────────────────────────────┤
│                              │ PKZM0-10                              [⧉ copiar]│
│        [ product image ]     │ Guardamotor 6.3–10 A, 3 polos                 │
│                              │ Marca: Eaton                                  │
│                              │ $62.40 USD + IVA                              │
│                              │ ● 14 en existencia                            │
│                              │ Cantidad [ − ][ 1 ][ + ]  [ Agregar al carrito ]│
│                              │ [📄 Ficha técnica (PDF)]  Solicitar cotización │
│                              │ Envío gratis > $300 USD en BC, BCS y Sonora   │
│                              │ Facturamos (CFDI) · Shop Pay · PayPal · Tarjeta│
├──────────────────────────────┴───────────────────────────────────────────────┤
│ [Descripción] [Especificaciones] [Descargas]                                 │
│ Rich-text description …                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Productos relacionados                                                       │
│ Nº de parte │ Descripción          │ Precio │ Existencia │ Cant. │           │
│ PKZM0-16    │ Guardamotor 10-16A   │ $64.10 │ 3          │ [  ]  │           │
│ …                                          [Agregar seleccionados al carrito]│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Search

- **Predictive search:**
  - Keep `PredictiveSearchModal`, but anchor it under the visible header field as a dropdown (Command), not a centered modal.
  - Each result shows the part number in bold monospace, then the description, price and stock.
  - Make sure matching works on part number / SKU (`site-audit.md` §5.5).
- **Exact match:** when the query exactly matches a handle or SKU, pin that product at the top of the results as "Coincidencia exacta" with its own qty box. **Recommendation:** pin it rather than auto-redirect, so a typo doesn't silently land on the wrong part.
- **Results page:** use the same ordering table and sticky bar as the category page, with a Categoría facet added. **Changes from today:** search results currently use the `ProductCard` grid (see the comment in `CollectionBrowser.tsx`).
- **Brand pages:** the header "Marcas" link and the home brand strip open the results table filtered by vendor. That's idsupply's main navigation (`?rb_vendor=`), but with Spanish facet labels and an accurate count.
- **StackZero starting point:** none.

### 4.6 Quick Order (`/pages/quick-order`, plus `/en/pages/quick-order`)

**Layout:**
- the instruction line from the live site
- **10 rows** of [Número de parte (autocomplete, Command)] [Cantidad]. Each row resolves on the right to the description, unit price, stock and line total, or shows an inline error ("No encontrado", "Solo 3 en existencia").
- "+ Agregar 10 renglones"
- a **"Pegar lista"** tab with a textarea for `PARTE, CANTIDAD` or tab-separated lines (pasted from Excel). This mirrors AutomationDirect's CSV Upload and Digi-Key's "Upload a List".
- a sticky footer showing the total, and [Agregar todo al carrito] as one `updateCart` call, the same as `ProductTable`
- the Shopify quick order list's live subtotal and per-row stock errors are the pattern to copy

**Also:** a one-row "Agregar por número de parte" form at the top of `/cart` (AutomationDirect and Digi-Key both put this on the cart page).

**Also:** a "Solicitar cotización de esta lista" button next to "Agregar todo al carrito". It sends the resolved rows by WhatsApp or the contact form for buyers who need a formal quote before a purchase order. Newark México links "Pedido rápido" and "Cotizaciones" side by side.

**StackZero starting point:** none, apart from Quantity Input for the qty cells.

**Changes from today:** the page doesn't exist yet (❌ in `site-audit.md` §4).

### 4.7 Cart drawer

- Keep `CartDrawer` (native `<dialog>`).
- **Header:** a free-shipping progress bar, "Te faltan $87.50 USD para envío gratis (BC, BCS y parte de Sonora)". The zone limit has to be stated because the threshold doesn't apply everywhere.
- **Lines:** compact rows of part number (bold, monospace), short description, qty stepper, line total and remove. Thumbnails stay small.
- **Footer:** subtotal, "Impuestos y envío calculados al pagar", [Finalizar compra], "Ver carrito".
- The header cart button shows the count and the total.

**Also:** a "Solicitar cotización de este carrito" link under the checkout button, using the same WhatsApp/contact handoff as the product page.

**StackZero starting point:** "Cart – 01" (`npx shadcn add cart-01-block`) is a full cart page with a summary that includes "VAT (20%)". It's not a drawer, and it isn't wired to Hydrogen. **Recommendation:** keep `CartDrawer` and `CartContent`, and use the block at most as a visual reference for the `/cart` page.

**Changes from today:** add the progress bar, show part numbers in the lines, and show the total in the trigger. `CartLineItem` and `CartContent` exist.

### 4.8 Footer

Four columns, all in Spanish (the live site mixes in "Terms of Service" and "Refund policy"):

1. **Eléctrica Centinela:** address, phone, WhatsApp, hours, map link
2. **Comprar:** Categorías, Orden rápida, Marcas, Búsqueda
3. **Ayuda:** Contacto, Envíos, Devoluciones, Términos y condiciones, Aviso de privacidad
4. **Cuenta:** Iniciar sesión, Pedidos

Below them: payment badges (Shop Pay, PayPal, cards), the language switch, and the legal name "Eléctrica Centinela, S. de R.L. de C.V.".

Add a "Facturación" link in Ayuda that explains how to request a CFDI. Syscom shows SAT codes, and idsupply promises same-day invoicing, so business buyers will look for this.

**StackZero starting point:** none.

**Changes from today:** `Footer.tsx` has a quick-links list, search and account. Pages and policies need their routes (`site-audit.md` §4).

### 4.9 Visual direction

The business has confirmed we can reuse the live site's brand material. Everything below was read from https://e-centinela.com/ on 2026-11-06: the rendered page, its stylesheets `…/cdn/shop/t/17/assets/style.scss.css` and `styles.min.css`, and `font.css`. Only URLs are recorded; nothing was downloaded into the repo.

**Logo files** (all under `https://e-centinela.com/cdn/shop/t/17/assets/`; the Shopify CDN adds a `?v=` cache parameter):

| File | Format and size | Use on the live site |
|---|---|---|
| `logo-centinela.svg` | SVG, viewBox 612.85 × 111.45, rendered at 300 × 55. Single fill `#fff` (**white only**) | Header logo on the navy band. Alt text says "Controls Online", the store's old name |
| `icon-logo.png` | PNG 246 × 45, **full color**: a teal-green and dark-slate mark with dark-slate "ELÉCTRICA CENTINELA" text (sampled pixels are roughly `#109060` green and `#303040` slate) | Footer, on a light background |
| `favico.ico` | ICO, 737 bytes | Favicon and apple-touch-icon (the same `.ico` is used for both) |

There's no full-color SVG and no hi-res color logo on the site, only the 246 px PNG.

**Brand colors** (exact values from the theme CSS):

| Token (proposed) | Value | Where the live theme uses it |
|---|---|---|
| `--color-primary` (navy) | `#35368f`, with a gradient from `#242468` | Header search band (`.search-bar-content`: `linear-gradient(#242468, #35368f)`), the 8 px footer top border, the brand-strip divider, the blue modal button |
| `--color-link` / part number | `#34358e` | `.home-section .title`, `.matching-products .part-number`, category tile hover |
| `--color-secondary` (green) | gradient from `#27963e` to `#33c652` | Top announcement and navigation bar (`.navigation`), the "CATEGORÍAS" sidebar title |
| `--color-accent` (lime) | `#84c347` | Search button, Quick Order submit, contact form submit |
| Price / cart total | `#cc0000` | `.money`, `.discounted_price`, cart total |
| Text | `#333333` body, `#666666` secondary, `#595959` page copy | Body, category items, footer |
| Surfaces | `#f1f1f1` category items, `#f7f7f7` form and price panels, `#f5f5f5` footer | |

**Fonts:**
- Headings and UI use the custom **Verb** family, declared in `font.css`: VerbRegular, VerbMedium, VerbSemibold, VerbSemibold-Italic, VerbRegular-Bold and VerbExtrabold, in `.otf`, `.woff` and `.ttf` files.
- Body text uses `"Helvetica Neue", Helvetica, Arial, sans-serif` at 14 px.
- The site doesn't say which license covers the Verb files, so check before reusing them (§5).

**Brand-strip images** (same base URL, `…/t/17/assets/`), in the live order:
- `icon-bussmann.png` (200×108)
- `icon-eaton.png` (1000×371)
- `icon-abb.png` (1000×403)
- `icon-finder.png` (723×187)
- `icon-legrand.jpg` (723×188)
- `icon-viedmuller.png` (723×96, Weidmüller; the alt text reads "VIEDMULLLER")
- `icon-siemens.png` (723×114)
- `icon-timemark.png` (355×105)
- `icon-bernstein.png` (652×184)
- `icon-moeller.png` (1592×531)
- `icon-micron.png` (315×185)
- `icon-fluke.png` (1557×509)
- `icon-eldon.png` (225×225)
- `icon-sge.jpg` (1368×460)
- `icon-auer.png` (1124×482)
- `icon-amprobe.png` (936×169)
- `icon-xcpc.png` (936×169, China Pneumatic)

**Live header layout, for reference:**
- green top bar with "ENVÍO GRATUITO EN ÓRDENES MAYORES A $300 USD" in white italic capitals, plus ORDEN RÁPIDA · CONTACTO · CATÁLOGO
- navy band with the white logo, the search box "Número de Parte / Palabra Clave" with a lime button, the cart "(0) Artículos" with the total in red, and Iniciar Sesión
- below that, a green "CATEGORÍAS" sidebar title over grey category rows

**Proposed direction (recommendation):**
- **Color:**
  - Replace the template green `#1b4332` with navy `#35368f` as `--color-primary`, so buttons, links and focus states pick it up through the existing `color-mix` tokens.
  - Add the green gradient as `--color-secondary`, used for the announcement bar and the mega-menu "Categorías" trigger.
  - Add `#84c347` as `--color-accent` for the search button and the primary "Agregar al carrito".
  - Check contrast: white text on `#84c347` is low contrast, so use dark text `#242468` on lime, or keep the lime for icons and borders only.
  - Keep red `#cc0000` for prices only if the business wants it. Red usually reads as "sale", so navy prices may be clearer.
- **Logo:**
  - Header: `logo-centinela.svg` on the navy band. It's already white, so no extra variant is needed.
  - Footer and light surfaces: `icon-logo.png` until a color SVG exists.
  - Fix the alt text to "Eléctrica Centinela", and replace `shopName = "CORE"` in `Header.tsx`.
- **Typography:**
  - If the Verb license allows web use, self-host VerbSemibold and VerbRegular-Bold for headings and UI with `next/font/local`, and keep a system sans for body text.
  - Otherwise, use a close system or Google substitute.
  - Use `tabular-nums` (or a monospace face) for part numbers and prices so columns line up.
- **Density:** rows about 44 px tall (`--spacing-touch-target`), body text 14 px in tables, matching the live 14 px base.
- **Status colors:** existing `--color-success` / `--color-warning` for stock badges.
- **No carousels or quick views anywhere** (Baymard, quick views).

## 5. Open questions for the user

1. **Per-row quantity on every listing (live-site style)**, or the more common distributor pattern of a single add per row plus Quick Order? (Recommendation: keep per-row qty.)
2. **Subcategory naming:** show tags as they are ("Eaton Contactores Rango 3-10HP"), or clean them into brand + line ("Contactores 3-10 HP" under an "Eaton" heading)? The tags also contain typos and duplicates ("Interrupores", "Accesoros", double spaces). Do we fix them at the source in Shopify?
3. **Brand refresh:** the live site's logo, colors and brand-strip images are approved for reuse and recorded in §4.9. Still open:
   - Keep the current logo, or refresh it? If kept, is there a full-color vector (SVG/AI) original? The site only has a white SVG and a 246 px color PNG.
   - Is there a web license for the Verb font family, or should we substitute?
   - Keep red prices (`#cc0000`) or move to navy?
   - Use the green gradients as-is, or flatten them to solid colors?
4. **Rows per page:** the live site uses 20. Is 50 OK as the default?
5. **Stock display:** show the exact count ("14 en existencia") as the live site does, or bands ("En existencia" / "Pocas piezas" / "Sobre pedido")? The exact count needs the inventory scope on the token (`site-audit.md` §11). Also: show the Mexicali store and the "Border Electronics warehouse" separately (Syscom filters by branch), or as one number?
6. **Catalog PDF:** drop the 2017 PDF link, or is there a current catalog?
7. **Brand strip links:** go to our own brand-filtered results (recommended) or to the manufacturers' sites as today?
8. **WhatsApp:** a floating button, a header link, or both?
9. **shadcn primitives:** Base UI (the current shadcn default) or Radix? **Recommendation:** Radix, if we want any StackZero components, because its repo is built on `@radix-ui/*`. Base UI otherwise.
10. **Productos Retirados:** keep it in the menu (dimmed, last) or hide it and reach those products only through search?
11. **IVA:** do the USD prices include IVA? Label them "+ IVA" or "IVA incluido" everywhere a price appears. idsupply and Syscom both state it.
12. **Factura (CFDI):** how do customers request an invoice today, at checkout or afterwards by email or WhatsApp? Should we promise a turnaround, as idsupply's "Facturación el mismo día" does? This decides the "Facturamos" copy and whether checkout needs an RFC field.
13. **Quotes:** add "Solicitar cotización" on product, Quick Order and cart pages? Should it go to WhatsApp, email, or a form?
14. **Currency:** stay USD-only (like Newark and Digi-Key México), or also show MXN (like idsupply)? This is the same question as `site-audit.md` §7.4; the Mexican sites split on it.
15. **Payment methods:** add Mercado Pago or bank transfer (offered by idsupply) next to Shop Pay and PayPal?

## 6. Sources

**Repo files read:** `docs/site-audit.md`, `app/globals.css`, `components/Header.tsx`, `components/ProductTable.tsx`, `components/CollectionBrowser.tsx`, `components/ProductDetails.tsx`, `components/Footer.tsx`, `components/MobileNavDialog.tsx`, `app/[lang]/page.tsx`, `app/[lang]/layout.tsx`, `app/[lang]/collections/page.tsx`, `lib/categories.json`, `lib/categories.ts`, `lib/dictionaries/es.ts`, `package.json`, `tsconfig.json`.

**Distributors** (fetched, or opened in a browser):
- **AutomationDirect**
  - https://www.automationdirect.com/adc/home/home
  - https://www.automationdirect.com/adc/shopping/catalog/motor_controls
  - https://www.automationdirect.com/adc/shopping/catalog/motor_controls/iec_magnetic_contactors
  - https://www.automationdirect.com/adc/shopping/catalog/motor_controls/iec_magnetic_contactors/iec_contactors
  - https://www.automationdirect.com/adc/shopping/catalog/relays_-z-_timers/timer_relays/t30r-nd-30-24ad
  - https://www.automationdirect.com/adc/cart/cart?openQuickOrder=true
- **Digi-Key**
  - https://www.digikey.com/
  - https://www.digikey.com/en/products/filter/fuses/139
  - https://www.digikey.com/en/products/detail/vishay/MFU0603FF01000P500/1202604
  - https://www.digikey.com/ordering/shoppingcart
  - https://www.digikey.com/en/mylists/ (shell only)
  - https://www.digikey.com.mx/
  - https://www.digikey.com.mx/es/products/filter/fusibles/139
- **McMaster-Carr**
  - https://www.mcmaster.com/
  - https://www.mcmaster.com/fuses/
  - https://www.mcmaster.com/products/fuses/
  - https://www.mcmaster.com/products/fuses/fuse-type~cartridge/
  - https://www.mcmaster.com/products/fuses/ul-class-j-time-delay-fuses-for-tight-spaces~~/
- **RS**
  - https://uk.rs-online.com/web/
  - https://www.rs-online.com/
  - https://es.rs-online.com/web/
  - Blocked (403): https://mx.rs-online.com/, and the uk.rs-online.com category, listing and product pages
- **Cyberpuerta**
  - https://www.cyberpuerta.mx/
  - https://www.cyberpuerta.mx/Energia/Control-Industrial/Contactores/
  - https://www.cyberpuerta.mx/Energia/Control-Industrial/Contactores/ABB-Contactor-1SBL237001R1300-3-Polos-250V-25A.html
- **idsupply** (browser)
  - https://idsupply.com.mx/
  - https://idsupply.com.mx/pages/search-results-page?page=2&rb_vendor=Allen%20Bradley
  - https://idsupply.com.mx/products/allen-bradley-1747-l551
  - https://idsupply.com.mx/cart
  - https://idsupply.com.mx/collections
- **Newark México** (browser)
  - https://mexico.newark.com/
  - https://mexico.newark.com/c/proteccion-de-circuitos/fusibles-accesorios-para-fusible
  - https://mexico.newark.com/c/proteccion-de-circuitos/fusibles-accesorios-para-fusible/fusibles
  - https://mexico.newark.com/c/proteccion-de-circuitos/fusibles-accesorios-para-fusible/fusibles/fusibles-de-potencia-electrica-e-industrial
  - https://mexico.newark.com/eaton-bussmann/lpj-30sp/fuse-30a-600v-time-delay/dp/02B4585
- **Syscom** (browser)
  - https://www.syscom.mx/products?query=SIEMENS&refinement%5Bmarca%5D=SIEMENS
  - https://www.syscom.mx/products/245540
- **Blocked or failed:**
  - https://tienda.logicbus.com.mx/Allen-Bradley_c_5638.html (Cloudflare block, also in a browser)
  - https://www.grainger.com/ and https://www.grainger.com/category/electrical/fuses (error page / 403, also in a browser)
  - https://www.grainger.com.mx/ (403)
  - https://www.mouser.com/ and https://www.mouser.mx/c/circuit-protection/fuses/ (bot wall, also in a browser)
  - https://www.galco.com/ (403)
  - https://www.zoro.com/ (403)
  - https://www.alliedelec.com/, which redirects to https://us.rs-online.com/ (403)
  - https://mexico.newark.com/ and https://www.syscom.mx/categories/66463 (timeout and 403 with WebFetch; both loaded in a browser, see above)
  - https://www.tecnosinergia.com/ (empty)

**Live e-centinela brand assets** (browser, page source and theme CSS):
- https://e-centinela.com/
- https://e-centinela.com/cdn/shop/t/17/assets/style.scss.css
- https://e-centinela.com/cdn/shop/t/17/assets/styles.min.css
- https://e-centinela.com/cdn/shop/t/17/assets/font.css
- https://e-centinela.com/cdn/shop/t/17/assets/logo-centinela.svg
- https://e-centinela.com/cdn/shop/t/17/assets/icon-logo.png
- https://e-centinela.com/cdn/shop/t/17/assets/favico.ico
- The brand-strip files are listed in §4.9.

**Templates and tools:**
- **shadcn/ui**
  - https://ui.shadcn.com/docs/installation/next
  - https://ui.shadcn.com/docs/installation/manual
  - https://ui.shadcn.com/docs/tailwind-v4
  - https://ui.shadcn.com/docs/components-json
  - https://ui.shadcn.com/docs/components
  - https://ui.shadcn.com/docs/components/base/data-table
  - https://ui.shadcn.com/blocks
  - https://ui.shadcn.com/blocks/sidebar
  - https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
  - https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md
- **Vercel**
  - https://github.com/vercel/commerce
  - https://raw.githubusercontent.com/vercel/commerce/main/README.md
  - https://raw.githubusercontent.com/vercel/commerce/main/package.json
  - https://github.com/vercel/shop
  - https://vercel.com/templates/ecommerce
- **Shopify**
  - https://github.com/Shopify/hydrogen
  - https://github.com/Shopify/dawn
  - https://raw.githubusercontent.com/Shopify/dawn/main/LICENSE.md
  - https://help.shopify.com/en/manual/b2b/store-customization/quick-order-list
  - https://shopify.dev/docs/storefronts/themes/pricing-payments/b2b
- **StackZero commerce-ui** (browser and fetch)
  - https://ui.stackzero.co/
  - https://ui.stackzero.co/docs/installation
  - https://ui.stackzero.co/docs/cli
  - https://ui.stackzero.co/docs/templates/xeon
  - https://ui.stackzero.co/docs/pages/products
  - https://ui.stackzero.co/docs/blocks/carts
  - https://github.com/stackzero-labs/ui
  - https://raw.githubusercontent.com/stackzero-labs/ui/main/package.json

**Usability research:**
- **Baymard**
  - https://baymard.com/blog/use-product-tables-for-desktop-product-listings
  - https://baymard.com/blog/b2b-electronic-components-machinery-launch
  - https://baymard.com/research-articles/allow-search-for-long-filter-options-lists
  - https://baymard.com/blog/ecommerce-quick-views
- **Nielsen Norman Group**
  - https://www.nngroup.com/articles/data-tables/
  - https://www.nngroup.com/articles/b2b-specs/
  - https://www.nngroup.com/articles/b2b-usability/
  - https://www.nngroup.com/articles/mega-menus-work-well/
  - https://www.nngroup.com/articles/filters-vs-facets/
