import { useState } from 'react';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const STEPS = [
  {
    number: '01',
    titleKey: 'landing.step1Title',
    bodyKey: 'landing.step1Body',
    icon: 'storefront',
    preview: 'menu',
  },
  {
    number: '02',
    titleKey: 'landing.step2Title',
    bodyKey: 'landing.step2Body',
    icon: 'restaurant_menu',
    preview: 'dishes',
  },
  {
    number: '03',
    titleKey: 'landing.step3Title',
    bodyKey: 'landing.step3Body',
    icon: 'qr_code_2',
    preview: 'qr',
  },
  {
    number: '04',
    titleKey: 'landing.step4Title',
    bodyKey: 'landing.step4Body',
    icon: 'smartphone',
    preview: 'scan',
  },
];

function StepPreview({ type, active }) {
  if (type === 'menu') {
    return (
      <div className={`flex h-full flex-col justify-end gap-2 p-4 ${active ? '' : 'items-center justify-center p-3'}`}>
        {active ? (
          <>
            <div className="rounded-2xl bg-surface-container p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-on-primary">
                  <MaterialIcon name="storefront" className="text-[18px]" />
                </span>
                <div className="h-2 w-24 rounded-full bg-on-surface/15" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-3/4 rounded-full bg-on-surface/15" />
                <div className="h-2 w-1/2 rounded-full bg-on-surface/10" />
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 opacity-80">
            {Array.from({ length: 9 }, (_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-sm ${i % 3 === 0 ? 'bg-primary/70' : 'bg-primary/25'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'dishes') {
    return (
      <div className={`flex h-full ${active ? 'flex-col justify-end gap-2 p-4' : 'items-center justify-center p-3'}`}>
        {active ? (
          <div className="space-y-2 rounded-2xl bg-surface-container p-3">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-lg bg-primary/20" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-2 w-4/5 rounded-full bg-on-surface/15" />
                  <div className="h-2 w-2/5 rounded-full bg-on-surface/10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={`h-3 w-3 rounded-sm ${i < 3 ? 'bg-primary/65' : 'bg-primary/20'}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'qr') {
    return (
      <div className={`flex h-full items-center justify-center ${active ? 'p-4' : 'p-3'}`}>
        <div
          className={`grid grid-cols-5 gap-1 rounded-xl border border-on-surface/10 bg-background p-2 ${
            active ? 'scale-100' : 'scale-90 opacity-80'
          } transition-transform duration-500`}
        >
          {Array.from({ length: 25 }, (_, i) => {
            const on = [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 21, 22, 24].includes(i);
            return <span key={i} className={`h-2 w-2 rounded-[2px] sm:h-2.5 sm:w-2.5 ${on ? 'bg-primary' : 'bg-transparent'}`} />;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full items-center justify-center ${active ? 'p-4' : 'p-3'}`}>
      {active ? (
        <div className="flex w-full items-center gap-3 rounded-2xl bg-surface-container p-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-on-primary">
            <MaterialIcon name="qr_code_scanner" className="text-[20px]" />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2 w-3/4 rounded-full bg-on-surface/15" />
            <div className="h-2 w-1/2 rounded-full bg-on-surface/10" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className={`h-3 w-3 rounded-sm ${[0, 2, 4, 6, 8].includes(i) ? 'bg-primary/70' : 'bg-primary/20'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingHowItWorks() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);
  const [active, setActive] = useState(0);

  return (
    <section id="comment" ref={ref} className="border-t border-on-surface/10 bg-surface-container/30 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className={`mb-12 max-w-2xl transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">{t('landing.howKicker')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.howTitle')}</h2>
          <p className="mt-4 text-lg text-on-surface-variant">{t('landing.howBody')}</p>
        </div>

        {/* Mobile: stacked expandable */}
        <div className="flex flex-col gap-3 lg:hidden">
          {STEPS.map((step, index) => {
            const isActive = active === index;
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setActive(index)}
                className={`overflow-hidden rounded-[1.5rem] text-start transition-all duration-500 ${
                  isActive
                    ? 'bg-surface-container-lowest shadow-[0_18px_40px_rgba(13,27,42,0.12)] ring-1 ring-on-surface/8'
                    : 'bg-surface-container/80 ring-1 ring-on-surface/5'
                } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className={`overflow-hidden transition-all duration-500 ${isActive ? 'h-36' : 'h-24'}`}>
                  <StepPreview type={step.preview} active={isActive} />
                </div>
                <div className="px-5 pb-5">
                  <p className={`font-mono text-xs tracking-wider ${isActive ? 'text-primary' : 'text-on-surface/30'}`}>
                    {step.number}.
                  </p>
                  <h3 className={`mt-2 font-display text-lg font-bold ${isActive ? 'text-on-surface' : 'text-on-surface/80'}`}>
                    {t(step.titleKey)}
                  </h3>
                  <div
                    className={`grid transition-all duration-500 ${
                      isActive ? 'mt-2 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <p className="overflow-hidden text-sm leading-relaxed text-on-surface-variant">{t(step.bodyKey)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Desktop: hover-expand row like photo 1 */}
        <div className="hidden lg:flex lg:items-stretch lg:gap-3">
          {STEPS.map((step, index) => {
            const isActive = active === index;
            return (
              <button
                key={step.number}
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className={`group relative flex flex-col overflow-hidden rounded-[1.75rem] text-start outline-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isActive
                    ? 'flex-[1.65] bg-surface-container-lowest shadow-[0_22px_50px_rgba(13,27,42,0.14)] ring-1 ring-on-surface/8'
                    : 'flex-1 bg-surface-container/70 ring-1 ring-on-surface/5 hover:bg-surface-container'
                } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: isVisible ? `${index * 80}ms` : '0ms', minHeight: '22rem' }}
              >
                <div
                  className={`relative overflow-hidden transition-all duration-500 ${
                    isActive ? 'h-[11.5rem]' : 'h-[10rem]'
                  }`}
                >
                  <div
                    className={`absolute inset-3 rounded-2xl transition-colors duration-500 ${
                      isActive ? 'bg-surface-container' : 'bg-transparent'
                    }`}
                  >
                    <StepPreview type={step.preview} active={isActive} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-6 pt-1">
                  {!isActive ? (
                    <span className="font-display text-4xl font-bold tracking-tight text-on-surface/15 transition-colors duration-500 group-hover:text-on-surface/25">
                      {step.number}.
                    </span>
                  ) : (
                    <span className="font-mono text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                      {step.number}
                    </span>
                  )}

                  <h3
                    className={`mt-3 font-display font-bold tracking-tight transition-all duration-500 ${
                      isActive ? 'text-xl text-on-surface' : 'text-base text-on-surface/75'
                    }`}
                  >
                    {t(step.titleKey)}
                  </h3>

                  <div
                    className={`grid transition-all duration-500 ${
                      isActive ? 'mt-3 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <p className="overflow-hidden text-sm leading-relaxed text-on-surface-variant">{t(step.bodyKey)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
