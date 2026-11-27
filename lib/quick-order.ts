/** A product as the quick order lookup returns it (`QUICK_ORDER_QUERY`). */
export type QuickOrderProduct = {
  handle: string;
  title: string;
  variants: { nodes: { sku?: string | null; availableForSale: boolean }[] };
};

/**
 * The variant a typed part number means: an exact SKU match first, else a
 * product whose handle, title or first title word is the code (its first
 * available variant). Case-insensitive. Storefront search is fuzzy, so only
 * exact matches count; `null` means not found.
 */
export function findVariant<P extends QuickOrderProduct>(
  code: string,
  products: P[],
): { product: P; variant: P["variants"]["nodes"][number] } | null {
  const target = code.trim().toLowerCase();
  if (!target) return null;
  for (const product of products) {
    const variant = product.variants.nodes.find((v) => v.sku?.trim().toLowerCase() === target);
    if (variant) return { product, variant };
  }
  for (const product of products) {
    const title = product.title.trim().toLowerCase();
    const named = [product.handle, title, title.split(/[\s,]/)[0]].includes(target);
    const variant =
      product.variants.nodes.find((v) => v.availableForSale) ?? product.variants.nodes[0];
    if (named && variant) return { product, variant };
  }
  return null;
}
