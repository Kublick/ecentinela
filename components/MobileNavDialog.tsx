"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "./I18nProvider";
import { CurrencySwitch } from "./CurrencyProvider";
import { LanguageSwitch } from "./LanguageSwitch";

/**
 * Mobile nav — a `<dialog>` opened via state, with an always-rendered fallback
 * link list (F4). The hamburger button is the client trigger; the dialog
 * contains the same nav items as the desktop nav. Server-rendered baseline is
 * the hidden dialog content (links are real `<Link>`s).
 */
export function MobileNavDialog({
  categories,
  allHref,
}: {
  categories: { title: string; href: string }[];
  allHref: string;
}) {
  const { content } = useI18n();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <div className="-ms-2 hidden max-md:block">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="button-icon focus-visible:outline-focus inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={content.header.menu}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
      >
        <img
          src="/icons/icon-menu.svg"
          width="20"
          height="20"
          alt=""
          className="size-5 invert"
          aria-hidden="true"
        />
      </button>
      <dialog
        ref={dialogRef}
        id="mobile-nav-drawer"
        className="drawer-left bg-surface text-on-surface"
        aria-labelledby="mobile-nav-title"
        onClose={() => setOpen(false)}
      >
        <div className="flex h-full flex-col">
          <div className="relative flex min-h-[52px] shrink-0 items-center px-4 py-1">
            <span
              className="text-on-surface pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-medium"
              id="mobile-nav-title"
            >
              {content.header.mobileNavigation}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="button-icon focus-visible:outline-focus ms-auto inline-flex h-11 w-11 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label={content.general.close}
            >
              <img
                src="/icons/icon-x.svg"
                width="20"
                height="20"
                alt=""
                className="size-5"
                aria-hidden="true"
              />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <nav aria-label={content.header.mobileNavigation}>
              <p className="text-primary-dark mb-2 font-bold">{content.header.categories}</p>
              <ul role="list" className="flex flex-col">
                {categories.map((category) => (
                  <li key={category.href}>
                    <Link
                      href={category.href}
                      onClick={() => setOpen(false)}
                      className="text-on-surface border-border flex min-h-11 items-center border-b py-2 no-underline hover:opacity-70"
                    >
                      {category.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={allHref}
                onClick={() => setOpen(false)}
                className="text-link mt-4 inline-flex min-h-11 items-center font-semibold"
              >
                {content.header.allCategories}
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <LanguageSwitch />
                <CurrencySwitch />
              </div>
            </nav>
          </div>
        </div>
      </dialog>
    </div>
  );
}
