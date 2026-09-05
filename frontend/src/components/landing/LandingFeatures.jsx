import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const FEATURES = [
  { icon: 'sell', titleKey: 'landing.feat1Title', bodyKey: 'landing.feat1Body' },
  { icon: 'add_circle', titleKey: 'landing.feat2Title', bodyKey: 'landing.feat2Body' },
  { icon: 'photo_camera', titleKey: 'landing.feat3Title', bodyKey: 'landing.feat3Body' },
  { icon: 'category', titleKey: 'landing.feat4Title', bodyKey: 'landing.feat4Body' },
  { icon: 'qr_code_2', titleKey: 'landing.feat5Title', bodyKey: 'landing.feat5Body' },
  { icon: 'smartphone', titleKey: 'landing.feat6Title', bodyKey: 'landing.feat6Body' },
];

export default function LandingFeatures() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.1);

  return (
    <section id="fonctionnalites" ref={ref} className="border-t border-on-surface/10 bg-[#0d1b2a] py-20 text-[#e0e1dd] lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#778da9] uppercase">{t('landing.featuresKicker')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.featuresTitle')}</h2>
          <p className="mt-4 text-lg text-[#778da9]">{t('landing.featuresBody')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.titleKey}
              className={`rounded-2xl border border-[#e0e1dd]/12 bg-[#1b263b]/50 p-6 transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <MaterialIcon name={feature.icon} className="text-[26px] text-[#778da9]" />
              <h3 className="mt-4 text-lg font-semibold">{t(feature.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#778da9]">{t(feature.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
