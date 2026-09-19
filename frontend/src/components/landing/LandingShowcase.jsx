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
    <section id="produit" ref={ref} className="bg-[#0d1b2a] pb-12 sm:pb-16 lg:pb-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#e8e6e1] shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:rounded-[1.75rem]">
          <div className="flex flex-col gap-3 px-4 pt-4 sm:gap-4 sm:px-7 sm:pt-6">
            <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-[#0d1b2a] sm:text-3xl">{t('landing.showcaseTitle')}</h2>
            <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max min-w-full gap-1 rounded-full bg-[#0d1b2a]/8 p-1">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-3.5 sm:py-1.5 sm:text-sm ${
                      tab === item.key ? 'bg-[#0d1b2a] text-[#e0e1dd]' : 'text-[#0d1b2a]/60 hover:text-[#0d1b2a]'
                    }`}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`px-4 pb-5 pt-4 transition-all duration-700 sm:px-7 sm:pb-8 sm:pt-5 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {tab === 'menu' ? (
              <div>
                <div className="mx-auto max-w-[22rem] overflow-hidden rounded-[1.5rem] border border-[#0d1b2a]/8 bg-[#0d1b2a] shadow-lg">
                  <img
                    src="/landing/showcase-menu.png"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full object-cover object-top"
                  />
                </div>
                <p className="mt-4 text-sm text-[#0d1b2a]/65 sm:text-base">{t('landing.showMenuBody')}</p>
              </div>
            ) : null}

            {tab === 'dashboard' ? (
              <div>
                <div className="overflow-hidden rounded-xl border border-[#0d1b2a]/8 bg-white sm:rounded-2xl">
                  <img src="/landing/showcase-dashboard.png" alt="" loading="lazy" decoding="async" className="mx-auto h-auto w-full object-contain object-top" />
                </div>
                <p className="mt-4 text-sm text-[#0d1b2a]/65 sm:text-base">{t('landing.showDashBody')}</p>
              </div>
            ) : null}

            {tab === 'products' ? (
              <div>
                <div className="overflow-hidden rounded-xl border border-[#0d1b2a]/8 bg-white sm:rounded-2xl">
                  <img src="/landing/showcase-products.png" alt="" loading="lazy" decoding="async" className="mx-auto h-auto w-full object-contain object-top" />
                </div>
                <p className="mt-4 text-sm text-[#0d1b2a]/65 sm:text-base">{t('landing.showProductsBody')}</p>
              </div>
            ) : null}

            {tab === 'qr' ? (
              <div className="grid items-center gap-5 sm:grid-cols-[12rem_1fr] sm:gap-8">
                <div className="mx-auto w-32 rounded-3xl bg-white p-3 shadow-lg sm:w-40 sm:p-4">
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
                <p className="text-sm leading-relaxed text-[#0d1b2a]/70 sm:text-lg">{t('landing.showQrBody')}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
