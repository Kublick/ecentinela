"use client";

import { useSearchParams } from "next/navigation";

/** Header search field, prefilled with the current `?q=` so a results page keeps the query. */
export function HeaderSearchInput({ placeholder }: { placeholder: string }) {
  const q = useSearchParams().get("q") ?? "";
  return <SearchField key={q} placeholder={placeholder} defaultValue={q} />;
}

/** The same field without the query, for the server render before hydration. */
export function SearchField({
  placeholder,
  defaultValue,
}: {
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <input
      id="header-search-q"
      name="q"
      type="search"
      autoComplete="off"
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="h-11 rounded-e-none border-0 text-base"
    />
  );
}
