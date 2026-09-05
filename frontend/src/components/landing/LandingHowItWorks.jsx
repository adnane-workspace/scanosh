import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const STEPS = [
  { number: '01', titleKey: 'landing.step1Title', bodyKey: 'landing.step1Body' },
  { number: '02', titleKey: 'landing.step2Title', bodyKey: 'landing.step2Body' },
  { number: '03', titleKey: 'landing.step3Title', bodyKey: 'landing.step3Body' },
  { number: '04', titleKey: 'landing.step4Title', bodyKey: 'landing.step4Body' },
];

export default function LandingHowItWorks() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="comment" ref={ref} className="border-t border-on-surface/10 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">{t('landing.howKicker')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.howTitle')}</h2>
          <p className="mt-4 text-lg text-on-surface-variant">{t('landing.howBody')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className={`rounded-3xl border border-on-surface/10 bg-surface-container-lowest p-6 transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <span className="font-display text-4xl font-bold text-on-surface/15">{step.number}</span>
              <h3 className="mt-6 text-lg font-bold">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t(step.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
