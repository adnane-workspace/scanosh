import AppLink from '../components/common/AppLink.jsx';
import DemoMenuLink from '../components/common/DemoMenuLink.jsx';
import DocumentHead from '../components/seo/DocumentHead.jsx';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs.jsx';
import SeoCta from '../components/seo/SeoCta.jsx';
import MarketingLayout from '../layouts/MarketingLayout.jsx';
import { resolveSeoPage } from '../content/seo/index.js';
import { useLocale } from '../hooks/useLocale.js';
import { breadcrumbJsonLd, faqJsonLd, organizationJsonLd, softwareJsonLd } from '../utils/seoJsonLd.js';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';

export default function PricingPage() {
  const { locale, t } = useLocale();
  const page = resolveSeoPage('/tarifs', locale);
  const jsonLd = [organizationJsonLd(), softwareJsonLd(page.description), breadcrumbJsonLd(page.breadcrumbs), faqJsonLd(page.faq)].filter(
    Boolean,
  );

  return (
    <MarketingLayout>
      <DocumentHead title={page.title} description={page.description} path="/tarifs" jsonLd={jsonLd} />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <SeoBreadcrumbs items={page.breadcrumbs} />
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{page.h1}</h1>
        <p className="mt-6 text-lg leading-relaxed text-on-surface">{page.answer}</p>

        <div className="mt-10 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8">
          <p className="text-label-md font-semibold tracking-[0.14em] text-primary uppercase">{t('landing.pricingBadge')}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">{t('landing.pricingPlan')}</h2>
          <p className="mt-2 text-3xl font-semibold text-on-surface">{t('landing.pricingFree')}</p>
          <ul className="mt-6 space-y-3 text-on-surface-variant">
            {page.sections[0].items.map((item) => (
              <li key={item} className="flex gap-2">
                <MaterialIcon name="check_circle" className="text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <AppLink
              to="/register"
              className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              {t('landing.ctaStart')}
            </AppLink>
            <DemoMenuLink
              className="inline-flex rounded-xl border border-outline-variant px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container"
            >
              {t('landing.ctaTrial')}
            </DemoMenuLink>
          </div>
        </div>

        {page.sections.slice(1).map((section) => (
          <section key={section.h2} className="mt-10">
            <h2 className="font-display text-2xl font-semibold">{section.h2}</h2>
            <p className="mt-3 leading-relaxed text-on-surface-variant">{section.body}</p>
          </section>
        ))}

        {page.faq.length ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold">{t('landing.seoFaq')}</h2>
            <div className="mt-4 divide-y divide-outline-variant/30 rounded-2xl border border-outline-variant/30">
              {page.faq.map((item) => (
                <details key={item.q} className="px-4 py-3">
                  <summary className="cursor-pointer font-semibold">{item.q}</summary>
                  <p className="mt-2 text-sm text-on-surface-variant">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <SeoCta title={page.ctaTitle} body={page.ctaBody} />
      </article>
    </MarketingLayout>
  );
}
