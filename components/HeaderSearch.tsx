"use client";

import { getPredictiveSearchItemUrl } from "@shopify/hydrogen";
import {
  PredictiveSearchProvider,
  usePredictiveSearch,
  usePredictiveSearchActions,
  usePredictiveSearchForm,
} from "@shopify/hydrogen/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { matchCategories, type Category } from "@/lib/category-search";
import { interpolate } from "@/lib/content";
import { shopifyImageUrl } from "@/lib/image";
import type { HeaderSearchData } from "@/lib/predictive-search-handlers";
import { routeTemplates } from "@/lib/route-templates";

import { Price } from "./CurrencyProvider";
import { useI18n } from "./I18nProvider";

const RESULTS_ID = "header-search-results";

/**
 * Header search with a predictive dropdown (`hydrogen-predictive-search`
 * skill): categories, query suggestions and products, like e-centinela.com.
 * The form is a native `GET /search`, so it still works without JavaScript.
 */
export function HeaderSearch({ categories }: { categories: Category[] }) {
  const { href } = useI18n();
  return (
    <PredictiveSearchProvider searchAction={href("/search")}>
      <HeaderSearchInner categories={categories} />
    </PredictiveSearchProvider>
  );
}

function HeaderSearchInner({ categories }: { categories: Category[] }) {
  const { content, href } = useI18n();
  const [open, setOpen] = useState(false);
  const state = usePredictiveSearch<HeaderSearchData>();
  const { clear } = usePredictiveSearchActions();
  const { formProps, register } = usePredictiveSearchForm();
  const { term, items } = state.result;
  const matchedCategories = matchCategories(categories, state.term);
  const showResults = open && state.term !== "";

  function close() {
    setOpen(false);
  }

  function navigate() {
    close();
    clear();
  }

  return (
    <div
      className="relative order-last w-full min-w-0 md:order-none md:w-auto md:flex-1"
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <form {...formProps({ onSubmit: navigate })} className="flex w-full min-w-0">
        <label htmlFor="header-search-q" className="sr-only">
          {content.general.search}
        </label>
        <input
          id="header-search-q"
          {...register("query", { onChange: () => setOpen(true) })}
          placeholder={content.header.searchPlaceholder}
          className="h-11 rounded-e-none border-0 text-base"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={RESULTS_ID}
          aria-autocomplete="list"
        />
        <button
          type="submit"
          aria-label={content.general.search}
          className="bg-lime text-primary-dark inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-e-[var(--radius-input)] hover:brightness-95"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="size-5"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </button>
      </form>

      <div
        id={RESULTS_ID}
        hidden={!showResults}
        className="text-on-surface absolute inset-x-0 top-full z-50 mt-1 max-h-[75vh] overflow-y-auto rounded bg-white px-5 pb-4 shadow-xl"
      >
        {state.error ? (
          <p role="alert" className="text-sale py-4 text-sm">
            {state.error}
          </p>
        ) : state.status === "success" && state.result.total === 0 && matchedCategories.length === 0 ? (
          <p role="status" className="py-4 text-sm">
            {interpolate(content.search.noResults, { terms: `“${term}”` })}
          </p>
        ) : (
          <>
            {state.status === "loading" && state.result.total === 0 ? (
              <p className="text-on-surface-secondary pt-4 text-sm">{content.search.searching}</p>
            ) : null}
            <Section title={content.search.categories} show={matchedCategories.length > 0}>
              {matchedCategories.map((category) => (
                <li key={category.href}>
                  <Link
                    href={category.href}
                    onClick={navigate}
                    className="text-on-surface block py-1.5 no-underline hover:underline"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </Section>

            <Section title={content.search.suggestions} show={items.queries.length > 0}>
              {items.queries.map((suggestion) => (
                <li key={suggestion.text}>
                  <Link
                    href={href(getPredictiveSearchItemUrl(suggestion, { routes: routeTemplates }))}
                    onClick={navigate}
                    className="text-on-surface block py-1.5 no-underline hover:underline [&_mark]:bg-transparent [&_mark]:font-bold [&_mark]:text-inherit"
                    // styledText is Shopify's HTML for the suggestion, with the completion in <mark>.
                    dangerouslySetInnerHTML={{ __html: suggestion.styledText }}
                  />
                </li>
              ))}
            </Section>

            <Section title={content.search.products} show={items.products.length > 0}>
              {items.products.map((product) => (
                <ProductResult key={product.id} product={product} term={term} onNavigate={navigate} />
              ))}
            </Section>

            {items.products.length > 0 ? (
              <Link
                href={href(`/search?q=${encodeURIComponent(term)}`)}
                onClick={navigate}
                className="text-link mt-3 block text-sm font-semibold"
              >
                {content.search.viewAll} →
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, show, children }: { title: string; show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <section className="pt-4">
      <h2 className="text-on-surface-secondary border-border mb-1 border-b pb-1 text-xs font-semibold tracking-widest uppercase">
        {title}
      </h2>
      <ul role="list">{children}</ul>
    </section>
  );
}

function ProductResult({
  product,
  term,
  onNavigate,
}: {
  product: HeaderSearchData["items"]["products"][number];
  term: string;
  onNavigate: () => void;
}) {
  const { href } = useI18n();
  const variant = product.selectedOrFirstAvailableVariant;
  const image = variant?.image;

  return (
    <li className="border-border border-b last:border-b-0">
      <Link
        href={href(getPredictiveSearchItemUrl(product, { routes: routeTemplates, term }))}
        onClick={onNavigate}
        className="text-on-surface hover:bg-surface-secondary flex gap-4 py-3 no-underline"
      >
        <span className="flex size-20 shrink-0 items-center justify-center">
          {image ? (
            <img
              src={shopifyImageUrl(image.url, { width: 160 })}
              alt={image.altText ?? ""}
              className="max-h-full max-w-full object-contain"
            />
          ) : null}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          {variant?.sku ? (
            <span className="text-on-surface-secondary text-xs tracking-wide">SKU: {variant.sku}</span>
          ) : null}
          {product.vendor ? (
            <span className="text-on-surface-secondary text-xs tracking-wide uppercase">{product.vendor}</span>
          ) : null}
          <span className="truncate font-medium">{product.title}</span>
          {product.description ? (
            <span className="text-on-surface-secondary line-clamp-3 text-xs">{product.description}</span>
          ) : null}
          {variant?.price ? (
            <span className="text-price font-bold">
              <Price money={variant.price} />
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}
