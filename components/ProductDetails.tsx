"use client";

import {
  buildProductSelectionSearchParams,
  canAddToCart,
  type SelectedOption,
} from "@shopify/hydrogen";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

import { datasheetHref } from "@/components/ProductTable";
import { ProductViewedTracker } from "@/components/ProductViewedTracker";
import { QuantityStepper } from "@/components/QuantityStepper";
import { openCartDrawer } from "@/lib/cart-drawer";
import { shopifyImageUrl, srcSetFor } from "@/lib/image";
import { interpolate } from "@/lib/content";
import { isPriceOnRequest } from "@/lib/money";
import { ProductProvider, useProductForm } from "@/lib/product";
import { galleryImages } from "@/lib/product-gallery";
import type { ProductData } from "@/lib/product-query";

import { useI18n } from "./I18nProvider";
import { ConvertedPriceNote, Price } from "./CurrencyProvider";
import { DatasheetIcon } from "./DatasheetIcon";

// Next.js keys the `[handle]` segment by its value, so a combined-listing switch
// unmounts this whole component and the focused link with it. Module state
// outlives that remount where a ref or state inside the page would not. The
// cross-product link records the value it activated, and that value, now a
// same-product link on the new product page, takes focus as it mounts.
let pendingFocus: { handle: string; optionName: string; value: string } | null = null;

function focusIfPending(
  node: HTMLAnchorElement | null,
  handle: string,
  optionName: string,
  value: string,
) {
  if (
    !node ||
    pendingFocus?.handle !== handle ||
    pendingFocus.optionName !== optionName ||
    pendingFocus.value !== value
  ) {
    return;
  }
  pendingFocus = null;
  node.focus();
}

/**
 * Interactive product details (`hydrogen-variant-form` /
 * `references/nextjs.md`). Wraps the server-fetched product in `ProductProvider`;
 * variant selection + add-to-cart live here (client). Same-product option values
 * are GET `<Link>`s with `aria-current` (no-JS degrades to server variant
 * resolution); cross-product values navigate to the other product; non-existent
 * combinations are disabled `<button>`s with `aria-pressed`.
 */
export function ProductDetails({ product }: { product: ProductData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { href } = useI18n();

  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const targetHandle = result.selectedVariant?.product?.handle ?? product.handle;
        const next = variantUrl(product, result.selectedOptions, targetHandle, searchParams);
        router.replace(href(next), { scroll: false });
      }}
    >
      <ProductViewedTracker product={product} />
      <ProductPage product={product} />
    </ProductProvider>
  );
}

