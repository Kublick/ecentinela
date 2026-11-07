"use client";

import { useId, useState } from "react";

import { addLinesToCart, useCart } from "@/lib/cart";
import { openCartDrawer } from "@/lib/cart-drawer";

import { useI18n } from "./I18nProvider";

type QuickAddButtonProps = {
  product: {
    title: string;
    handle: string;
    featuredImage?: { url: string; altText?: string | null } | null;
  };
  variant: {
    id: string;
    title: string;
    availableForSale: boolean;
    price: { amount: string; currencyCode: string };
  } | null;
};

/**
 * One-click "Add to cart" for a product card (quantity 1, the product's
 * selected-or-first-available variant). Opens the cart drawer on success and
 * shows errors right under the button.
 */
export function QuickAddButton({ product, variant }: QuickAddButtonProps) {
  const { content } = useI18n();
  const errorId = useId();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loading = useCart((state) => state.loading);
  const readyPromise = useCart((state) => state.readyPromise);

  if (!variant?.availableForSale) {
    return (
      <button
        type="button"
        disabled
        className="rounded-button bg-surface-secondary text-on-surface inline-flex h-10 w-full items-center justify-center px-3 text-sm font-medium opacity-60"
      >
        {content.product.soldOut}
      </button>
    );
  }

  async function add() {
    if (adding || !variant) return;
    setAdding(true);
    setError(null);
    const message = await addLinesToCart(
      [{ product, variant, quantity: 1 }],
      { loading, readyPromise },
      content.collection.table,
    );
    setAdding(false);
    if (message) setError(message);
    else openCartDrawer();
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={() => void add()}
        aria-disabled={adding}
        aria-describedby={error ? errorId : undefined}
        className="rounded-button bg-lime text-primary-dark focus-visible:outline-accent inline-flex h-10 w-full items-center justify-center px-3 text-sm font-bold hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {adding ? content.collection.table.adding : content.product.addToCart}
        <span className="sr-only">: {product.title}</span>
      </button>
      {error ? (
        <p id={errorId} role="alert" className="text-sale text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
