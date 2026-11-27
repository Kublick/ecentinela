import type { Metadata } from "next";

import { QuickOrderForm } from "@/components/QuickOrderForm";
import { getContent } from "@/lib/content";
import { localeAlternates, localizePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/quick-order">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  return {
    title: content.quickOrder.title,
    description: content.quickOrder.description,
    alternates: localeAlternates(locale, "/quick-order"),
    openGraph: {
      title: content.quickOrder.title,
      type: "website",
      url: canonicalUrl(localizePath(locale, "/quick-order")),
    },
  };
}

/** Quick order by part number, ported from e-centinela.com/pages/quick-order. */
export default async function QuickOrderPage({ params }: PageProps<"/[lang]/quick-order">) {
  const content = getContent(await resolveLocale(params));
  return (
    <div className="max-w-page px-margin mx-auto w-full py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="type-display mb-3">{content.quickOrder.title}</h1>
        <p className="text-on-surface-secondary mb-8">{content.quickOrder.intro}</p>
        <QuickOrderForm />
      </div>
    </div>
  );
}
