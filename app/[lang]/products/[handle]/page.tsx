import { getSelectedProductOptions, type StorefrontApi } from "@shopify/hydrogen";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetails } from "@/components/ProductDetails";
import { ProductReel } from "@/components/ProductReel";
import { QuickAddButton } from "@/components/QuickAddButton";
import { getContent } from "@/lib/content";
import { localeAlternates, localizePath, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { galleryImages } from "@/lib/product-gallery";
import { PRODUCT_QUERY, RELATED_PRODUCTS_QUERY, type ProductData } from "@/lib/product-query";
import { canonicalUrl, jsonLdScript } from "@/lib/site";
import { hasInventoryAccess } from "@/lib/storefront-config";
import { getStaticStorefrontClient } from "@/lib/storefront-static";
import { toURLSearchParams } from "@/lib/url-params";

type Props = PageProps<"/[lang]/products/[handle]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { handle } = await params;
  // Re-fetch the product for metadata. It hits the same `use cache` cache-point
  // as the page render, so this is a cache hit in practice.
  const { product } = await fetchProduct(locale, handle, "");
  const title = product?.title ?? getContent(locale).product.fallbackTitle;
  return {
    title,
    description: product?.description ?? "",
    // Variant params do NOT change the canonical (F10).
    alternates: localeAlternates(locale, `/products/${handle}`),
    openGraph: {
      title,
      description: product?.description ?? "",
      url: canonicalUrl(localizePath(locale, `/products/${handle}`)),
    },
    twitter: { card: "summary_large_image" },
  };
}

async function fetchProduct(
  locale: Locale,
  handle: string,
  searchString: string,
): Promise<{ product: ProductData | null }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  // Read variant selection from URL option params (F4: a no-JS GET to
  // `?Size=Large&Color=Green` resolves the variant server-side). If passed,
  // `allowedOptionNames: []` intentionally filters out every option.
  // Reconstruct URLSearchParams from the serialized search string — `use cache`
  // serializes arguments, so a URLSearchParams passed in loses `.get`.
  const selectedOptions = getSelectedProductOptions({
    searchParams: new URLSearchParams(searchString),
  });

  const { data, errors } = await getStaticStorefrontClient(locale).graphql(PRODUCT_QUERY, {
    variables: { handle, selectedOptions, withInventory: hasInventoryAccess() },
  });

  if (errors) {
    console.error("[hydrogen] Product query failed", errors);
  }

  return { product: data?.product ?? null };
}

/**
 * JSON-LD `Product` for the server-resolved variant. Built on the server because
 * `canonicalUrl` reads `SITE_ORIGIN`, which the browser bundle does not have, so
 * a client render hydrates with a different `offers.url` than the server sent.
 */
function productJsonLd(locale: Locale, product: ProductData) {
  const variant = product.selectedOrFirstAvailableVariant;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: galleryImages(product, variant?.image ?? null).map((image) => image.url),
    offers: variant
      ? {
          "@type": "Offer",
          price: variant.price.amount,
          priceCurrency: variant.price.currencyCode,
          availability: variant.availableForSale
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: canonicalUrl(localizePath(locale, `/products/${product.handle}`)),
        }
      : {
          "@type": "AggregateOffer",
          priceCurrency: product.priceRange.minVariantPrice.currencyCode,
          lowPrice: product.priceRange.minVariantPrice.amount,
          highPrice: product.priceRange.maxVariantPrice.amount,
        },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  const { handle } = await params;
  const urlSearch = toURLSearchParams(await searchParams);
  const { product } = await fetchProduct(locale, handle, urlSearch.toString());

  // 404 only when the query has no GraphQL errors and the product is missing
  // (F8: errors are logged above; don't blanket-404 on a Storefront auth error).
  if (!product) {
    notFound();
  }

  const firstCollection = product.collections.nodes[0];
  const breadcrumbItems: Crumb[] = [
    { label: content.collections.title, href: "/collections" },
    ...(firstCollection
      ? [{ label: firstCollection.title, href: `/collections/${firstCollection.handle}` }]
      : []),
    { label: product.title },
  ];

  return (
    <>
      <div className="max-w-page px-margin mx-auto w-full pt-8">
        <Breadcrumbs locale={locale} items={breadcrumbItems} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(locale, product)) }}
      />
      <ProductDetails product={product} />
      {/* Best-effort related products (F14): a separate async server child in a
          <Suspense> boundary that degrades silently — never blocks the PDP. */}
      <Suspense fallback={null}>
        <RelatedProducts locale={locale} handle={handle} />
      </Suspense>
    </>
  );
}

/**
 * Related products (`notes/product.md` "you may also like"). Best-effort: any
 * error/timeout returns an empty list so the PDP never breaks. Fetched via the
 * shared `staticStorefrontClient` inside a `use cache` cache-point.
 */
async function RelatedProducts({ locale, handle }: { locale: Locale; handle: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  type RelatedProduct = NonNullable<
    StorefrontApi.ResultOf<typeof RELATED_PRODUCTS_QUERY>["product"]
  >["relatedProducts"]["nodes"][number]["products"]["nodes"][number];
  let related: RelatedProduct[] = [];
  try {
    const { data, errors } = await getStaticStorefrontClient(locale).graphql(RELATED_PRODUCTS_QUERY, {
      variables: { handle },
    });
    if (errors) {
      console.error("[hydrogen] Related products query failed", errors);
    }
    if (data?.product?.relatedProducts) {
      // In-stock products first, then the rest of the collection (deduped).
      const all = data.product.relatedProducts.nodes.flatMap((node) => [
        ...node.inStock.nodes,
        ...node.products.nodes,
      ]);
      const seen = new Set([handle]);
      related = all
        .filter((p) => !seen.has(p.handle) && Boolean(seen.add(p.handle)))
        .slice(0, 14);
    }
  } catch (error) {
    // Related products are an enhancement; never break the PDP.
    console.error("[hydrogen] Related products failed", error);
  }

  if (related.length === 0) return null;

  const content = getContent(locale);
  return (
    <section className="max-w-page px-margin mx-auto mt-16 w-full">
      <ProductReel
        title={content.product.relatedProducts}
        previousLabel={content.product.relatedPrevious}
        nextLabel={content.product.relatedNext}
      >
        {related.map((relatedProduct) => (
          <li key={relatedProduct.id} className="flex flex-col gap-3">
            <ProductCard product={relatedProduct} locale={locale} loading="lazy" />
            <div className="mt-auto">
              <QuickAddButton
                product={relatedProduct}
                variant={relatedProduct.selectedOrFirstAvailableVariant ?? null}
              />
            </div>
          </li>
        ))}
      </ProductReel>
    </section>
  );
}
