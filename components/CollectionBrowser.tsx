"use client";

import {
  createPredictiveSearchFormRegister,
  getFilterRemovalUrl,
  getSortByValue,
  serializeCollectionParams,
  type ProductFilter,
} from "@shopify/hydrogen";
import { CollectionProvider, useCollection, useCollectionForm } from "@shopify/hydrogen/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useI18n } from "@/components/I18nProvider";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductTable, type ProductRowData } from "@/components/ProductTable";
import { AnalyticsEvent, getAnalytics } from "@/lib/analytics";
import { interpolate, type Content } from "@/lib/content";
import { FilterGroup } from "@/lib/filters";
import { formatPrice } from "@/lib/money";
import type { CollectionAvailableFilter, SearchAvailableFilter } from "@/lib/queries";

/**
 * Shared collection/search browser (`hydrogen-collection-browser` /
 * `references/nextjs.md`). The server page fetches the product + filter
 * snapshot via `staticStorefrontClient` inside a `use cache` cache-point and
 * passes it here. This client component owns the `CollectionProvider`,
 * `useCollection`/`useCollectionForm`, URL sync via `useRouter`/`useSearchParams`,
 * and the filter/sort/grid UI.
 *
 * `onChange` → `router.replace(href, { scroll: false })` + `router.refresh()` so
 * the RSC payload catches up when the client URL is ahead.
 * Browse forms carry `method="get"` + explicit `action` (feedback Round 4 #4)
 * so they submit without JS (F4).
 *
 * Collections render as an ordering table (`ProductTable`); search results
 * keep the product card grid.
 */
type SortLabels = Content["collection"]["sortOptions"];

function collectionSortOptions(labels: SortLabels) {
  return [
    { label: labels.featured, value: getSortByValue("COLLECTION_DEFAULT", false) },
    { label: labels.bestSelling, value: getSortByValue("BEST_SELLING", false) },
    { label: labels.titleAsc, value: getSortByValue("TITLE", false) },
    { label: labels.titleDesc, value: getSortByValue("TITLE", true) },
    { label: labels.priceAsc, value: getSortByValue("PRICE", false) },
    { label: labels.priceDesc, value: getSortByValue("PRICE", true) },
    { label: labels.createdDesc, value: getSortByValue("CREATED", true) },
  ];
}

function searchSortOptions(labels: SortLabels) {
  return [
    { label: labels.relevance, value: getSortByValue("RELEVANCE", false) },
    { label: labels.priceAsc, value: getSortByValue("PRICE", false) },
    { label: labels.priceDesc, value: getSortByValue("PRICE", true) },
  ];
}

const registerSearchField = createPredictiveSearchFormRegister();

type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};
type BrowserAvailableFilter = CollectionAvailableFilter | SearchAvailableFilter;

export type CollectionBrowserProps =
  | {
      mode: "collection";
      handle: string;
      collection: {
        id: string;
        handle: string;
        title: string;
        description?: string | null;
        descriptionHtml?: string | null;
      };
      products: ProductRowData[];
      availableFilters: CollectionAvailableFilter[];
      pageInfo: PageInfo;
      dataSearch: string;
      /** Show stock counts in the table (needs inventory access). */
      showStock: boolean;
    }
  | {
      mode: "search";
      term: string;
      products: ProductCardData[];
      availableFilters: SearchAvailableFilter[];
      pageInfo: PageInfo;
      totalCount: number;
      dataSearch: string;
    };

export function CollectionBrowser(props: CollectionBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.toString();

  const providerHandle = props.mode === "collection" ? props.handle : `search:${props.term}`;

  return (
    <CollectionProvider
      data={{ handle: providerHandle, dataSearch: props.dataSearch }}
      urlSearch={urlSearch}
      onChange={(search) => {
        const href = `${pathname}${search}`;
        if (urlSearch) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
        router.refresh();
      }}
    >
      {props.mode === "collection" ? (
        <CollectionViewedTracker id={props.collection.id} handle={props.collection.handle} />
      ) : (
        <SearchViewedTracker term={props.term} totalCount={props.totalCount} />
      )}
      {props.mode === "collection" ? <CollectionPage {...props} /> : <SearchPage {...props} />}
    </CollectionProvider>
  );
}

