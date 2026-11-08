import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { RichTextPage } from "@/components/RichTextPage";
import { fetchPage, fetchPolicy } from "@/lib/content-pages";
import { localeAlternates, localizePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { canonicalUrl } from "@/lib/site";

type Props = PageProps<"/[lang]/pages/[handle]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { handle } = await params;
  const page = await fetchPage(locale, handle);
  const title = page?.seo?.title || page?.title;
  const description = page?.seo?.description ?? undefined;
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/pages/${handle}`),
    openGraph: { title, description, url: canonicalUrl(localizePath(locale, `/pages/${handle}`)) },
  };
}

/**
 * Online Store page (`/pages/<handle>`), as on e-centinela.com: `nosotros`
 * (about us), `about-us` (terms of purchase), `privacy-policy`. A page handle
 * that is only a shop policy (`/pages/privacy-policy` on a store without that
 * page) goes to the policy instead of a 404.
 */
export default async function ContentPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { handle } = await params;
  const page = await fetchPage(locale, handle);
  if (!page) {
    if (await fetchPolicy(locale, handle)) redirect(localizePath(locale, `/policies/${handle}`));
    notFound();
  }
  return <RichTextPage locale={locale} title={page.title} body={page.body} />;
}
