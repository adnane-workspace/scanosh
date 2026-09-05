import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const AUDIENCES = [
  { icon: 'local_cafe', titleKey: 'landing.audienceCafeTitle', bodyKey: 'landing.audienceCafeBody', image: '/landing/dessert.jpg' },
  { icon: 'restaurant', titleKey: 'landing.audienceRestTitle', bodyKey: 'landing.audienceRestBody', image: '/landing/ceviche.jpg' },
  { icon: 'lunch_dining', titleKey: 'landing.audienceSnackTitle', bodyKey: 'landing.audienceSnackBody', image: '/landing/hero.jpg' },
];

export default function LandingAudience() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="pour-qui" ref={ref} className="border-t border-on-surface/10 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">{t('landing.audienceKicker')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.audienceTitle')}</h2>
          <p className="mt-4 text-lg text-on-surface-variant">{t('landing.audienceBody')}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((item, index) => (
            <article
              key={item.titleKey}
              className={`overflow-hidden rounded-3xl border border-on-surface/10 bg-surface-container-lowest transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="relative h-40 overflow-hidden">
                <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/75 to-transparent" />
                <span className="absolute bottom-3 start-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e0e1dd] text-[#0d1b2a]">
                  <MaterialIcon name={item.icon} className="text-[20px]" />
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold">{t(item.titleKey)}</h3>
                <p className="mt-2 text-on-surface-variant">{t(item.bodyKey)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
