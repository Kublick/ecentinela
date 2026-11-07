"use client";

import type { MoneyV2 } from "@shopify/hydrogen";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

import { interpolate } from "@/lib/content";
import { convertMoney, DISPLAY_CURRENCIES, type Rates } from "@/lib/currency";
import { formatPrice, isPriceOnRequest } from "@/lib/money";

import { useI18n } from "./I18nProvider";

const STORAGE_KEY = "display-currency";
const CHANGE_EVENT = "display-currency-change";

type CurrencyConfig = {
  /** Store currency: what checkout charges. */
  base: string;
  rates: Rates;
};

const CurrencyContext = createContext<CurrencyConfig>({ base: "USD", rates: {} });

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Display-only currency conversion, like the converter on e-centinela.com.
 * Provides the store currency and rates; the shopper's choice lives in
 * localStorage, so the server render shows the store currency and each price
 * switches after hydration.
 */
export function CurrencyProvider({
  base,
  rates,
  children,
}: {
  base: string;
  rates: Rates;
  children: ReactNode;
}) {
  return <CurrencyContext value={{ base, rates }}>{children}</CurrencyContext>;
}

/**
 * Read in each consumer rather than the provider: components that hydrate
 * later (inside Suspense) must also start from the server snapshot.
 */
export function useCurrency(): CurrencyConfig & { currency: string } {
  const { base, rates } = useContext(CurrencyContext);
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  return { base, rates, currency: stored && rates[stored] ? stored : base };
}

/** A Shopify amount in the shopper's display currency; "≈" marks a converted amount, placeholders read "Price on request". */
export function Price({ money }: { money: MoneyV2 }) {
  const { tag, content } = useI18n();
  const { currency, rates } = useCurrency();
  if (isPriceOnRequest(money)) return content.product.priceOnRequest;
  const target = DISPLAY_CURRENCIES.find((code) => code === currency);
  const converted = target ? convertMoney(money, target, rates) : null;
  return converted ? `≈ ${formatPrice(converted, tag)}` : formatPrice(money, tag);
}

/** "Amounts are approximate; the order is charged in USD", shown only while converting. */
export function ConvertedPriceNote({ className }: { className?: string }) {
  const { content } = useI18n();
  const { base, currency } = useCurrency();
  if (currency === base) return null;
  return (
    <p className={className}>{interpolate(content.currency.note, { currency, base })}</p>
  );
}

/** Flag plus native select; hidden when rates couldn't be loaded. */
export function CurrencySwitch({ className = "" }: { className?: string }) {
  const { content } = useI18n();
  const { currency, rates } = useCurrency();
  const options = DISPLAY_CURRENCIES.filter((code) => rates[code]);
  if (options.length < 2) return null;

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <img
        src={`/flags/${currency.toLowerCase()}.svg`}
        alt=""
        width={21}
        height={14}
        className="rounded-[2px] ring-1 ring-black/15"
      />
      <select
        aria-label={content.currency.label}
        value={currency}
        onChange={(event) => {
          try {
            localStorage.setItem(STORAGE_KEY, event.target.value);
          } catch {
            // Private mode: the choice just won't stick.
          }
          window.dispatchEvent(new Event(CHANGE_EVENT));
        }}
        className="h-11 w-auto cursor-pointer border-0 bg-transparent py-0 ps-1 pe-6 text-sm text-inherit focus-visible:outline-current [&_option]:text-black"
      >
        {options.map((code) => (
          <option key={code} value={code}>
            {content.currency.names[code]}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="pointer-events-none absolute end-1 size-3"
        aria-hidden="true"
      >
        <path d="M3 4.5l3 3 3-3" />
      </svg>
    </div>
  );
}
