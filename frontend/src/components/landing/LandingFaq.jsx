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
];

export default function LandingFaq() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" ref={ref} className="relative border-t border-on-surface/10 py-24 lg:py-32">
      <div className="mx-auto max-w-[900px] px-6 lg:px-12">
        <div className="mb-12 text-center lg:mb-16">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-on-surface-variant">
            <span className="h-px w-8 bg-on-surface/30" />
            {t('landing.faqKicker')}
            <span className="h-px w-8 bg-on-surface/30" />
          </span>
          <h2
            className={`font-display text-4xl tracking-tight transition-all duration-700 lg:text-5xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {t('landing.faqTitle')}
          </h2>
        </div>

        <div className="border-t border-on-surface/10">
          {FAQS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q} className="border-b border-on-surface/10">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-5 text-start"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span className="text-lg font-medium lg:text-xl">{t(item.q)}</span>
                  <MaterialIcon name={isOpen ? 'remove' : 'add'} className="shrink-0 text-[22px]" />
                </button>
                {isOpen ? (
                  <p className="pb-6 leading-relaxed text-on-surface-variant">{t(item.a)}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
