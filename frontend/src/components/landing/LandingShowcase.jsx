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
                  <img src="/landing/dessert.jpg" alt="" className="h-36 w-full object-cover sm:h-40" />
                  <div className="space-y-3 p-4">
                    <p className="font-display text-lg font-bold text-[#e0e1dd]">{t('landing.phoneMenu')}</p>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#e0e1dd]">{t('landing.dishOne')}</p>
                          <p className="text-xs text-[#778da9]">{t('landing.dishOneDesc')}</p>
                        </div>
                        <img src="/landing/ceviche.jpg" alt="" className="h-12 w-12 rounded-lg object-cover" />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#e0e1dd]">{t('landing.dishTwo')}</p>
                          <p className="text-xs text-[#778da9]">{t('landing.dishTwoDesc')}</p>
                        </div>
                        <img src="/landing/dessert.jpg" alt="" className="h-12 w-12 rounded-lg object-cover" />
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
              <div className="overflow-hidden rounded-2xl border border-on-surface/10">
                <div className="flex items-center justify-between border-b border-on-surface/10 bg-surface-container px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#415a77]/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#778da9]/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0d1b2a]/30" />
                  </div>
                  <span className="rounded-md bg-background px-3 py-1 font-mono text-[11px] text-on-surface-variant">app.scanosh.com</span>
                </div>
                <div className="grid grid-cols-12 gap-3 bg-[#e0e1dd] p-4 sm:p-6">
                  <div className="col-span-3 hidden flex-col gap-2 md:flex">
                    <div className="mb-2 h-6 w-3/4 rounded bg-surface-container-high" />
                    <div className="h-9 rounded-md bg-[#0d1b2a]" />
                    <div className="h-9 rounded-md bg-surface-container" />
                    <div className="h-9 rounded-md bg-surface-container" />
                  </div>
                  <div className="col-span-12 space-y-4 md:col-span-9">
                    <div className="flex justify-between">
                      <div className="h-7 w-1/3 rounded bg-surface-container-high" />
                      <div className="h-7 w-20 rounded bg-[#0d1b2a]/20" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="rounded-xl bg-surface-container-lowest p-3">
                          <div className="mb-2 h-16 rounded-lg bg-surface-container" />
                          <div className="h-3 w-3/4 rounded bg-surface-container-high" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-on-surface-variant">{t('landing.showDashBody')}</p>
            </div>
          ) : null}

          {tab === 'products' ? (
            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3 lg:p-10">
              {[
                { img: '/landing/ceviche.jpg', name: 'landing.dishOne', price: '85 DH' },
                { img: '/landing/dessert.jpg', name: 'landing.dishTwo', price: '120 DH' },
                { img: '/landing/hero.jpg', name: 'landing.demoDish3', price: '95 DH' },
              ].map((item) => (
                <div key={item.name} className="overflow-hidden rounded-2xl border border-on-surface/10 bg-background">
                  <img src={item.img} alt="" className="h-36 w-full object-cover" />
                  <div className="p-4">
                    <p className="font-semibold">{t(item.name)}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{t('landing.showProductHint')}</p>
                    <p className="mt-3 font-bold">{item.price}</p>
                  </div>
                </div>
              ))}
              <p className="sm:col-span-2 lg:col-span-3 text-on-surface-variant">{t('landing.showProductsBody')}</p>
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