function CollectionViewedTracker({ id, handle }: { id: string; handle: string }) {
  useEffect(() => {
    const analytics = getAnalytics();
    if (!analytics) return;
    analytics.publish(AnalyticsEvent.COLLECTION_VIEWED, {
      collection: { id, handle },
    });
  }, [id, handle]);
  return null;
}

function SearchViewedTracker({ term, totalCount }: { term: string; totalCount: number }) {
  useEffect(() => {
    if (!term) return;
    const analytics = getAnalytics();
    if (!analytics) return;
    analytics.publish(AnalyticsEvent.SEARCH_VIEWED, {
      searchTerm: term,
      searchResults: { totalCount },
    });
  }, [term, totalCount]);
  return null;
}

type CollectionPageProps = Extract<CollectionBrowserProps, { mode: "collection" }>;

function CollectionPage(props: CollectionPageProps) {
  const { collection, products, availableFilters, pageInfo, showStock } = props;
  const { locale, content, href } = useI18n();
  const state = useCollection();
  const { formProps } = useCollectionForm();
  const router = useRouter();
  const isLoading = state.status === "loading";
  const collectionPath = href(`/collections/${collection.handle}`);
  // `<Link>` navigations (active-filter chips, clear-all, load-more) update the
  // URL but, under Cache Components / PPR, the RSC payload doesn't re-fetch on a
  // same-segment `searchParams` change unless we explicitly refresh. `onChange`
  // (form-driven) already calls `router.refresh()`; this wires the same refresh
  // to the `<Link>` clicks so the server products/filters catch up to the URL
  // (hydrogen-collection-browser/references/nextjs.md).
  const onNavigate = () => router.refresh();

  const showingCount = interpolate(content.collection.showingCountPartial, {
    shown: products.length,
  });
  const currencyCode =
    products[0]?.selectedOrFirstAvailableVariant?.price.currencyCode ?? "USD";

  return (
    <div className="max-w-page px-margin mx-auto w-full py-8">
      <div className="mb-6">
        <Breadcrumbs
          locale={locale}
          items={[
            { label: content.collection.breadcrumb, href: "/collections" },
            { label: collection.title },
          ]}
        />
      </div>

      <h1 className="type-display mb-4">{collection.title}</h1>
      {collection.descriptionHtml ? (
        <div
          className="richtext type-body text-on-surface-secondary mb-6 max-w-prose"
          dangerouslySetInnerHTML={{ __html: collection.descriptionHtml }}
        />
      ) : collection.description ? (
        <p className="type-body text-on-surface-secondary mb-6 max-w-prose">
          {collection.description}
        </p>
      ) : null}

      <form
        {...formProps()}
        method="get"
        action={collectionPath}
        className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8"
      >
        <FilterSidebar
          key={collection.handle}
          availableFilters={availableFilters}
          activeFilters={state.filters}
          isLoading={isLoading}
          currencyCode={currencyCode}
        />

        <div key="results" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <p className="type-body-sm text-on-surface-secondary" aria-live="polite">
              {showingCount}
            </p>
            <SortSelect
              isLoading={isLoading}
              options={collectionSortOptions(content.collection.sortOptions)}
            />
          </div>

          <ActiveFilterChips
            activeFilters={state.filters}
            collectionPath={collectionPath}
            onNavigate={onNavigate}
            currencyCode={currencyCode}
          />

          {products.length === 0 ? (
            <p className="text-on-surface-secondary py-12 text-center">
              {content.collection.noProducts}
            </p>
          ) : (
            <ProductTable
              products={products}
              collectionTitle={collection.title}
              showStock={showStock}
              isLoading={isLoading}
            />
          )}

          <Pagination
            pageInfo={pageInfo}
            basePath={collectionPath}
            search={searchWithoutCursor(state.filters, state.sortKey, state.reverse)}
            onNavigate={onNavigate}
            labels={content.collection}
          />

          {/* No-JS submit so the GET filter/sort form is submittable without JS (F4). */}
          <noscript>
            <button type="submit" className="rounded-button button-primary h-11 px-4">
              {content.collection.showResults}
            </button>
          </noscript>
        </div>
      </form>
    </div>
  );
}

