import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactForm } from "@/components/ContactForm";
import { CONTACT_EMAIL } from "@/lib/contact";
import { getContent } from "@/lib/content";
import { localeAlternates, localizePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pages/contact">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const content = getContent(locale);
  return {
    title: content.contact.title,
    description: content.contact.intro,
    alternates: localeAlternates(locale, "/pages/contact"),
    openGraph: {
      title: content.contact.title,
      url: canonicalUrl(localizePath(locale, "/pages/contact")),
    },
  };
}

/** Contact page (`/pages/contact`, the live e-centinela.com URL). */
export default async function ContactPage({ params }: PageProps<"/[lang]/pages/contact">) {
  const locale = await resolveLocale(params);
  const content = getContent(locale);

  return (
    <div className="max-w-page px-margin mx-auto w-full py-8">
      <div className="mb-4">
        <Breadcrumbs locale={locale} items={[{ label: content.contact.title }]} />
      </div>
      <h1 className="text-primary-dark text-3xl font-bold">{content.contact.title}</h1>
      <p className="text-on-surface-secondary mt-2 mb-8 max-w-prose">{content.contact.intro}</p>

      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <dl className="flex flex-col gap-4 text-sm">
          <div>
            <dt className="text-primary-dark font-bold">{content.contact.phone}</dt>
            <dd>
              <a
                href={content.header.phoneHref}
                className="text-link inline-flex min-h-11 items-center font-semibold md:min-h-6"
              >
                {content.header.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-primary-dark font-bold">{content.contact.email}</dt>
            <dd>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-link inline-flex min-h-11 items-center break-all md:min-h-6"
              >
                {CONTACT_EMAIL}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-primary-dark font-bold">{content.contact.address}</dt>
            <dd className="text-on-surface-secondary">{content.footer.address}</dd>
          </div>
        </dl>
        <ContactForm />
      </div>
    </div>
  );
}
