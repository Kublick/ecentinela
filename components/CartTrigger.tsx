"use client";

import { useSyncExternalStore } from "react";

import { useCart } from "@/lib/cart";
import {
  CART_DRAWER_ID,
  getCartDrawerOpen,
  openCartDrawer,
  subscribeCartDrawerOpen,
} from "@/lib/cart-drawer";
import { plural } from "@/lib/content";
import { formatPrice } from "@/lib/money";

import { useI18n } from "./I18nProvider";

/**
 * Cart trigger — a `<button>` that opens the cart drawer via `showModal()`
 * (`hydrogen-cart-drawer` skill). `onClick` calls `openCartDrawer()`, which
 * calls `HTMLDialogElement.showModal()`; `aria-controls`/`aria-haspopup` keep
 * the control accessible. The footer `/cart` link is the full-page fallback
 * when the drawer is unavailable.
 */
export function CartTrigger() {
  const { content, tag } = useI18n();
  const totalQuantity = useCart((state) => state.data.totalQuantity);
  const subtotal = useCart((state) => state.data.cost.subtotalAmount);
  const cartDrawerOpen = useSyncExternalStore(
    subscribeCartDrawerOpen,
    getCartDrawerOpen,
    () => false,
  );
  const cartLabel = plural(content.cart.iconLabel, totalQuantity);
  const countDisplay = totalQuantity > 99 ? "99+" : String(totalQuantity);

  return (
    <>
      <button
        type="button"
        onClick={openCartDrawer}
        aria-controls={CART_DRAWER_ID}
        aria-haspopup="dialog"
        aria-expanded={cartDrawerOpen}
        className="focus-visible:outline-accent relative inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-3 rounded bg-transparent px-1 text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={cartLabel}
      >
        <CartIcon count={totalQuantity} display={countDisplay} />
        <span className="hidden flex-col items-start leading-tight md:flex" aria-hidden="true">
          <span className="text-xs text-white/80">{plural(content.cart.items, totalQuantity)}</span>
          {totalQuantity > 0 ? (
            <span className="font-bold tabular-nums">{formatPrice(subtotal, tag)}</span>
          ) : null}
        </span>
      </button>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {plural(content.cart.itemCount, totalQuantity)}
      </span>
    </>
  );
}

function CartIcon({ count, display }: { count: number; display: string }) {
  return (
    <span
      className="relative inline-flex size-5 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <img src="/icons/icon-cart.svg" width="20" height="20" alt="" className="size-5 invert" />
      {count > 0 ? (
        <span className="bg-lime text-primary-dark absolute end-0 top-0 flex h-5 w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-medium">
          {display}
        </span>
      ) : null}
    </span>
  );
}
