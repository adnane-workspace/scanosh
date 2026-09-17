import { useState } from 'react';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const FAQS = [
  { q: 'landing.faq1Q', a: 'landing.faq1A' },
  { q: 'landing.faq2Q', a: 'landing.faq2A' },
  { q: 'landing.faq5Q', a: 'landing.faq5A' },
  { q: 'landing.faq6Q', a: 'landing.faq6A' },
];

export default function LandingFaq() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.1);
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" ref={ref} className="bg-[#0d1b2a] pb-12 text-[#e0e1dd] sm:pb-16 lg:pb-20">
      <div className="mx-auto grid max-w-[1400px] gap-5 px-4 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16 lg:px-12">
        <h2
          className={`font-display text-[1.65rem] font-bold tracking-tight text-white sm:text-3xl lg:sticky lg:top-28 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } transition-all duration-700`}
        >
          {t('landing.faqTitle')}
        </h2>
        <div className="divide-y divide-white/10 rounded-[1.25rem] border border-white/10 bg-white/[0.04] sm:rounded-2xl">
          {FAQS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q} className="px-3.5 sm:px-5">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between gap-3 py-3.5 text-start sm:gap-4 sm:py-5"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span className="text-[0.95rem] font-semibold leading-snug text-white sm:text-base">{t(item.q)}</span>
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70">
                    <MaterialIcon name={isOpen ? 'remove' : 'add'} className="text-[18px]" />
                  </span>
                </button>
                {isOpen ? <p className="pb-4 text-sm leading-relaxed text-white/55 sm:pb-5">{t(item.a)}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
