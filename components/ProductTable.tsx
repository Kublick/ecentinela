"use client";

import type { StorefrontApi } from "@shopify/hydrogen";
import Link from "next/link";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { useCart } from "@/lib/cart";
import { openCartDrawer } from "@/lib/cart-drawer";
import { interpolate, plural } from "@/lib/content";
import type { PRODUCT_ROW_QUERY } from "@/lib/fragments";
import { shopifyImageUrl } from "@/lib/image";
import { isPriceOnRequest } from "@/lib/money";

import { useI18n } from "./I18nProvider";
import { Price } from "./CurrencyProvider";
import { DatasheetIcon } from "./DatasheetIcon";

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
  pinnedId,
}: {
  products: ProductRowData[];
  collectionTitle: string;
  /** Show "N en existencia" (requires inventory access, see `hasInventoryAccess`). */
  showStock: boolean;
  isLoading?: boolean;
  /** Product to highlight first as the exact part-number match (search). */
  pinnedId?: string;
}) {
  const { content } = useI18n();
  const copy = content.collection.table;
  const statusId = useId();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const cartLoading = useCart((state) => state.loading);
  const cartReady = useCart((state) => state.readyPromise);

  // Pinned match first, then what can be ordered now, then sold out (stable
  // within each group). shortcut: orders only this page's rows; Shopify has no
  // availability sort key, so page 2 can still hold in-stock items.
  const rank = (product: ProductRowData, available: boolean) =>
    product.id === pinnedId ? 0 : available ? 1 : 2;
  const rows = products
    .flatMap((product) => {
      const variant = product.selectedOrFirstAvailableVariant;
      return variant ? [{ product, variant }] : [];
    })
    .sort(
      (a, b) =>
        rank(a.product, isOrderable(a.variant)) - rank(b.product, isOrderable(b.variant)),
    );
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
      aria-disabled={status.kind === "adding" || selectedLines.length === 0}
      className="rounded-button bg-lime text-primary-dark inline-flex h-11 aria-disabled:opacity-60 items-center justify-center px-5 text-sm font-bold hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
      {/* Phones: one stacked item per product with a +/- stepper. */}
      <ul role="list" className={`border-border border-t md:hidden ${isLoading ? "opacity-60" : ""}`}>
        {rows.map(({ product, variant }) => (
          <ProductListItem
            key={product.id}
            product={product}
            variant={variant}
            quantity={quantities[variant.id] ?? 0}
            onQuantityChange={(value) => setQuantity(variant.id, value)}
            showStock={showStock}
            pinned={product.id === pinnedId}
          />
        ))}
      </ul>

      <div className={`hidden overflow-x-auto md:block ${isLoading ? "opacity-60" : ""}`}>
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
              <th scope="col" className="hidden py-2 pe-3 font-medium xl:table-cell">
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
                pinned={product.id === pinnedId}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AddBar
        lines={selectedLines.length}
        pieces={selectedLines.reduce((sum, line) => sum + line.quantity, 0)}
        status={status}
        statusId={statusId}
        onClear={() => {
          setQuantities({});
          setStatus({ kind: "idle" });
        }}
        addButton={addButton}
      />
    </div>
  );
}

