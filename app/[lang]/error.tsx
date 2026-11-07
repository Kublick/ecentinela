"use client";

import { useEffect } from "react";

import { useI18n } from "@/components/I18nProvider";
import { interpolate } from "@/lib/content";

/**
 * Global error boundary. Next.js renders this when a route
 * or layout throws. Must be a client component (`'use client'`) and render a
 * `<html>`/`<body>` shell when used as `app/global-error.tsx`; this segment
 * error boundary renders inside the existing root layout, so it only needs the
 * error UI + a `reset` button.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { content } = useI18n();
  useEffect(() => {
    console.error("[hydrogen-example-nextjs] Route error:", error);
  }, [error]);

  const message =
    typeof error?.message === "string" && error.message
      ? error.message
      : content.general.genericError;

  return (
    <div className="max-w-page px-margin mx-auto py-16">
      <h1 className="type-heading-xl mb-4">{content.general.errorTitle}</h1>
      <p className="type-body text-on-surface-secondary mb-2">{message}</p>
      {error.digest ? (
        <p className="text-on-surface-secondary mb-8 text-sm">
          {interpolate(content.general.errorDigest, { digest: error.digest })}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="rounded-button button-primary focus-visible:outline-focus inline-flex h-11 items-center justify-center px-5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {content.general.tryAgain}
      </button>
    </div>
  );
}
