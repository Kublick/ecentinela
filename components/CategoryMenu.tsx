"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { interpolate } from "@/lib/content";

import { useI18n } from "./I18nProvider";

type Category = { title: string; href: string; subcategories: { label: string; href: string }[] };

/**
 * Header "Categorías" menu: a disclosure button that opens on click or hover.
 * Inside, the categories form one tab stop (arrow keys move between them) and
 * only the highlighted category's subcategories are rendered, so one or two
 * Tabs leave the menu. Escape closes it and returns focus to the button.
 */
export function CategoryMenu({ categories }: { categories: Category[] }) {
  const { content } = useI18n();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // How the menu was opened: a click on the button after a hover-open keeps it
  // open instead of toggling it shut.
  const openedBy = useRef<"hover" | "click">("click");
  // After picking a link the pointer is still over the menu; don't reopen on
  // hover until it has left.
  const hoverLocked = useRef(false);
  const current = categories[active];

  // Close whenever the page changes (back/forward, links outside the menu).
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  function show(by: "hover" | "click") {
    clearTimeout(closeTimer.current);
    if (!open) openedBy.current = by;
    setOpen(true);
  }
  function close(returnFocus = false) {
    clearTimeout(closeTimer.current);
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }
  function pick() {
    close();
    hoverLocked.current = true;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }
  function focusItem(index: number) {
    const next = (index + categories.length) % categories.length;
    setActive(next);
    itemRefs.current[next]?.focus();
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const moves: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      Home: 0,
      End: categories.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    focusItem(moves[event.key]);
  }

  return (
    <div
      onMouseEnter={() => {
        if (!hoverLocked.current) show("hover");
      }}
      onMouseLeave={() => {
        hoverLocked.current = false;
        closeTimer.current = setTimeout(() => setOpen(false), 150);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) close(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          hoverLocked.current = false;
          if (open && openedBy.current === "click") close();
          else show("click");
          openedBy.current = "click";
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          show("click");
          requestAnimationFrame(() => focusItem(active));
        }}
        className="bg-secondary inline-flex h-12 cursor-pointer items-center gap-2 px-4 font-semibold text-white focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {content.header.categories}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="bg-surface text-on-surface border-border absolute inset-x-[var(--spacing-margin)] top-full z-50 grid max-h-[min(75vh,40rem)] grid-cols-[18rem_1fr] border shadow-lg"
      >
        <ul
          role="list"
          onKeyDown={onListKeyDown}
          className="border-border overflow-y-auto border-e bg-panel py-2"
        >
          {categories.map((category, index) => (
            <li key={category.href}>
              <Link
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                href={category.href}
                tabIndex={index === active ? 0 : -1}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={pick}
                className={`block px-5 py-1.5 text-sm no-underline ${
                  index === active
                    ? "text-primary-dark bg-white font-semibold shadow-[inset_3px_0_0_var(--color-secondary)]"
                    : "text-on-surface"
                }`}
              >
                {category.title}
              </Link>
            </li>
          ))}
        </ul>

        {current ? (
          <div className="overflow-y-auto px-8 py-6">
            <p className="mb-4 flex items-baseline justify-between gap-4">
              <span className="text-primary-dark text-lg font-bold">{current.title}</span>
              <Link
                href={current.href}
                onClick={pick}
                className="text-link text-sm font-semibold"
              >
                {interpolate(content.header.viewCategory, { title: current.title })} →
              </Link>
            </p>
            <ul role="list" className="columns-3 gap-6 text-sm">
              {current.subcategories.map((sub) => (
                <li key={sub.href} className="break-inside-avoid">
                  <Link
                    href={sub.href}
                    onClick={pick}
                    className="text-on-surface block py-1 no-underline hover:underline"
                  >
                    {sub.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
