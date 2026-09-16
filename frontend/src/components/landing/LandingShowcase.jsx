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
    <section id="produit" ref={ref} className="border-t border-on-surface/10 bg-surface-container/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">{t('landing.showcaseKicker')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.showcaseTitle')}</h2>
          <p className="mt-4 text-lg text-on-surface-variant">{t('landing.showcaseBody')}</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                tab === item.key ? 'bg-primary text-on-primary' : 'border border-on-surface/10 bg-background text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <div
          className={`overflow-hidden rounded-3xl border border-on-surface/10 bg-surface-container-lowest shadow-[0_24px_60px_rgba(13,27,42,0.08)] transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {tab === 'menu' ? (
            <div className="grid items-center gap-8 p-6 lg:grid-cols-2 lg:p-10">
              <div className="mx-auto">
                <div className="h-[420px] w-[210px] overflow-hidden rounded-[2rem] border-[6px] border-[#0d1b2a] bg-[#0d1b2a] sm:h-[480px] sm:w-[240px]">
                  <img src="/landing/pepperoni.jpg" alt="" className="h-36 w-full object-cover sm:h-40" />
                  <div className="space-y-3 p-4">
                    <p className="font-display text-lg font-bold text-[#e0e1dd]">{t('landing.phoneMenu')}</p>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#e0e1dd]">{t('landing.dishOne')}</p>
                          <p className="text-xs text-[#778da9]">{t('landing.dishOneDesc')}</p>
                        </div>
                        <img src="/landing/pepperoni.jpg" alt="" className="h-12 w-12 rounded-lg object-cover" />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#e0e1dd]">{t('landing.dishTwo')}</p>
                          <p className="text-xs text-[#778da9]">{t('landing.dishTwoDesc')}</p>
                        </div>
                        <img src="/landing/jus-peche.jpg" alt="" className="h-12 w-12 rounded-lg object-cover" />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#e0e1dd]">{t('landing.demoDish3')}</p>
                          <p className="text-xs text-[#778da9]">{t('landing.dishThreeDesc')}</p>
                        </div>
                        <img src="/landing/jus-grenadine.jpg" alt="" className="h-12 w-12 rounded-lg object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold lg:text-3xl">{t('landing.showMenuTitle')}</h3>
                <p className="mt-4 text-lg text-on-surface-variant">{t('landing.showMenuBody')}</p>
              </div>
            </div>
          ) : null}

          {tab === 'dashboard' ? (
            <div className="p-6 lg:p-10">
              <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-on-surface/10 bg-[#e8e9ea] shadow-sm">
                <img
                  src="/landing/showcase-dashboard.png"
                  alt=""
                  className="mx-auto h-auto w-full max-w-full object-contain object-top"
                />
              </div>
              <p className="mx-auto mt-6 max-w-2xl text-on-surface-variant">{t('landing.showDashBody')}</p>
            </div>
          ) : null}

          {tab === 'products' ? (
            <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-10">
              <div className="overflow-hidden rounded-2xl border border-on-surface/10 shadow-sm">
                <img src="/landing/showcase-products.png" alt="" className="mx-auto h-auto w-full object-contain object-top" />
              </div>
              <p className="text-on-surface-variant">{t('landing.showProductsBody')}</p>
            </div>
          ) : null}

          {tab === 'qr' ? (
            <div className="grid items-center gap-8 p-6 lg:grid-cols-2 lg:p-10">
              <div className="mx-auto w-48 rounded-3xl border border-on-surface/10 bg-background p-5 shadow-lg">
                <div className="aspect-square rounded-2xl bg-surface-container-lowest p-3 text-on-surface">
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
                <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide">{t('landing.heroQrLabel')}</p>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold lg:text-3xl">{t('landing.showQrTitle')}</h3>
                <p className="mt-4 text-lg text-on-surface-variant">{t('landing.showQrBody')}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
