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
      className="relative isolate flex flex-col overflow-hidden pt-[calc(5.75rem+env(safe-area-inset-top,0px))] pb-10 sm:pb-12 lg:min-h-[100svh] lg:justify-center lg:pb-16"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src="/landing/hero-bg.jpg"
          alt=""
          className="h-full w-full object-cover object-[center_38%] brightness-[1.06] contrast-[1.04] saturate-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1b2a]/80 via-[#0d1b2a]/45 to-[#0d1b2a]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a] via-[#0d1b2a]/25 to-[#0d1b2a]/40" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] items-center gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 lg:px-12 xl:gap-14">
        <div className="relative z-20 min-w-0 max-w-xl text-[#e0e1dd]">
          <p
            className={`mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-white/90 uppercase backdrop-blur-md transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#e0e1dd]" />
            {t('landing.heroEyebrow')}
          </p>

          <h1
            className={`font-display text-[clamp(2rem,6vw,3.6rem)] font-bold leading-[1.06] tracking-[-0.035em] text-white transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {t('landing.heroTitle')}
          </h1>

          <p
            className={`mt-4 max-w-md text-base leading-relaxed text-white/75 transition-all delay-150 duration-700 sm:text-lg ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {t('landing.heroBody')}
          </p>

          <div
            className={`mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            } transition-all delay-200 duration-700`}
          >
            <AppLink
              to="/register"
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#e0e1dd] px-6 py-3 text-sm font-semibold text-[#0d1b2a] shadow-[0_12px_30px_rgba(0,0,0,0.28)] hover:bg-white sm:w-auto"
            >
              <span className="text-center">{t('landing.ctaStart')}</span>
              <MaterialIcon name="arrow_forward" className="shrink-0 text-[18px] transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </AppLink>
            <DemoMenuLink className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 bg-white/8 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/14 sm:w-auto">
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
