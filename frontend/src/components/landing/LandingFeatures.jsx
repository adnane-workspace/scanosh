import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const FEATURES = [
  { number: '01', titleKey: 'landing.feat1Title', bodyKey: 'landing.feat1Body' },
  { number: '02', titleKey: 'landing.feat3Title', bodyKey: 'landing.feat3Body' },
  { number: '03', titleKey: 'landing.feat4Title', bodyKey: 'landing.feat4Body' },
];

export default function LandingFeatures() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.1);

  return (
    <section id="fonctionnalites" ref={ref} className="relative border-t border-on-surface/10 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-on-surface-variant">
            <span className="h-px w-8 bg-on-surface/30" />
            {t('landing.featuresKicker')}
          </span>
          <h2
            className={`font-display text-4xl tracking-tight transition-all duration-700 lg:text-6xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {t('landing.featuresTitle')}
            <br />
            <span className="text-on-surface-variant">{t('landing.featuresTitleMuted')}</span>
          </h2>
        </div>

        <div className="border-t border-on-surface/10">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.number}
              className={`group border-b border-on-surface/10 py-10 transition-all duration-700 lg:py-14 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-16">
                <span className="shrink-0 font-mono text-sm text-on-surface-variant">{feature.number}</span>
                <div className="max-w-3xl">
                  <h3 className="mb-3 font-display text-3xl transition-transform duration-500 group-hover:translate-x-2 lg:text-4xl rtl:group-hover:-translate-x-2">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-lg leading-relaxed text-on-surface-variant">{t(feature.bodyKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