function ProductPage({ product }: { product: ProductData }) {
  const { options, selectedVariant, formProps, register, errors } = useProductForm();
  const searchParams = useSearchParams();
  const { content, href } = useI18n();
  const addable = canAddToCart(product, options);
  const addToCartProps = register("addToCart", {});
  const firstOptionRef = useRef<HTMLFieldSetElement>(null);
  // Hide the variant picker when there are no real options to choose (e.g. a
  // single-variant product whose only option is "Title" / "Default Title").
  const hasRealOptions = options.some((option) => option.values.length > 1);

  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = selectedVariant?.compareAtPrice ?? null;
  const onSale = compareAt && Number(compareAt.amount) > Number(price.amount);

  const images = galleryImages(product, selectedVariant?.image ?? null);
  const partNumber = (selectedVariant?.sku || product.handle).toUpperCase();
  const soldOut = Boolean(selectedVariant && !selectedVariant.availableForSale);
  // Sold out or a placeholder price: offer a call instead of add-to-cart.
  const callOnly = soldOut || isPriceOnRequest(price);
  const datasheetUrl = datasheetHref(product.datasheet);

  return (
    <div className="max-w-page px-margin mx-auto w-full py-8">
      <div className="product-grid mb-16 grid grid-cols-1 gap-6 md:gap-12">
        {/* Gallery */}
        <div className="grid grid-cols-2 gap-2 self-start">
          {images.map((image, index) => (
            <div
              key={image.url}
              className={`border-border aspect-square overflow-hidden rounded-lg border bg-white p-4 ${index === 0 ? "col-span-2" : ""}`}
            >
              <img
                src={shopifyImageUrl(image.url, { width: index === 0 ? 800 : 400 })}
                srcSet={srcSetFor(image.url, { width: index === 0 ? 800 : 400 })}
                alt={image.altText ?? product.title}
                width={index === 0 ? 800 : 400}
                height={index === 0 ? 800 : 400}
                className="h-full w-full object-contain"
                loading={index === 0 ? "eager" : "lazy"}
                {...(index === 0 ? { fetchPriority: "high" } : {})}
              />
            </div>
          ))}
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-4 md:sticky md:top-8 md:self-start">
          <h1 className="text-primary-dark font-mono text-3xl font-semibold break-all md:text-4xl">
            {partNumber}
          </h1>
          <p className="text-xl leading-snug">{product.title}</p>
          {product.vendor ? (
            <p className="text-on-surface-secondary">
              {content.product.brand}: <strong className="text-on-surface">{product.vendor}</strong>
            </p>
          ) : null}

          <div className="border-border flex flex-col gap-1 border-y py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-price text-3xl font-bold tabular-nums">
                <Price money={price} />
              </span>
              {onSale && compareAt ? (
                <s className="text-compare text-base"><Price money={compareAt} /></s>
              ) : null}
              {isPriceOnRequest(price) ? null : (
                <span className="text-on-surface-secondary">{content.product.taxIncluded}</span>
              )}
            </div>
            <ConvertedPriceNote className="text-on-surface-secondary text-sm" />
            <p className="text-on-surface-secondary text-sm">{content.product.invoice}</p>
            {selectedVariant ? (
              <span
                className={`mt-2 inline-flex self-start rounded-full px-3 py-1 text-sm font-semibold ${
                  !callOnly
                    ? "bg-stock text-on-stock"
                    : "text-on-surface-secondary bg-muted"
                }`}
              >
                {stockLabel({ soldOut, callOnly, quantity: selectedVariant.quantityAvailable, content })}
              </span>
            ) : null}
          </div>

          {/* Variant options — hidden when the product has no real options
              (e.g. a single-variant product). */}
          {hasRealOptions ? (
            <div className="flex flex-col gap-4">
              {options.map((option) => (
                <fieldset
                  key={option.name}
                  className="flex flex-col gap-2"
                  ref={option === options[0] ? firstOptionRef : undefined}
                  tabIndex={option === options[0] ? -1 : undefined}
                >
                  <legend className="type-body-sm text-on-surface font-medium">
                    {option.name}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) =>
                      value.handle && value.handle !== product.handle ? (
                        // Cross-product value — navigates to the other product
                        // (hydrogen-variant-form combined-listings rule). Uses the
                        // live `useSearchParams` base so unrelated params survive.
                        // `onNavigate` fires only for a plain client-side click, so
                        // a Cmd-click that opens a new tab records nothing.
                        <Link
                          key={value.name}
                          href={href(
                            variantUrl(product, value.selectedOptions, value.handle, searchParams),
                          )}
                          scroll={false}
                          onNavigate={() => {
                            pendingFocus = {
                              handle: value.handle,
                              optionName: option.name,
                              value: value.name,
                            };
                          }}
                          data-available={value.available ? "true" : "false"}
                          className="option-pill no-underline"
                        >
                          {value.name}
                          {!value.available ? (
                            <span className="sr-only"> ({content.product.badge.soldOut})</span>
                          ) : null}
                        </Link>
                      ) : value.exists ? (
                        // Same-product value — a real GET `<Link>` so selection
                        // works without JS. `onNavigate` fires only for a plain
                        // client-side click; next/link hands modified clicks to
                        // the browser first. The provider's `onSelect` already
                        // calls `router.replace`, so the link's own navigation is
                        // cancelled to avoid a second RSC fetch. `aria-current`
                        // marks the selected link (`aria-pressed` is invalid on a link).
                        <Link
                          key={value.name}
                          href={href(
                            variantUrl(product, value.selectedOptions, value.handle, searchParams),
                          )}
                          scroll={false}
                          ref={(node) =>
                            focusIfPending(node, product.handle, option.name, value.name)
                          }
                          aria-current={value.selected ? "true" : undefined}
                          data-available={value.available ? "true" : "false"}
                          className="option-pill no-underline"
                          onNavigate={(event) => {
                            register("optionValue", {
                              optionName: option.name,
                              value: value.name,
                            }).onClick();
                            event.preventDefault();
                          }}
                        >
                          {value.name}
                          {!value.available ? (
                            <span className="sr-only"> ({content.product.badge.soldOut})</span>
                          ) : null}
                        </Link>
                      ) : (
                        // Non-existent combination — no valid option URL to
                        // degrade to, so render a disabled `<button>` with
                        // `aria-pressed` (hydrogen-variant-form).
                        <button
                          key={value.name}
                          type="button"
                          aria-pressed={value.selected}
                          disabled
                          className="option-pill"
                        >
                          {value.name}
                        </button>
                      ),
                    )}
                  </div>
                </fieldset>
              ))}
            </div>
          ) : null}

          {callOnly ? (
            // Out of stock online or price on request: the store can still source
            // or quote it, so offer a call instead of a dead add-to-cart button.
            <div className="flex flex-col gap-2">
              <a
                href={content.header.phoneHref}
                className="rounded-button bg-primary hover:bg-primary-dark inline-flex h-12 items-center justify-center gap-2 px-4 text-base font-bold text-white no-underline"
              >
                {interpolate(content.product.callToOrder, { phone: content.header.phone })}
              </a>
              <p className="text-on-surface-secondary text-sm">
                {soldOut ? content.product.soldOutNote : content.product.quoteNote}
              </p>
            </div>
          ) : null}

          {/* Add to cart form — separate from variant selection (variant-form skill).
              `formProps({ afterSubmit: openCartDrawer })` opens the drawer once
              on a successful reply; do not double-wire it on the button. */}
          <form
            {...formProps({ afterSubmit: openCartDrawer })}
            hidden={callOnly}
            className="flex flex-col gap-3"
          >
            <input type="hidden" {...register("merchandiseId", {})} />
            <div className="flex items-center gap-3">
              <span className="type-body-sm text-on-surface font-medium">
                {content.product.quantity}
              </span>
              <QuantityStepper
                inputProps={register("quantity", { defaultValue: 1 })}
                label={content.product.quantity}
                decreaseLabel={interpolate(content.product.decrease, {
                  label: content.product.quantity,
                })}
                increaseLabel={interpolate(content.product.increase, {
                  label: content.product.quantity,
                })}
              />
            </div>
            <button
              {...addToCartProps}
              aria-disabled={!addable}
              onClick={(event) => {
                if (!addable) {
                  event.preventDefault();
                  firstOptionRef.current?.focus();
                }
              }}
              className="rounded-button bg-lime text-primary-dark focus-visible:outline-focus inline-flex h-12 items-center justify-center px-4 text-base font-bold hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:opacity-50"
            >
              {addable
                ? content.product.addToCart
                : selectedVariant
                  ? content.product.soldOut
                  : content.product.selectOptions}
            </button>
          </form>

          {datasheetUrl ? (
            <a
              href={datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link inline-flex min-h-11 items-center gap-2 self-start font-semibold"
            >
              <DatasheetIcon />
              {content.product.datasheet}
            </a>
          ) : null}

          <ul role="list" className="text-on-surface-secondary flex flex-col gap-1 text-sm">
            {content.product.perks.map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
          </ul>

          {errors.userErrors.length > 0 ? (
            <div role="alert" className="text-sale text-sm">
              <ul>
                {errors.userErrors.map((error, index) => (
                  <li key={index} role="status">
                    {typeof error.message === "string"
                      ? error.message
                      : content.general.genericError}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {product.descriptionHtml ? (
            <div className="richtext type-body mt-4">
              <h2 className="type-heading-md mb-2">{content.product.description}</h2>
              <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
            </div>
          ) : product.description ? (
            <div className="type-body mt-4">
              <h2 className="type-heading-md mb-2">{content.product.description}</h2>
              <p>{product.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Build a product variant URL from a handle + selected options, preserving the
 * live `useSearchParams` (or any `URLSearchParams`) base so unrelated params
 * like `q` or UTM aren't dropped on a cross/combined-listing link
 * (`hydrogen-variant-form` / `references/nextjs.md`).
 */
function variantUrl(
  product: { handle: string; options: Array<{ name: string }> },
  selectedOptions: SelectedOption[],
  handle = product.handle,
  base: URLSearchParams | ReturnType<typeof useSearchParams> = new URLSearchParams(),
): string {
  const params = buildProductSelectionSearchParams({
    selectedOptions,
    optionNames: product.options.map((option) => option.name),
    base: new URLSearchParams(base),
  });
  const query = params.toString();
  return `/products/${handle}${query ? `?${query}` : ""}`;
}

/** Badge under the price: sold out, then price on request, then the stock count when known. */
function stockLabel({
  soldOut,
  callOnly,
  quantity,
  content,
}: {
  soldOut: boolean;
  callOnly: boolean;
  quantity: number | null | undefined;
  content: ReturnType<typeof useI18n>["content"];
}): string {
  if (soldOut) return content.product.soldOut;
  if (callOnly) return content.collection.table.onRequest;
  if (quantity && quantity > 0) {
    return interpolate(content.collection.table.stockCount, { count: quantity });
  }
  return content.product.inventory.inStock;
}