type SearchPageProps = Extract<CollectionBrowserProps, { mode: "search" }>;

function SearchPage(props: SearchPageProps) {
  const { term, products, availableFilters, pageInfo, totalCount } = props;
  const { locale, content, href } = useI18n();
  const state = useCollection();
  const { formProps } = useCollectionForm();
  const router = useRouter();
  const onNavigate = () => router.refresh();
  const isLoading = state.status === "loading";
  const currencyCode = products[0]?.priceRange.minVariantPrice.currencyCode ?? "USD";

  return (
    <div className="max-w-page px-margin mx-auto w-full py-8">
      <div className="mb-6">
        <Breadcrumbs locale={locale} items={[{ label: content.search.title }]} />
      </div>

      <h1 className="type-display mb-6">{content.search.title}</h1>

      {/* Search header form — real GET /search so it works without JS (F4). */}
      <form
        action={href("/search")}
        method="get"
        role="search"
        className="mb-8 flex items-center gap-2"
      >
        <label htmlFor="search-q" className="sr-only">
          {content.search.label}
        </label>
        <input
          {...registerSearchField("query")}
          id="search-q"
          defaultValue={term}
          key={term}
          placeholder={content.search.placeholder}
          className="number-reset rounded-button border-border h-11 max-w-md border px-3 text-sm"
        />
        <button
          type="submit"
          className="rounded-button button-primary inline-flex h-11 items-center justify-center px-4 text-sm font-medium"
        >
          {content.search.submit}
        </button>
        {term ? (
          <Link
            href={href("/search")}
            className="text-on-surface-secondary hover:text-on-surface text-sm no-underline"
          >
            {content.search.clear}
          </Link>
        ) : null}
      </form>

      {!term ? null : products.length === 0 ? (
        <div className="py-12 text-center">
          <p className="type-body text-on-surface">
            {interpolate(content.search.noResults, { terms: `\u201c${term}\u201d` })}
          </p>
          <p className="text-on-surface-secondary mt-2 text-sm">
            {content.search.noResultsSuggestion}
          </p>
        </div>
      ) : (
        <form
          {...formProps()}
          method="get"
          action={href("/search")}
          className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8"
          key={`search-${term}`}
        >
          <input key="q" type="hidden" name="q" value={term} />

          {/* A SINGLE filter subtree (one set of inputs) so filter params are
              never duplicated. Desktop: `<summary>` hidden, `<details open>`
              shows groups as a static sidebar. Mobile: collapsible disclosure,
              reachable without JS (F4). */}
          <details
            key="filters"
            open
            className="lg:flex lg:flex-col lg:gap-6"
            aria-labelledby="search-filters-heading"
          >
            <summary className="marker-hidden rounded-button button-outline focus-visible:outline-accent min-h-touch-target mb-4 inline-flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden">
              {content.collection.filters}
            </summary>
            <div className="flex flex-col gap-6 lg:mb-0">
              <h2
                id="search-filters-heading"
                className="type-heading-sm text-on-surface font-medium"
              >
                {content.collection.filters}
              </h2>
              {availableFilters.map((filter) => (
                <FilterGroup
                  key={filter.id}
                  filter={filter}
                  activeFilters={state.filters}
                  isLoading={isLoading}
                  currencyCode={currencyCode}
                />
              ))}
            </div>
          </details>

          <div key="results" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <p className="type-body-sm text-on-surface-secondary" aria-live="polite">
                {interpolate(content.search.resultsFor, {
                  count: totalCount,
                  terms: `\u201c${term}\u201d`,
                })}
              </p>
              <SortSelect
                isLoading={isLoading}
                options={searchSortOptions(content.collection.sortOptions)}
              />
            </div>

            <ul
              role="list"
              className="grid grid-cols-2 gap-x-1 gap-y-10 contain-paint lg:grid-cols-3"
            >
              {products.map((product, index) => (
                <li key={product.id} className={isLoading ? "opacity-60" : ""}>
                  <ProductCard
                    product={product}
                    locale={locale}
                    loading={index < 3 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                </li>
              ))}
            </ul>

            {pageInfo.hasNextPage ? (
              <div className="mt-8 text-center">
                <Link
                  href={href(
                    `/search?q=${encodeURIComponent(term)}&after=${encodeURIComponent(pageInfo.endCursor ?? "")}`,
                  )}
                  onClick={onNavigate}
                  className="rounded-button button-outline inline-flex h-11 items-center justify-center px-5 text-sm font-medium no-underline"
                >
                  {content.search.loadMore}
                </Link>
              </div>
            ) : null}

            <noscript>
              <button type="submit" className="rounded-button button-primary h-11 px-4">
                {content.collection.showResults}
              </button>
            </noscript>
          </div>
        </form>
      )}
    </div>
  );
}

type SortOption = { label: string; value: string };

function SortSelect({ isLoading, options }: { isLoading: boolean; options: SortOption[] }) {
  const { content } = useI18n();
  const state = useCollection();
  const currentSort = state.sortKey
    ? getSortByValue(state.sortKey, state.reverse)
    : (options[0]?.value ?? "");

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-on-surface-secondary">{content.collection.sortBy}</span>
      <select
        name="sort_by"
        value={currentSort}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        aria-busy={isLoading}
        className="w-auto"
      >
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterSidebar({
  availableFilters,
  activeFilters,
  isLoading,
  currencyCode,
}: {
  availableFilters: BrowserAvailableFilter[];
  activeFilters: ProductFilter[];
  isLoading: boolean;
  currencyCode: string;
}) {
  const { content } = useI18n();
  if (availableFilters.length === 0) return null;

  const filterGroups = availableFilters.map((filter) => (
    <FilterGroup
      key={filter.id}
      filter={filter}
      activeFilters={activeFilters}
      isLoading={isLoading}
      currencyCode={currencyCode}
    />
  ));

  return (
    /* A SINGLE filter subtree rendered once inside the `method="get"` form so
       each filter input exists exactly once (no duplicate query params). On
       desktop (lg+) the `<summary>` is hidden and `<details open>` shows the
       groups as a static sidebar; on mobile the `<summary>` is visible and the
       disclosure is collapsible — reachable WITHOUT JS (F4). */
    <details
      open
      className="lg:flex lg:flex-col lg:gap-6"
      aria-labelledby="collection-filters-heading"
    >
      <summary className="marker-hidden rounded-button button-outline focus-visible:outline-accent min-h-touch-target mb-4 inline-flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden">
        <span aria-hidden="true"> {/* filter icon placeholder */} </span>
        {content.collection.filters}
      </summary>
      <div className="flex flex-col gap-6 lg:mb-0">
        <h2 id="collection-filters-heading" className="type-heading-sm text-on-surface font-medium">
          {content.collection.filters}
        </h2>
        {filterGroups}
      </div>
    </details>
  );
}

function ActiveFilterChips({
  activeFilters,
  collectionPath,
  onNavigate,
  currencyCode,
}: {
  activeFilters: ProductFilter[];
  collectionPath: string;
  onNavigate: () => void;
  currencyCode: string;
}) {
  const { content, tag } = useI18n();
  if (activeFilters.length === 0) return null;
  const describe = (filter: ProductFilter) => describeFilter(filter, content, tag, currencyCode);

  return (
    <ul role="list" className="flex flex-wrap gap-2">
      {activeFilters
        .filter((filter) => describe(filter) !== "")
        .map((filter, index) => {
          const currentParams = serializeCollectionParams({
            filters: activeFilters,
            sortKey: undefined,
            reverse: false,
          });
          const removal = getFilterRemovalUrl(currentParams, filter);
          const href = removal === "?" ? collectionPath : `${collectionPath}${removal}`;
          const filterLabel = describe(filter);
          return (
            <li key={`${filter.toString()}-${index}`}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-label={interpolate(content.collection.removeFilter, { filter: filterLabel })}
                className="chip-filled inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm no-underline"
              >
                <span aria-hidden="true">{filterLabel}</span>
                <span aria-hidden="true">×</span>
              </Link>
            </li>
          );
        })}
      <li>
        <Link
          href={collectionPath}
          onClick={onNavigate}
          className="text-link inline-flex items-center rounded-full px-3 py-1 text-sm no-underline underline"
        >
          {content.collection.clearAll}
        </Link>
      </li>
    </ul>
  );
}

function describeFilter(
  filter: ProductFilter,
  content: Content,
  tag: string,
  currencyCode = "USD",
): string {
  if (filter.available !== undefined)
    return filter.available ? content.collection.inStock : content.collection.outOfStock;
  if (filter.productType) return filter.productType;
  if (filter.productVendor) return filter.productVendor;
  if (filter.tag) return filter.tag;
  if (filter.variantOption) {
    const option = filter.variantOption;
    const value = option.value ?? option.name ?? "";
    return option.name && option.value ? `${option.name}: ${option.value}` : value;
  }
  if (filter.price) {
    const price = filter.price;
    const min = price.min;
    const max = price.max;
    const hasMin = min != null && Number(min) > 0;
    const hasMax = max != null;
    const format = (value: string | number) =>
      formatPrice({ amount: String(value), currencyCode }, tag);
    if (hasMin && hasMax && min != null && max != null)
      return `${format(min)} ${content.collection.priceTo} ${format(max)}`;
    if (hasMax && max != null) return interpolate(content.collection.priceUpTo, { price: format(max) });
    if (hasMin && min != null) return interpolate(content.collection.priceFrom, { price: format(min) });
    return content.collection.price;
  }
  return "";
}

/** Collection filters + sort as a query string, without the page cursor. */
function searchWithoutCursor(
  filters: ProductFilter[],
  sortKey: Parameters<typeof serializeCollectionParams>[0]["sortKey"],
  reverse: boolean,
): string {
  return serializeCollectionParams({ filters, sortKey, reverse }).toString();
}

/**
 * Previous/next page links. The Storefront API pages by cursor, so pages are
 * `?after=<endCursor>` (forward) and `?before=<startCursor>` (back), keeping
 * the active filters and sort.
 */
function Pagination({
  pageInfo,
  basePath,
  search,
  onNavigate,
  labels,
}: {
  pageInfo: PageInfo;
  basePath: string;
  search: string;
  onNavigate: () => void;
  labels: { previousPage: string; loadMore: string };
}) {
  if (!pageInfo.hasNextPage && !pageInfo.hasPreviousPage) return null;

  const pageHref = (cursorName: "after" | "before", cursor: string) => {
    const params = new URLSearchParams(search);
    params.set(cursorName, cursor);
    return `${basePath}?${params.toString()}`;
  };
  const linkClassName =
    "rounded-button button-outline focus-visible:outline-accent inline-flex h-11 items-center justify-center px-5 text-sm font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <nav className="mt-8 flex items-center justify-center gap-3">
      {pageInfo.hasPreviousPage && pageInfo.startCursor ? (
        <Link
          href={pageHref("before", pageInfo.startCursor)}
          onClick={onNavigate}
          rel="prev"
          className={linkClassName}
        >
          {labels.previousPage}
        </Link>
      ) : null}
      {pageInfo.hasNextPage && pageInfo.endCursor ? (
        <Link
          href={pageHref("after", pageInfo.endCursor)}
          onClick={onNavigate}
          rel="next"
          className={linkClassName}
        >
          {labels.loadMore}
        </Link>
      ) : null}
    </nav>
  );
}
