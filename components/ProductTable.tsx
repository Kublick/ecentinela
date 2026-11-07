"use client";

import type { StorefrontApi } from "@shopify/hydrogen";
import Link from "next/link";
import { useId, useState, type KeyboardEvent } from "react";

import { useCart } from "@/lib/cart";
import { openCartDrawer } from "@/lib/cart-drawer";
import { interpolate, plural } from "@/lib/content";
import type { PRODUCT_ROW_QUERY } from "@/lib/fragments";
import { shopifyImageUrl } from "@/lib/image";
import { formatPrice } from "@/lib/money";

import { useI18n } from "./I18nProvider";

/** A collection table row (`PRODUCT_ROW_FRAGMENT`). */
export type ProductRowData = NonNullable<
  StorefrontApi.ResultOf<typeof PRODUCT_ROW_QUERY>["product"]
>;

type Status =
  | { kind: "idle" }
  | { kind: "adding" }
  | { kind: "success" | "error"; message: string };

/**
 * Collection ordering table, modeled on the live e-centinela.com collection
 * pages: one row per product with part number, description, vendor, datasheet,
 * price, a quantity box and availability, plus one button that adds every row
 * with a quantity to the cart in a single `Shopify.actions.updateCart` call
 * (`hydrogen-cart-ui` "Code-driven cart changes": several adds batch into one
 * call, and the cart store projects them optimistically).
 *
 * The table renders inside the collection filter `<form method="get">`, so the
 * quantity inputs have no `name` (they must not join the filter query) and
 * Enter in a quantity box adds to cart instead of submitting the filters.
 */