/** The add-to-cart bar pinned to the bottom of the screen while the table is in view. */
function AddBar({
  lines,
  pieces,
  status,
  statusId,
  onClear,
  addButton,
}: {
  lines: number;
  pieces: number;
  status: Status;
  statusId: string;
  onClear: () => void;
  addButton: ReactNode;
}) {
  const { content } = useI18n();
  const copy = content.collection.table;
  // Phones: the bar only appears once something is picked (or a result needs showing).
  const idle = lines === 0 && status.kind === "idle";
  return (
    <div className={`bg-primary-dark sticky bottom-0 z-10 items-center gap-x-6 gap-y-2 rounded-t-lg px-4 py-2.5 text-white shadow-bar sm:flex sm:flex-wrap sm:py-3 ${idle ? "hidden" : "flex"}`}>
      <p className="tabular-nums">
        {lines > 0 ? (
          <strong>
            {plural(copy.lines, lines)} ·{" "}
            {plural(copy.pieces, pieces)}
          </strong>
        ) : (
          <span className="hidden text-sm text-white/80 sm:inline">{copy.barHint}</span>
        )}
      </p>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`text-sm ${status.kind === "error" ? "text-error-on-dark font-semibold" : ""}`}
      >
        {status.kind === "success" || status.kind === "error" ? status.message : ""}
      </p>
      <div className="ms-auto flex items-center gap-3">
        {lines > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-button hidden h-11 border border-white px-4 text-sm font-semibold hover:bg-white/10 sm:inline-flex sm:items-center"
          >
            {copy.clear}
          </button>
        ) : null}
        {addButton}
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
  pinned,
}: {
  product: ProductRowData;
  variant: RowVariant;
  quantity: number;
  onQuantityChange: (value: string) => void;
  onQuantityKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  showStock: boolean;
  pinned: boolean;
}) {
  const { content, href } = useI18n();
  const copy = content.collection.table;
  const partNumber = partNumberOf(product, variant);
  const productHref = href(`/products/${product.handle}`);
  const datasheetUrl = datasheetHref(product.datasheet);
  const hasOptions = (product.variantsCount?.count ?? 1) > 1;
  const compareAt = variant.compareAtPrice;
  const onSale = compareAt ? Number(compareAt.amount) > Number(variant.price.amount) : false;
  const availability = availabilityLabel(variant, showStock, copy);

  return (
    <tr className={`border-border border-b align-top ${pinned ? "bg-tint" : ""}`}>
      <td className="min-w-40 py-3 ps-3 pe-3">
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
          <span className="flex min-w-0 flex-col gap-1">
            {/* Long codes (E5CC-QX2DSM-800) wrap at their hyphens on narrower screens instead of spilling into the next column. */}
            <span className="text-link min-w-0 font-mono font-semibold break-words xl:whitespace-nowrap">{partNumber}</span>
            {pinned ? (
              <span className="text-primary-dark text-xs font-semibold">{copy.exactMatch}</span>
            ) : null}
          </span>
        </Link>
      </td>
      <td className="hidden min-w-48 py-3 pe-3 md:table-cell">
        <p className="text-on-surface font-medium">
          {product.title}
          {/* The vendor column only shows from xl; below that the brand rides with the title. */}
          <span className="text-on-surface-secondary font-normal empty:hidden before:content-['_·_'] xl:hidden">
            {product.vendor}
          </span>
        </p>
        {product.description ? (
          <p className="text-on-surface-secondary mt-1 line-clamp-2 text-xs">
            {product.description}
          </p>
        ) : null}
      </td>
      <td className="text-on-surface-secondary hidden py-3 pe-3 xl:table-cell">
        {product.vendor}
      </td>
      <td className="hidden py-3 pe-3 text-center sm:table-cell">
        {datasheetUrl ? (
          <a
            href={datasheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link inline-flex size-9 items-center justify-center rounded hover:bg-tint"
            aria-label={interpolate(copy.datasheetLink, { part: partNumber })}
            title={interpolate(copy.datasheetLink, { part: partNumber })}
          >
            <DatasheetIcon />
          </a>
        ) : (
          <span className="text-on-surface-secondary" aria-hidden="true">
            –
          </span>
        )}
      </td>
      <td className="py-3 pe-3 text-end whitespace-nowrap">
        <span className="text-price font-bold">
          <Price money={variant.price} />
        </span>
        {onSale && compareAt ? (
          <s className="text-compare block text-xs"><Price money={compareAt} /></s>
        ) : null}
      </td>
      <td className="py-3 pe-3">
        <OrderCell
          hasOptions={hasOptions}
          available={isOrderable(variant)}
          productHref={productHref}
          partNumber={partNumber}
          quantity={quantity}
          onQuantityChange={onQuantityChange}
          onQuantityKeyDown={onQuantityKeyDown}
        />
      </td>
      <td className="hidden py-3 pe-3 text-xs sm:table-cell">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 font-semibold whitespace-nowrap ${
            isOrderable(variant)
              ? "bg-stock text-on-stock"
              : "text-on-surface-secondary bg-muted"
          }`}
        >
          {availability}
        </span>
      </td>
    </tr>
  );
}

/** Table quantity cell: a number box, "select options", or a call link when sold out. */
function OrderCell({
  hasOptions,
  available,
  productHref,
  partNumber,
  quantity,
  onQuantityChange,
  onQuantityKeyDown,
}: {
  hasOptions: boolean;
  available: boolean;
  productHref: string;
  partNumber: string;
  quantity: number;
  onQuantityChange: (value: string) => void;
  onQuantityKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const { content } = useI18n();
  const copy = content.collection.table;
  if (hasOptions) {
    return (
      <Link href={productHref} className="text-link text-sm whitespace-nowrap">
        {content.product.selectOptions}
      </Link>
    );
  }
  if (!available) {
    return (
      <a
        href={content.header.phoneHref}
        aria-label={interpolate(copy.callFor, { part: partNumber })}
        className="text-link inline-flex h-9 items-center px-1 text-sm font-semibold whitespace-nowrap"
      >
        {copy.call}
      </a>
    );
  }
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      value={quantity}
      onChange={(event) => onQuantityChange(event.currentTarget.value)}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={onQuantityKeyDown}
      aria-label={interpolate(copy.quantityFor, { part: partNumber })}
      className="number-reset rounded-button border-border h-9 w-16 border px-2 text-center text-sm"
    />
  );
}

/** Phone layout of one product: part number and price, title, stock, then a +/- stepper. */
function ProductListItem({
  product,
  variant,
  quantity,
  onQuantityChange,
  showStock,
  pinned,
}: {
  product: ProductRowData;
  variant: RowVariant;
  quantity: number;
  onQuantityChange: (value: string) => void;
  showStock: boolean;
  pinned: boolean;
}) {
  const { content, href } = useI18n();
  const copy = content.collection.table;
  const partNumber = partNumberOf(product, variant);
  const productHref = href(`/products/${product.handle}`);
  const datasheetUrl = datasheetHref(product.datasheet);
  const hasOptions = (product.variantsCount?.count ?? 1) > 1;
  const stepButton =
    "text-primary-dark inline-flex size-11 items-center justify-center text-xl disabled:opacity-30";

  return (
    <li className={`border-border flex flex-col gap-1.5 border-b px-1 py-3 ${pinned ? "bg-tint" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <Link href={productHref} className="text-link -my-2.5 py-2.5 font-mono font-semibold break-all">
          {partNumber}
        </Link>
        <span className="text-price font-bold whitespace-nowrap tabular-nums">
          <Price money={variant.price} />
        </span>
      </div>
      {pinned ? <span className="text-primary-dark text-xs font-semibold">{copy.exactMatch}</span> : null}
      <p className="text-sm leading-snug">
        {product.title}
        {product.vendor ? <span className="text-on-surface-secondary"> · {product.vendor}</span> : null}
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-on-surface-secondary text-sm">
          {availabilityLabel(variant, showStock, copy)}
          {datasheetUrl ? (
            <>
              {" · "}
              <a
                href={datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link inline-flex items-center gap-1 align-bottom"
              >
                <DatasheetIcon className="size-4" />
                {copy.datasheet}
              </a>
            </>
          ) : null}
        </span>
        {hasOptions ? (
          <Link href={productHref} className="text-link text-sm whitespace-nowrap">
            {content.product.selectOptions}
          </Link>
        ) : isOrderable(variant) ? (
          <div className="border-border inline-flex items-center rounded-[var(--radius-button)] border">
            <button
              type="button"
              onClick={() => onQuantityChange(String(quantity - 1))}
              disabled={quantity === 0}
              aria-label={interpolate(content.product.decrease, { label: partNumber })}
              className={stepButton}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={quantity}
              onChange={(event) => onQuantityChange(event.currentTarget.value)}
              onFocus={(event) => event.currentTarget.select()}
              aria-label={interpolate(copy.quantityFor, { part: partNumber })}
              className="number-reset h-11 w-12 rounded-none border-0 p-0 text-center text-base"
            />
            <button
              type="button"
              onClick={() => onQuantityChange(String(quantity + 1))}
              aria-label={interpolate(content.product.increase, { label: partNumber })}
              className={stepButton}
            >
              +
            </button>
          </div>
        ) : (
          <a
            href={content.header.phoneHref}
            aria-label={interpolate(copy.callFor, { part: partNumber })}
            className="rounded-button border-primary text-primary inline-flex h-11 items-center border px-4 text-sm font-semibold no-underline"
          >
            {copy.call}
          </a>
        )}
      </div>
    </li>
  );
}

/** In stock with a real price; otherwise the row offers a call instead of a quantity. */
function isOrderable(variant: RowVariant): boolean {
  return variant.availableForSale && !isPriceOnRequest(variant.price);
}

/** Part number as buyers write it: the SKU, else the handle, in capitals. */
function partNumberOf(product: ProductRowData, variant: RowVariant): string {
  return (variant.sku || product.handle).toUpperCase();
}

/** "12 en existencia" when stock counts are available, otherwise in stock / out of stock / on request. */
function availabilityLabel(
  variant: RowVariant,
  showStock: boolean,
  copy: { stockCount: string; available: string; unavailable: string; onRequest: string; onOrder: string },
): string {
  // Same precedence as the product page: sold out, price on request, on order, then stock.
  if (!variant.availableForSale) return copy.unavailable;
  if (isPriceOnRequest(variant.price)) return copy.onRequest;
  if (variant.currentlyNotInStock) return copy.onOrder;
  const quantityAvailable = "quantityAvailable" in variant ? variant.quantityAvailable : null;
  if (showStock && typeof quantityAvailable === "number" && quantityAvailable > 0) {
    return interpolate(copy.stockCount, { count: quantityAvailable });
  }
  return copy.available;
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
