import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const STEPS = [
  { number: '01', titleKey: 'landing.stepOneTitle', bodyKey: 'landing.stepOneBody' },
  { number: '02', titleKey: 'landing.stepTwoTitle', bodyKey: 'landing.stepTwoBody' },
  { number: '03', titleKey: 'landing.stepThreeTitle', bodyKey: 'landing.stepThreeBody' },
];

export default function LandingHowItWorks() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="comment" ref={ref} className="relative overflow-hidden bg-[#0d1b2a] py-24 text-[#e0e1dd] lg:py-32">
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 max-w-3xl lg:mb-20">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-[#e0e1dd]/50">
            <span className="h-px w-8 bg-[#e0e1dd]/30" />
            {t('landing.processKicker')}
          </span>
          <h2
            className={`font-display text-4xl tracking-tight transition-all duration-700 lg:text-6xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {t('landing.howTitle')}
          </h2>
          <p className="mt-5 text-lg text-[#e0e1dd]/60 lg:text-xl">{t('landing.howBody')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className={`border border-[#e0e1dd]/15 p-8 transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <span className="mb-8 block font-mono text-sm text-[#e0e1dd]/40">{step.number}</span>
              <h3 className="mb-4 font-display text-2xl lg:text-3xl">{t(step.titleKey)}</h3>
              <p className="leading-relaxed text-[#e0e1dd]/65">{t(step.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