export function ProductTable({
  products,
  collectionTitle,
  showStock,
  isLoading = false,
}: {
  products: ProductRowData[];
  collectionTitle: string;
  /** Show "N en existencia" (requires inventory access, see `hasInventoryAccess`). */
  showStock: boolean;
  isLoading?: boolean;
}) {
  const { content } = useI18n();
  const copy = content.collection.table;
  const statusId = useId();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const cartLoading = useCart((state) => state.loading);
  const cartReady = useCart((state) => state.readyPromise);

  const rows = products.flatMap((product) => {
    const variant = product.selectedOrFirstAvailableVariant;
    return variant ? [{ product, variant }] : [];
  });
  const selectedLines = rows
    .map(({ product, variant }) => ({ product, variant, quantity: quantities[variant.id] ?? 0 }))
    .filter((line) => line.quantity > 0);
  const currencyCode = rows[0]?.variant.price.currencyCode ?? "";

  function setQuantity(variantId: string, value: string) {
    const quantity = Math.max(0, Math.floor(Number(value) || 0));
    setQuantities((current) => ({ ...current, [variantId]: quantity }));
    if (status.kind !== "adding") setStatus({ kind: "idle" });
  }

  async function addSelected() {
    if (status.kind === "adding") return;
    if (selectedLines.length === 0) {
      setStatus({ kind: "error", message: copy.nothingSelected });
      return;
    }

    const updateCart = window.Shopify?.actions?.updateCart;
    if (!updateCart || updateCart.isDefault() || cartLoading) {
      setStatus({ kind: "error", message: copy.cartNotReady });
      return;
    }

    setStatus({ kind: "adding" });
    try {
      await cartReady;
      const result = await updateCart(
        {
          lines: selectedLines.map(({ variant, quantity }) => ({
            merchandiseId: variant.id,
            quantity,
          })),
        },
        {
          event: {
            context: "product",
            // Previews so the new lines show before Shopify responds.
            detail: {
              products: selectedLines.map(({ product, variant }) => ({
                id: variant.id,
                price: variant.price,
                title: variant.title,
                product: { title: product.title, handle: product.handle },
                image: product.featuredImage,
              })),
            },
          },
        },
      );

      const userError = result.userErrors?.[0]?.message;
      if (userError) {
        setStatus({ kind: "error", message: userError });
        return;
      }

      setQuantities({});
      setStatus({ kind: "success", message: plural(copy.added, selectedLines.length) });
      openCartDrawer();
    } catch {
      setStatus({ kind: "error", message: copy.addError });
    }
  }

  function onQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    // Don't submit the surrounding filter form.
    event.preventDefault();
    void addSelected();
  }

  const addButton = (
    <button
      type="button"
      onClick={() => void addSelected()}
      aria-describedby={statusId}
      aria-disabled={status.kind === "adding"}
      className="rounded-button bg-lime text-primary-dark inline-flex h-11 items-center justify-center px-5 text-sm font-bold hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {status.kind === "adding"
        ? copy.adding
        : selectedLines.length > 0
          ? plural(copy.addSelectedCount, selectedLines.length)
          : copy.addSelected}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className={`overflow-x-auto ${isLoading ? "opacity-60" : ""}`}>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            {interpolate(copy.caption, { collection: collectionTitle })}
          </caption>
          <thead>
            <tr className="bg-tint text-primary-dark text-xs">
              <th scope="col" className="py-2 ps-3 pe-3 font-semibold">
                {copy.partNumber}
              </th>
              <th scope="col" className="hidden py-2 pe-3 font-medium md:table-cell">
                {copy.description}
              </th>
              <th scope="col" className="hidden py-2 pe-3 font-medium lg:table-cell">
                {copy.vendor}
              </th>
              <th scope="col" className="hidden py-2 pe-3 text-center font-medium sm:table-cell">
                {copy.datasheet}
              </th>
              <th scope="col" className="py-2 pe-3 text-end font-medium">
                {interpolate(copy.price, { currency: currencyCode })}
                <span className="block font-normal">{copy.taxIncluded}</span>
              </th>
              <th scope="col" className="py-2 pe-3 font-medium">
                {copy.order}
              </th>
              <th scope="col" className="hidden py-2 font-medium sm:table-cell">
                {copy.availability}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, variant }) => (
              <ProductTableRow
                key={product.id}
                product={product}
                variant={variant}
                quantity={quantities[variant.id] ?? 0}
                onQuantityChange={(value) => setQuantity(variant.id, value)}
                onQuantityKeyDown={onQuantityKeyDown}
                showStock={showStock}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pinned to the bottom of the screen while the table is in view. */}
      <div className="bg-primary-dark sticky bottom-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-t-lg px-4 py-3 text-white shadow-[0_-6px_18px_rgb(20_22_60/0.18)]">
        <p className="tabular-nums">
          {selectedLines.length > 0 ? (
            <strong>
              {plural(copy.lines, selectedLines.length)} ·{" "}
              {plural(
                copy.pieces,
                selectedLines.reduce((sum, line) => sum + line.quantity, 0),
              )}
            </strong>
          ) : (
            <span className="text-sm text-white/80">{copy.barHint}</span>
          )}
        </p>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={`text-sm ${status.kind === "error" ? "font-semibold text-[#ffc9c9]" : ""}`}
        >
          {status.kind === "success" || status.kind === "error" ? status.message : ""}
        </p>
        <div className="ms-auto flex items-center gap-3">
          {selectedLines.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setQuantities({});
                setStatus({ kind: "idle" });
              }}
              className="rounded-button h-11 border border-white px-4 text-sm font-semibold hover:bg-white/10"
            >
              {copy.clear}
            </button>
          ) : null}
          {addButton}
        </div>
      </div>
    </div>
  );
}

type RowVariant = NonNullable<ProductRowData["selectedOrFirstAvailableVariant"]>;

