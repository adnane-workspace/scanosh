import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const STEPS = [
  { icon: 'door_front', titleKey: 'landing.journey1Title', bodyKey: 'landing.journey1Body' },
  { icon: 'qr_code_scanner', titleKey: 'landing.journey2Title', bodyKey: 'landing.journey2Body' },
  { icon: 'menu_book', titleKey: 'landing.journey3Title', bodyKey: 'landing.journey3Body' },
  { icon: 'restaurant_menu', titleKey: 'landing.journey4Title', bodyKey: 'landing.journey4Body' },
];

export default function LandingJourney() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="experience" ref={ref} className="border-t border-on-surface/10 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">{t('landing.journeyKicker')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.journeyTitle')}</h2>
          <p className="mt-4 text-lg text-on-surface-variant">{t('landing.journeyBody')}</p>
        </div>
        <div className="relative grid gap-6 md:grid-cols-4">
          <div className="pointer-events-none absolute top-10 start-8 end-8 hidden h-px bg-on-surface/10 md:block" />
          {STEPS.map((step, index) => (
            <div
              key={step.titleKey}
              className={`relative transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border border-on-surface/10 bg-background text-primary shadow-sm">
                <MaterialIcon name={step.icon} />
              </span>
              <h3 className="mt-5 font-bold">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{t(step.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
