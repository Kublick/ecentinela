import { createCartComponents } from "@shopify/hydrogen/react";

import type { cartHandlers } from "./cart-handlers";

/**
 * React cart bindings derived from the cart server handlers' type. The
 * `CartProvider` accepts the full handler data envelope (`{cart, errors?}`), or
 * a promise resolving to it, as `initialData` — see `hydrogen-cart-ui` /
 * `references/react.md`. Do not unwrap to `data.cart`: `{cart: null}` tells the
 * client the server already checked.
 */
export const { CartProvider, useCart, useSuspenseCart, useCartForm } =
  createCartComponents<typeof cartHandlers>();

type AddLine = {
  quantity: number;
  variant: { id: string; title: string; price: { amount: string; currencyCode: string } };
  product: { title: string; handle: string; featuredImage?: { url: string; altText?: string | null } | null };
};

/**
 * Adds lines through `Shopify.actions.updateCart` (`hydrogen-cart-ui` "Code-driven
 * cart changes"): waits for the store, batches every add into one call, and
 * sends previews so the lines show before Shopify responds. Resolves to an
 * error message, or `null` on success.
 */
export async function addLinesToCart(
  lines: AddLine[],
  cart: { loading: boolean; readyPromise?: PromiseLike<unknown> },
  copy: { cartNotReady: string; addError: string },
): Promise<string | null> {
  const updateCart = window.Shopify?.actions?.updateCart;
  if (!updateCart || updateCart.isDefault() || cart.loading) return copy.cartNotReady;
  try {
    await cart.readyPromise;
    const result = await updateCart(
      { lines: lines.map(({ variant, quantity }) => ({ merchandiseId: variant.id, quantity })) },
      {
        event: {
          context: "product",
          detail: {
            products: lines.map(({ product, variant }) => ({
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
    return result.userErrors?.[0]?.message ?? null;
  } catch {
    return copy.addError;
  }
}
