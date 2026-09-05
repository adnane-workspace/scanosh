import { useState } from 'react';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const FAQS = [
  { q: 'landing.faq1Q', a: 'landing.faq1A' },
  { q: 'landing.faq2Q', a: 'landing.faq2A' },
  { q: 'landing.faq3Q', a: 'landing.faq3A' },
  { q: 'landing.faq4Q', a: 'landing.faq4A' },
  { q: 'landing.faq5Q', a: 'landing.faq5A' },
  { q: 'landing.faq6Q', a: 'landing.faq6A' },
];

export default function LandingFaq() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.1);
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" ref={ref} className="border-t border-on-surface/10 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-12">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">{t('landing.faqKicker')}</p>
          <h2
            className={`font-display text-3xl font-bold tracking-tight transition-all duration-700 lg:text-4xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {t('landing.faqTitle')}
          </h2>
        </div>
        <div className="divide-y divide-on-surface/10 rounded-3xl border border-on-surface/10 bg-surface-container-lowest">
          {FAQS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q} className="px-5 sm:px-6">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-5 text-start"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span className="font-semibold lg:text-lg">{t(item.q)}</span>
                  <MaterialIcon name={isOpen ? 'expand_less' : 'expand_more'} className="shrink-0" />
                </button>
                {isOpen ? <p className="pb-5 leading-relaxed text-on-surface-variant">{t(item.a)}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
