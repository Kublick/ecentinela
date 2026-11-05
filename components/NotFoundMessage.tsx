"use client";

import Link from "next/link";

import { useI18n } from "./I18nProvider";

/**
 * 404 copy. `not-found.tsx` receives no route params, so the locale comes from
 * the `I18nProvider` the `[lang]` layout renders around it.
 */
export function NotFoundMessage() {
  const { content, href } = useI18n();
  return (
    <>
      <h1 className="type-display mb-4">{content.notFound.title}</h1>
      <p className="type-body text-on-surface-secondary mb-8">{content.notFound.body}</p>
      <Link
        href={href("/")}
        className="rounded-button button-primary inline-flex h-11 items-center justify-center px-5 text-sm font-medium no-underline"
      >
        {content.notFound.backHome}
      </Link>
    </>
  );
}
