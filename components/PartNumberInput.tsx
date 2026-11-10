"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";

import type { HeaderSearchData } from "@/lib/predictive-search-handlers";

import { Price } from "./CurrencyProvider";
import { useI18n } from "./I18nProvider";

type Suggestion = HeaderSearchData["items"]["products"][number];

const MIN_TERM_LENGTH = 3;
const DEBOUNCE_MS = 200;

/**
 * Part number box with suggestions as you type: a combobox over the same
 * `/api/predictive-search` route as the header search (products only, at most
 * 5). Picking one fills its SKU, so the quick order lookup finds it exactly.
 * It never picks on its own: Enter submits the form unless a suggestion is
 * highlighted with the arrow keys, and Tab is left alone.
 */
export function PartNumberInput({
  value,
  onType,
  onPick,
  ...inputProps
}: Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onType: (value: string) => void;
  onPick: (sku: string, title: string) => void;
}) {
  const { content } = useI18n();
  const listId = useId();
  // The term being typed; empty after a pick so the list doesn't reopen.
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<{ term: string; items: Suggestion[] }>({ term: "", items: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const query = term.trim();
  const suggestions = query.length >= MIN_TERM_LENGTH && result.term === query ? result.items : [];
  const expanded = open && suggestions.length > 0;

  useEffect(() => {
    if (query.length < MIN_TERM_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: query, types: "PRODUCT", limit: "5" });
      fetch(`/api/predictive-search?${params}`, { signal: controller.signal })
        .then((response): Promise<HeaderSearchData> | null => (response.ok ? response.json() : null))
        .then((data) => {
          setResult({ term: query, items: data?.items.products ?? [] });
          setActive(-1);
        })
        // Suggestions are optional: on failure the box works as plain text.
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function pick(product: Suggestion) {
    onPick(product.selectedOrFirstAvailableVariant?.sku || product.handle, product.title);
    setTerm("");
    setOpen(false);
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <input
        {...inputProps}
        type="text"
        value={value}
        onChange={(event) => {
          onType(event.target.value);
          setTerm(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            if (suggestions.length === 0) return;
            event.preventDefault();
            setOpen(true);
            const last = suggestions.length - 1;
            setActive((index) =>
              event.key === "ArrowDown" ? (index >= last ? 0 : index + 1) : index <= 0 ? last : index - 1,
            );
          } else if (event.key === "Enter" && expanded && suggestions[active]) {
            event.preventDefault();
            pick(suggestions[active]);
          } else if (event.key === "Escape" && expanded) {
            event.preventDefault();
            setOpen(false);
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label={content.quickOrder.suggestions}
        hidden={!expanded}
        className="border-border absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded border bg-white shadow-lg"
      >
        {suggestions.map((product, index) => {
          const variant = product.selectedOrFirstAvailableVariant;
          return (
            <li
              key={product.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown, not click: keep focus in the input so blur doesn't close the list first.
              onMouseDown={(event) => {
                event.preventDefault();
                pick(product);
              }}
              onMouseEnter={() => setActive(index)}
              className="border-border aria-selected:bg-surface-secondary grid cursor-pointer gap-0.5 border-b px-3 py-2 text-sm last:border-b-0"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-bold break-all uppercase">{variant?.sku || product.handle}</span>
                {product.availableForSale ? (
                  variant?.price ? (
                    <span className="text-price shrink-0 font-semibold">
                      <Price money={variant.price} />
                    </span>
                  ) : null
                ) : (
                  <span className="text-sale shrink-0 text-xs font-semibold">
                    {content.product.soldOut}
                  </span>
                )}
              </span>
              <span className="text-on-surface-secondary line-clamp-2 text-xs">{product.title}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
