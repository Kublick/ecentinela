"use client";

import { useCart, useCartForm } from "@/lib/cart";
import { shopifyImageUrl } from "@/lib/image";
import { interpolate } from "@/lib/content";
import { formatPrice } from "@/lib/money";

import { useI18n } from "./I18nProvider";

/**
 * A cart line, derived from the typed `useCart` binding (F3: consume typed data,
 * no hand-rolled parallel shape). Narrowed field access stays tolerant of the
 * gql.tada-inferred merchandise union via optional chaining
 * (`hydrogen-cart-ui` / `references/react.md`).
 */
type CartState = Parameters<Parameters<typeof useCart>[0]>[0];
type CartLine = CartState["data"]["lines"]["nodes"][number];

/**
 * Shared cart line-item form — used by both the cart drawer and the `/cart`
 * page (`hydrogen-cart-ui` / `hydrogen-cart-drawer`). Preserves the
 * progressive-enhancement form contract: hidden `register("set")`, scoped
 * `register("lineId", { value })`, and a real editable quantity input from
 * `register("quantity", { value, interactive: true })`. Increase/decrease/remove
 * are additional submit controls, not replacements.
 */
export function CartLineItem({
  line,
  onRemoveIntent,
}: {
  line: CartLine;
  onRemoveIntent?: () => void;
}) {
  const { content, href, tag } = useI18n();
  const { formProps, register } = useCartForm();
  const pendingLines = useCart((state) => state.pending.lines);
  const isPending = pendingLines.has(line.id);

  const merchandise = line.merchandise;
  const productTitle = merchandise?.product?.title ?? merchandise?.title ?? content.cart.line.productFallback;
  const productHandle = merchandise?.product?.handle;
  // Single-variant products report "Title: Default Title"; don't show it.
  const selectedOptions = (merchandise?.selectedOptions ?? []).filter(
    (option) => option.value !== "Default Title",
  );
  const variantSubtitle = selectedOptions.map((option) => option.value).join(" / ");

  const totalAmount = line.cost.totalAmount;
  const compareAt = line.cost.compareAtAmountPerQuantity ?? null;
  const onSale = compareAt && Number(compareAt.amount) > Number(totalAmount.amount);

  return (
    <div
      className="grid grid-cols-[var(--spacing-cart-line-thumbnail-width)_1fr_auto] items-stretch gap-3 py-4"
      {...(isPending ? { "aria-busy": "true" } : {})}
    >
      <div className="bg-surface-secondary h-full w-full overflow-hidden">
        {merchandise?.image ? (
          <img
            src={shopifyImageUrl(merchandise.image.url, { width: 128 })}
            alt={
              merchandise.image.altText ??
              (variantSubtitle
                ? interpolate(content.cart.line.imageAlt, {
                    title: productTitle,
                    variant: variantSubtitle,
                  })
                : productTitle)
            }
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0">
        {productHandle ? (
          <a
            href={href(`/products/${productHandle}`)}
            className="type-body-sm text-on-surface font-medium no-underline hover:opacity-70"
          >
            {productTitle}
          </a>
        ) : (
          <p className="type-body-sm text-on-surface font-medium">{productTitle}</p>
        )}
        {variantSubtitle ? (
          <p className="text-on-surface-secondary mt-1 text-xs">{variantSubtitle}</p>
        ) : null}
        <p className="text-on-surface mt-2 text-sm">
          {onSale ? (
            <span className="text-sale font-medium">{formatPrice(totalAmount, tag)}</span>
          ) : (
            formatPrice(totalAmount, tag)
          )}
          {onSale && compareAt ? (
            <>
              {" "}
              <s className="text-compare text-sm">{formatPrice(compareAt, tag)}</s>
            </>
          ) : null}
        </p>

        <form {...formProps()} className="mt-3">
          <button {...register("set")} className="sr-only" tabIndex={-1} />
          <input type="hidden" {...register("lineId", { value: line.id })} />
          <div className="quantity-selector-outlined inline-flex items-center rounded">
            <button
              type="submit"
              {...register("decrease")}
              disabled={line.quantity <= 1}
              className="button-icon h-8 w-9 rounded-s disabled:opacity-40"
              aria-label={interpolate(content.cart.line.decrease, { title: productTitle })}
            >
              –
            </button>
            <input
              {...register("quantity", { value: line.quantity, interactive: true })}
              className="number-reset h-8 w-12 text-center text-sm"
              aria-label={interpolate(content.cart.line.quantity, { title: productTitle })}
            />
            <button
              type="submit"
              {...register("increase")}
              className="button-icon h-8 w-9 rounded-e"
              aria-label={interpolate(content.cart.line.increase, { title: productTitle })}
            >
              +
            </button>
          </div>
        </form>
      </div>

      <form {...formProps()}>
        <input type="hidden" {...register("lineId", { value: line.id })} />
        <button
          type="submit"
          {...register("remove")}
          onClick={onRemoveIntent}
          className="button-icon self-start rounded"
          aria-label={interpolate(content.cart.line.remove, { title: productTitle })}
        >
          <img
            src="/icons/icon-trash.svg"
            width="20"
            height="20"
            alt=""
            className="size-5"
            aria-hidden="true"
          />
        </button>
      </form>
    </div>
  );
}
