import { useEffect, useState } from 'react';
import AppLink from '../common/AppLink.jsx';
import DemoMenuLink from '../common/DemoMenuLink.jsx';
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
      className="relative isolate min-h-[100svh] overflow-hidden pt-[calc(12rem+env(safe-area-inset-top,0px))] pb-16 sm:pb-20 lg:pt-[calc(13.5rem+env(safe-area-inset-top,0px))] lg:pb-24"
    >
      {/* Full-bleed restaurant background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src="/landing/hero-bg.jpg"
          alt=""
          className="h-full w-full scale-105 object-cover object-[center_40%] brightness-[1.08] contrast-[1.05] saturate-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1b2a]/55 via-[#0d1b2a]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/50 via-transparent to-[#0d1b2a]/25" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-10 px-5 sm:gap-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 lg:px-12 xl:gap-14">
        <div className="relative z-20 min-w-0 max-w-xl text-[#e0e1dd]">
          <p
            className={`mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#e0e1dd]/90 backdrop-blur-md transition-all duration-700 sm:mb-5 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <MaterialIcon name="restaurant" className="shrink-0 text-[16px]" />
            <span className="truncate">{t('landing.heroEyebrow')}</span>
          </p>

          <h1
            className={`font-display text-[clamp(1.9rem,6.5vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {t('landing.heroTitle')}
          </h1>

          <p
            className={`mt-4 text-base leading-relaxed text-[#e0e1dd]/78 transition-all delay-150 duration-700 sm:mt-5 sm:text-lg lg:text-xl ${
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
              className="group inline-flex h-auto min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#e0e1dd] px-5 py-3 text-sm font-semibold text-[#0d1b2a] shadow-[0_12px_30px_rgba(0,0,0,0.28)] hover:bg-white sm:w-auto sm:px-7 sm:text-base"
            >
              <span className="text-center">{t('landing.ctaStart')}</span>
              <MaterialIcon name="arrow_forward" className="shrink-0 text-[18px] transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </AppLink>
            <DemoMenuLink
              className="inline-flex h-auto min-h-12 w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15 sm:w-auto sm:px-7 sm:text-base"
            >
              {t('landing.ctaTrial')}
            </DemoMenuLink>
          </div>
        </div>

        <div
          className={`relative flex w-full min-w-0 items-center justify-center transition-all delay-200 duration-1000 lg:justify-end ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="relative aspect-square w-[min(72vw,17.5rem)] sm:w-[20rem] lg:w-[22rem] xl:w-[24rem]">
            <div className="pointer-events-none absolute -inset-[8%] rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_45%,rgba(224,225,221,0.14),transparent_62%)]" />

            <div className="absolute inset-0 overflow-hidden rounded-[1.35rem] border border-white/15 bg-[#0d1b2a]/40 shadow-[0_22px_55px_rgba(0,0,0,0.35)] backdrop-blur-md sm:rounded-[1.75rem]">
              <span className="absolute top-3.5 start-3.5 h-5 w-5 rounded-ss-md border-t-2 border-s-2 border-white/35 sm:top-4 sm:start-4 sm:h-6 sm:w-6" />
              <span className="absolute top-3.5 end-3.5 h-5 w-5 rounded-se-md border-t-2 border-e-2 border-white/35 sm:top-4 sm:end-4 sm:h-6 sm:w-6" />
              <span className="absolute bottom-3.5 start-3.5 h-5 w-5 rounded-es-md border-b-2 border-s-2 border-white/35 sm:bottom-4 sm:start-4 sm:h-6 sm:w-6" />
              <span className="absolute end-3.5 bottom-3.5 h-5 w-5 rounded-ee-md border-e-2 border-b-2 border-white/35 sm:end-4 sm:bottom-4 sm:h-6 sm:w-6" />

              <div className="absolute inset-[9%] bottom-[18%] text-[#e0e1dd]">
                <HeroQrMark density="hero" className="text-[#e0e1dd]" />
              </div>

              <div className="absolute inset-x-0 bottom-2.5 flex justify-center sm:bottom-3.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#0d1b2a]/60 px-2.5 py-1 text-[9px] font-semibold tracking-[0.14em] text-[#e0e1dd] uppercase backdrop-blur sm:text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e0e1dd]/80" />
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
