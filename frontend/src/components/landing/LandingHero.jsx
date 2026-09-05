import { useEffect, useState } from 'react';
import AppLink from '../common/AppLink.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import HeroQrMark from './HeroQrMark.jsx';

export default function LandingHero() {
  const { t } = useLocale();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section
      id="accueil"
      className="relative pt-[calc(7rem+env(safe-area-inset-top,0px))] pb-14 sm:pb-16 lg:min-h-[100svh] lg:pt-[calc(8rem+env(safe-area-inset-top,0px))] lg:pb-20"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(119,141,169,0.22), transparent 55%), radial-gradient(ellipse 55% 70% at 92% 45%, rgba(119,141,169,0.18), transparent 58%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.14]" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={`h-${i}`} className="absolute inset-x-0 h-px bg-on-surface/15" style={{ top: `${14 * (i + 1)}%` }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-8 px-5 sm:gap-10 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8 lg:px-12 xl:gap-12">
        <div className="relative z-20 min-w-0 max-w-xl">
          <p
            className={`mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-on-surface/10 bg-surface-container-lowest/80 px-3 py-1.5 text-xs font-medium text-on-surface-variant backdrop-blur transition-all duration-700 sm:mb-5 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <MaterialIcon name="restaurant" className="shrink-0 text-[16px]" />
            <span className="truncate">{t('landing.heroEyebrow')}</span>
          </p>

          <h1
            className={`font-display text-[clamp(1.9rem,6.5vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em] transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {t('landing.heroTitle')}
          </h1>

          <p
            className={`mt-4 text-base leading-relaxed text-on-surface-variant transition-all delay-150 duration-700 sm:mt-5 sm:text-lg lg:text-xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {t('landing.heroBody')}
          </p>

          <div
            className={`mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            } transition-all delay-200 duration-700`}
          >
            <AppLink
              to="/register"
              className="group inline-flex h-auto min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-[0_12px_30px_rgba(13,27,42,0.22)] hover:bg-primary-hover sm:w-auto sm:px-7 sm:text-base"
            >
              <span className="text-center">{t('landing.ctaStart')}</span>
              <MaterialIcon name="arrow_forward" className="shrink-0 text-[18px] transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </AppLink>
            <AppLink
              to="/essai"
              className="inline-flex h-auto min-h-12 w-full items-center justify-center rounded-full border border-on-surface/15 bg-surface-container-lowest/70 px-5 py-3 text-sm font-semibold text-on-surface backdrop-blur hover:bg-surface-container sm:w-auto sm:px-7 sm:text-base"
            >
              {t('landing.ctaTrial')}
            </AppLink>
          </div>
        </div>

        <div
          className={`relative w-full min-w-0 transition-all delay-200 duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[28rem] lg:max-w-none lg:min-h-[min(68vh,36rem)] lg:aspect-auto xl:min-h-[min(74vh,40rem)]">
            <div
              className="pointer-events-none absolute -inset-[6%] rounded-[3rem] opacity-70 sm:-inset-[8%]"
              style={{
                background:
                  'radial-gradient(circle at 50% 45%, rgba(119,141,169,0.14), transparent 62%)',
              }}
            />

            <div className="absolute inset-0 overflow-hidden rounded-[1.5rem] border border-[#778da9]/15 bg-gradient-to-br from-[#f7f7f5] via-[#f0f1ef]/90 to-[#e8eaeb]/70 shadow-[0_24px_60px_rgba(119,141,169,0.12)] backdrop-blur-sm sm:rounded-[2.5rem]">
              <span className="absolute top-4 start-4 h-6 w-6 rounded-ss-lg border-t-2 border-s-2 border-[#778da9]/30 sm:top-7 sm:start-7 sm:h-8 sm:w-8 sm:rounded-ss-xl" />
              <span className="absolute top-4 end-4 h-6 w-6 rounded-se-lg border-t-2 border-e-2 border-[#778da9]/30 sm:top-7 sm:end-7 sm:h-8 sm:w-8 sm:rounded-se-xl" />
              <span className="absolute bottom-4 start-4 h-6 w-6 rounded-es-lg border-b-2 border-s-2 border-[#778da9]/30 sm:bottom-7 sm:start-7 sm:h-8 sm:w-8 sm:rounded-es-xl" />
              <span className="absolute end-4 bottom-4 h-6 w-6 rounded-ee-lg border-e-2 border-b-2 border-[#778da9]/30 sm:end-7 sm:bottom-7 sm:h-8 sm:w-8 sm:rounded-ee-xl" />

              <div
                className="pointer-events-none absolute inset-0 opacity-[0.45]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(119,141,169,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(119,141,169,0.08) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                  maskImage: 'radial-gradient(circle at center, black 35%, transparent 78%)',
                }}
              />

              <div className="absolute inset-[8%] bottom-[16%] sm:inset-[9%] sm:bottom-[15%]">
                <HeroQrMark density="hero" />
              </div>

              <div className="absolute inset-x-0 bottom-3 flex justify-center sm:bottom-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#778da9]/18 bg-white/85 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-[#778da9] uppercase backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#778da9]/70" />
                  {t('landing.heroQrLabel')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
