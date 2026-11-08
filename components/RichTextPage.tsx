import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Locale } from "@/lib/i18n";

/**
 * Store-authored content (Online Store pages and shop policies). `body` is the
 * merchant's HTML from the Storefront API, rendered as-is like collection
 * descriptions.
 */
export function RichTextPage({
  locale,
  title,
  body,
}: {
  locale: Locale;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-page px-margin mx-auto w-full py-8">
      <div className="mb-4">
        <Breadcrumbs locale={locale} items={[{ label: title }]} />
      </div>
      <h1 className="text-primary-dark mb-6 text-3xl font-bold">{title}</h1>
      <div className="richtext max-w-prose" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}
