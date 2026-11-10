import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RichTextPage } from "@/components/RichTextPage";
import { fetchPolicy } from "@/lib/content-pages";
import { localeAlternates, localizePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { canonicalUrl } from "@/lib/site";

type Props = PageProps<"/[lang]/policies/[handle]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { handle } = await params;
  const policy = await fetchPolicy(locale, handle);
  return {
    title: policy?.title,
    alternates: localeAlternates(locale, `/policies/${handle}`),
    openGraph: {
      title: policy?.title,
      url: canonicalUrl(localizePath(locale, `/policies/${handle}`)),
    },
  };
}

/** Shop policy (`/policies/<handle>`), the URLs Shopify uses for them. */
export default async function PolicyPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { handle } = await params;
  const policy = await fetchPolicy(locale, handle);
  if (!policy) notFound();
  return <RichTextPage locale={locale} title={policy.title} body={policy.body} />;
}
