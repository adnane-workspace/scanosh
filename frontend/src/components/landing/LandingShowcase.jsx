import { useState } from 'react';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const TABS = [
  { key: 'menu', labelKey: 'landing.showTabMenu' },
  { key: 'dashboard', labelKey: 'landing.showTabDash' },
  { key: 'products', labelKey: 'landing.showTabProducts' },
  { key: 'qr', labelKey: 'landing.showTabQr' },
];

export default function LandingShowcase() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.1);
  const [tab, setTab] = useState('menu');

  return (
    <section id="produit" ref={ref} className="bg-[#0d1b2a] pb-16 lg:pb-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-12">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#e8e6e1] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-4 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pt-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0d1b2a] sm:text-3xl">{t('landing.showcaseTitle')}</h2>
            <div className="flex flex-wrap gap-1 rounded-full bg-[#0d1b2a]/8 p-1">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                    tab === item.key ? 'bg-[#0d1b2a] text-[#e0e1dd]' : 'text-[#0d1b2a]/60 hover:text-[#0d1b2a]'
                  }`}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`px-5 pb-6 pt-5 transition-all duration-700 sm:px-7 sm:pb-8 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {tab === 'menu' ? (
              <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
                <div className="mx-auto w-[210px] overflow-hidden rounded-[1.7rem] bg-[#0d1b2a] shadow-xl sm:w-[230px]">
                  <img src="/landing/pepperoni.jpg" alt="" className="h-36 w-full object-cover" />
                  <div className="space-y-3 p-4">
                    <p className="font-display text-base font-bold text-[#e0e1dd]">{t('landing.phoneMenu')}</p>
                    {[
                      { name: t('landing.dishOne'), meta: t('landing.dishOneDesc'), img: '/landing/pepperoni.jpg' },
                      { name: t('landing.dishTwo'), meta: t('landing.dishTwoDesc'), img: '/landing/jus-peche.jpg' },
                      { name: t('landing.demoDish3'), meta: t('landing.dishThreeDesc'), img: '/landing/jus-grenadine.jpg' },
                    ].map((dish) => (
                      <div key={dish.name} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#e0e1dd]">{dish.name}</p>
                          <p className="text-xs text-[#778da9]">{dish.meta}</p>
                        </div>
                        <img src={dish.img} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="max-w-md text-base leading-relaxed text-[#0d1b2a]/70 sm:text-lg">{t('landing.showMenuBody')}</p>
              </div>
            ) : null}

            {tab === 'dashboard' ? (
              <div>
                <div className="overflow-hidden rounded-2xl border border-[#0d1b2a]/8 bg-white">
                  <img src="/landing/showcase-dashboard.png" alt="" className="mx-auto h-auto w-full object-contain object-top" />
                </div>
                <p className="mt-4 text-sm text-[#0d1b2a]/65 sm:text-base">{t('landing.showDashBody')}</p>
              </div>
            ) : null}

            {tab === 'products' ? (
              <div>
                <div className="overflow-hidden rounded-2xl border border-[#0d1b2a]/8 bg-white">
                  <img src="/landing/showcase-products.png" alt="" className="mx-auto h-auto w-full object-contain object-top" />
                </div>
                <p className="mt-4 text-sm text-[#0d1b2a]/65 sm:text-base">{t('landing.showProductsBody')}</p>
              </div>
            ) : null}

            {tab === 'qr' ? (
              <div className="grid items-center gap-8 sm:grid-cols-[12rem_1fr]">
                <div className="mx-auto w-40 rounded-3xl bg-white p-4 shadow-lg">
                  <div className="aspect-square text-[#0d1b2a]">
                    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
                      <rect x="8" y="8" width="36" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="5" />
                      <rect x="76" y="8" width="36" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="5" />
                      <rect x="8" y="76" width="36" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="5" />
                      <rect x="18" y="18" width="16" height="16" fill="currentColor" />
                      <rect x="86" y="18" width="16" height="16" fill="currentColor" />
                      <rect x="18" y="86" width="16" height="16" fill="currentColor" />
                      <rect x="52" y="52" width="16" height="16" fill="currentColor" />
                      <rect x="72" y="52" width="10" height="10" fill="currentColor" opacity="0.7" />
                      <rect x="52" y="76" width="10" height="20" fill="currentColor" opacity="0.8" />
                    </svg>
                  </div>
                </div>
                <p className="text-base leading-relaxed text-[#0d1b2a]/70 sm:text-lg">{t('landing.showQrBody')}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