function ProductTableRow({
  product,
  variant,
  quantity,
  onQuantityChange,
  onQuantityKeyDown,
  showStock,
}: {
  product: ProductRowData;
  variant: RowVariant;
  quantity: number;
  onQuantityChange: (value: string) => void;
  onQuantityKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  showStock: boolean;
}) {
  const { content, href, tag } = useI18n();
  const copy = content.collection.table;
  const partNumber = variant.sku || product.handle;
  const productHref = href(`/products/${product.handle}`);
  const datasheetUrl = datasheetHref(product.datasheet);
  const hasOptions = (product.variantsCount?.count ?? 1) > 1;
  const compareAt = variant.compareAtPrice;
  const onSale = compareAt ? Number(compareAt.amount) > Number(variant.price.amount) : false;
  const availability = availabilityLabel(variant, showStock, copy);

  return (
    <tr className="border-border border-b align-top">
      <td className="py-3 ps-3 pe-3">
        <Link
          href={productHref}
          className="text-on-surface flex items-start gap-3 no-underline hover:opacity-70"
        >
          {product.featuredImage ? (
            <img
              src={shopifyImageUrl(product.featuredImage.url, { width: 96 })}
              alt=""
              width={48}
              height={48}
              loading="lazy"
              className="bg-surface-secondary size-12 shrink-0 rounded object-contain"
            />
          ) : (
            <span className="bg-surface-secondary size-12 shrink-0 rounded" />
          )}
          <span className="flex flex-col gap-1">
            <span className="text-link font-mono font-semibold uppercase">{partNumber}</span>
            <span className="text-on-surface-secondary line-clamp-2 text-xs md:hidden">
              {product.title}
            </span>
          </span>
        </Link>
      </td>
      <td className="hidden py-3 pe-3 md:table-cell">
        <p className="text-on-surface font-medium">{product.title}</p>
        {product.description ? (
          <p className="text-on-surface-secondary mt-1 line-clamp-2 text-xs">
            {product.description}
          </p>
        ) : null}
      </td>
      <td className="text-on-surface-secondary hidden py-3 pe-3 lg:table-cell">
        {product.vendor}
      </td>
      <td className="hidden py-3 pe-3 text-center sm:table-cell">
        {datasheetUrl ? (
          <a
            href={datasheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link text-sm"
            aria-label={interpolate(copy.datasheetLink, { part: partNumber })}
          >
            PDF
          </a>
        ) : (
          <span className="text-on-surface-secondary" aria-hidden="true">
            –
          </span>
        )}
      </td>
      <td className="py-3 pe-3 text-end whitespace-nowrap">
        <span className="text-price font-bold">
          {formatPrice(variant.price, tag)}
        </span>
        {onSale && compareAt ? (
          <s className="text-compare block text-xs">{formatPrice(compareAt, tag)}</s>
        ) : null}
      </td>
      <td className="py-3 pe-3">
        {hasOptions ? (
          <Link href={productHref} className="text-link text-sm whitespace-nowrap">
            {content.product.selectOptions}
          </Link>
        ) : (
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={quantity}
            onChange={(event) => onQuantityChange(event.currentTarget.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={onQuantityKeyDown}
            disabled={!variant.availableForSale}
            aria-label={interpolate(copy.quantityFor, { part: partNumber })}
            className="number-reset rounded-button border-border h-9 w-16 border px-2 text-center text-sm disabled:opacity-40"
          />
        )}
        <span className="text-on-surface-secondary mt-1 block text-xs sm:hidden">
          {availability}
        </span>
      </td>
      <td className="hidden py-3 pe-3 text-xs sm:table-cell">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 font-semibold whitespace-nowrap ${
            variant.availableForSale
              ? "bg-[#e3f2e6] text-[#1b5e2a]"
              : "text-on-surface-secondary bg-[#f1f2f5]"
          }`}
        >
          {availability}
        </span>
      </td>
    </tr>
  );
}

/** "12 en existencia" when stock counts are available, otherwise in stock / out of stock. */
function availabilityLabel(
  variant: RowVariant,
  showStock: boolean,
  copy: { stockCount: string; available: string; unavailable: string },
): string {
  const quantityAvailable = "quantityAvailable" in variant ? variant.quantityAvailable : null;
  if (showStock && typeof quantityAvailable === "number" && quantityAvailable > 0) {
    return interpolate(copy.stockCount, { count: quantityAvailable });
  }
  return variant.availableForSale ? copy.available : copy.unavailable;
}

/** Datasheet URL from the `custom.datasheet` metafield (file reference or URL). */
export function datasheetHref(datasheet: ProductRowData["datasheet"]): string | null {
  if (!datasheet) return null;
  const reference = datasheet.reference;
  if (reference && "url" in reference && reference.url) return reference.url;
  if (reference && "image" in reference && reference.image?.url) return reference.image.url;
  if (datasheet.type === "url" && datasheet.value) return datasheet.value;
  return null;
}
