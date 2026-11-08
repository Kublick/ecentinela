"use client";

import { useId, useState, type FormEvent } from "react";

import { addLinesToCart, useCart } from "@/lib/cart";
import { openCartDrawer } from "@/lib/cart-drawer";
import { interpolate, plural } from "@/lib/content";
import { lookUpPartNumbers } from "@/lib/quick-order-lookup";

import { useI18n } from "./I18nProvider";

type Row = { key: number; code: string; quantity: string; error?: string };

const INITIAL_ROWS = 10;
let nextKey = 0;
const emptyRow = (): Row => ({ key: nextKey++, code: "", quantity: "1" });

/**
 * Quick order (live site's /pages/quick-order): type part numbers and
 * quantities, then one button looks every code up and adds all the found,
 * in-stock lines in a single `addLinesToCart` call. Rows that fail keep their
 * code and show why; the rest still go to the cart.
 */
export function QuickOrderForm() {
  const { locale, content } = useI18n();
  const copy = content.quickOrder;
  const statusId = useId();
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: INITIAL_ROWS }, emptyRow));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ error: boolean; message: string } | null>(null);
  const loading = useCart((state) => state.loading);
  const readyPromise = useCart((state) => state.readyPromise);

  function update(key: number, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch, error: undefined } : row)),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const filled = rows.filter((row) => row.code.trim());
    if (filled.length === 0) {
      setStatus({ error: true, message: copy.empty });
      return;
    }

    setBusy(true);
    setStatus(null);
    let found;
    try {
      found = await lookUpPartNumbers(
        locale,
        filled.map((row) => row.code),
      );
    } catch (error) {
      console.error(error);
      setBusy(false);
      setStatus({ error: true, message: copy.lookupError });
      return;
    }

    const errors = new Map<number, string>();
    const lines = new Map<string, Parameters<typeof addLinesToCart>[0][number]>();
    filled.forEach((row, index) => {
      const match = found[index];
      if (!match) return void errors.set(row.key, copy.notFound);
      if (!match.variant.availableForSale) return void errors.set(row.key, copy.soldOut);
      const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1));
      const existing = lines.get(match.variant.id);
      // The same part typed twice becomes one line with both quantities.
      if (existing) existing.quantity += quantity;
      else lines.set(match.variant.id, { ...match, quantity });
    });

    let cartError: string | null = null;
    if (lines.size > 0) {
      cartError = await addLinesToCart(
        [...lines.values()],
        { loading, readyPromise },
        content.collection.table,
      );
    }
    setBusy(false);

    const added = lines.size > 0 && !cartError;
    // Added rows clear; failed rows keep their code and error.
    setRows((current) => {
      const next = current.flatMap((row) => {
        if (errors.has(row.key)) return [{ ...row, error: errors.get(row.key) }];
        return added && filled.includes(row) ? [] : [row];
      });
      return [...next, ...Array.from({ length: Math.max(0, INITIAL_ROWS - next.length) }, emptyRow)];
    });

    const messages = [
      cartError ?? (added ? plural(content.collection.table.added, lines.size) : null),
      errors.size > 0 ? plural(copy.rowErrors, errors.size) : null,
    ].filter(Boolean);
    setStatus({ error: Boolean(cartError) || errors.size > 0, message: messages.join(" ") });
    if (added) openCartDrawer();
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="grid gap-4">
      <div
        aria-hidden="true"
        className="text-on-surface-secondary grid grid-cols-[2rem_1fr_6rem] gap-3 text-sm font-semibold sm:grid-cols-[2rem_1fr_8rem]"
      >
        <span>#</span>
        <span>{copy.partNumber}</span>
        <span>{copy.quantity}</span>
      </div>
      <ol className="grid gap-3">
        {rows.map((row, index) => {
          const errorId = `${statusId}-row-${row.key}`;
          const values = { row: index + 1 };
          return (
            <li key={row.key} className="grid grid-cols-[2rem_1fr_6rem] items-start gap-3 sm:grid-cols-[2rem_1fr_8rem]">
              <span className="text-on-surface-secondary pt-3 text-sm tabular-nums">{index + 1}</span>
              <div className="grid gap-1">
                <input
                  type="text"
                  value={row.code}
                  onChange={(event) => update(row.key, { code: event.target.value })}
                  aria-label={interpolate(copy.partNumberRow, values)}
                  aria-invalid={row.error ? true : undefined}
                  aria-describedby={row.error ? errorId : undefined}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="border-border bg-surface aria-invalid:border-sale h-11 w-full rounded border px-3 uppercase"
                />
                {row.error ? (
                  <p id={errorId} className="text-sale text-sm">
                    {row.error}
                  </p>
                ) : null}
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={row.quantity}
                onChange={(event) => update(row.key, { quantity: event.target.value })}
                aria-label={interpolate(copy.quantityRow, values)}
                className="border-border bg-surface h-11 w-full rounded border px-3 tabular-nums"
              />
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setRows((current) => [...current, emptyRow()])}
          className="rounded-button border-border inline-flex h-11 items-center justify-center border px-5 text-sm font-semibold hover:bg-surface-secondary"
        >
          {copy.addRow}
        </button>
        <button
          type="submit"
          aria-disabled={busy}
          aria-describedby={status ? statusId : undefined}
          className="rounded-button bg-lime text-primary-dark inline-flex h-11 items-center justify-center px-6 text-sm font-bold hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:opacity-60"
        >
          {busy ? copy.adding : copy.submit}
        </button>
      </div>
      <p
        id={statusId}
        role="status"
        className={status?.error ? "text-sale text-sm font-semibold" : "text-sm font-semibold"}
      >
        {status?.message}
      </p>
    </form>
  );
}
