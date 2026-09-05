import { useState } from 'react';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const TABS = [
  {
    key: 'starters',
    labelKey: 'landing.phoneStarters',
    items: [
      { nameKey: 'landing.dishOne', descKey: 'landing.dishOneDesc', price: '85 DH', image: '/landing/ceviche.jpg' },
      { nameKey: 'landing.dishTwo', descKey: 'landing.dishTwoDesc', price: '120 DH', image: '/landing/dessert.jpg' },
    ],
  },
  {
    key: 'mains',
    labelKey: 'landing.phoneMains',
    items: [
      { nameKey: 'landing.demoDish3', descKey: 'landing.demoDish3Desc', price: '95 DH', image: '/landing/hero.jpg' },
      { nameKey: 'landing.dishOne', descKey: 'landing.dishOneDesc', price: '85 DH', image: '/landing/ceviche.jpg' },
    ],
  },
  {
    key: 'desserts',
    labelKey: 'landing.phoneDesserts',
    items: [
      { nameKey: 'landing.dishTwo', descKey: 'landing.dishTwoDesc', price: '120 DH', image: '/landing/dessert.jpg' },
      { nameKey: 'landing.demoDish4', descKey: 'landing.demoDish4Desc', price: '45 DH', image: '/landing/dessert.jpg' },
    ],
  },
];

export default function LandingDemo() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);
  const [tabIndex, setTabIndex] = useState(0);
  const tab = TABS[tabIndex];

  return (
    <section id="demo" ref={ref} className="relative overflow-hidden border-t border-on-surface/10 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 max-w-2xl lg:mb-20">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-on-surface-variant">
            <span className="h-px w-8 bg-on-surface/30" />
            {t('landing.demoKicker')}
          </span>
          <h2
            className={`font-display text-4xl tracking-tight transition-all duration-700 lg:text-6xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {t('landing.demoTitle')}
          </h2>
          <p className="mt-5 text-lg text-on-surface-variant lg:text-xl">{t('landing.demoBody')}</p>
        </div>

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center lg:gap-20">
          <div
            className={`relative transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <div className="relative h-[480px] w-[240px] overflow-hidden rounded-[32px] border-[6px] border-[#0d1b2a] bg-[#0d1b2a] shadow-2xl sm:h-[560px] sm:w-[280px] sm:rounded-[40px] sm:border-[8px]">
              <div className="relative h-36 w-full sm:h-44">
                <img src="/landing/dessert.jpg" alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a] to-transparent" />
              </div>
              <div className="relative z-10 -mt-8 flex flex-col gap-3 px-4 pb-5 sm:gap-4 sm:px-5 sm:pb-6">
                <div>
                  <h4 className="font-display text-xl text-[#e0e1dd] sm:text-2xl">{t('landing.phoneMenu')}</h4>
                  <p className="text-label-md text-[#778da9]">{t('landing.phoneCourse')}</p>
                </div>
                <div className="flex gap-2 border-b border-[#1b263b] pb-2">
                  {TABS.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTabIndex(index)}
                      className={`rounded-md px-2 py-1 text-xs whitespace-nowrap transition-colors ${
                        index === tabIndex ? 'bg-[#e0e1dd]/10 font-semibold text-[#e0e1dd]' : 'text-[#415a77]'
                      }`}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
                <div className="space-y-4 overflow-y-auto">
                  {tab.items.map((dish) => (
                    <div key={`${tab.key}-${dish.nameKey}`} className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="mb-1 text-sm font-semibold text-[#e0e1dd]">{t(dish.nameKey)}</h5>
                        <p className="line-clamp-2 text-xs text-[#778da9]">{t(dish.descKey)}</p>
                        <span className="mt-2 block text-sm font-bold text-[#e0e1dd]">{dish.price}</span>
                      </div>
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                        <img src={dish.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-6 text-center font-mono text-xs text-on-surface-variant">{t('landing.demoHint')}</p>
          </div>

          <div
            className={`max-w-md space-y-6 transition-all delay-150 duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <h3 className="font-display text-3xl lg:text-4xl">{t('landing.demoSideTitle')}</h3>
            <p className="text-lg leading-relaxed text-on-surface-variant">{t('landing.demoSideBody')}</p>
            <ul className="space-y-3 text-on-surface-variant">
              <li className="flex gap-3">
                <span className="font-mono text-sm text-on-surface">01</span>
                {t('landing.demoPoint1')}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-sm text-on-surface">02</span>
                {t('landing.demoPoint2')}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-sm text-on-surface">03</span>
                {t('landing.demoPoint3')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
