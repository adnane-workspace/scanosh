import { useEffect, useState } from 'react';
import AppLink from '../common/AppLink.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import HeroQrMark from './HeroQrMark.jsx';

const CHIPS = ['landing.heroChip1', 'landing.heroChip2', 'landing.heroChip3'];

export default function LandingHero() {
  const { t } = useLocale();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="accueil" className="relative overflow-hidden pt-28 pb-16 lg:min-h-[100svh] lg:pt-32 lg:pb-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(119,141,169,0.22), transparent 55%), radial-gradient(ellipse 55% 70% at 92% 45%, rgba(119,141,169,0.18), transparent 58%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={`h-${i}`} className="absolute inset-x-0 h-px bg-on-surface/15" style={{ top: `${14 * (i + 1)}%` }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-10 px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8 lg:px-12 xl:gap-12">
        <div className="relative z-20 max-w-xl">
          <p
            className={`mb-5 inline-flex items-center gap-2 rounded-full border border-on-surface/10 bg-surface-container-lowest/80 px-3 py-1.5 text-xs font-medium text-on-surface-variant backdrop-blur transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <MaterialIcon name="restaurant" className="text-[16px]" />
            {t('landing.heroEyebrow')}
          </p>

          <h1
            className={`font-display text-[clamp(2.15rem,5.5vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em] transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {t('landing.heroTitle')}
          </h1>

          <p
            className={`mt-5 text-lg leading-relaxed text-on-surface-variant transition-all delay-150 duration-700 lg:text-xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {t('landing.heroBody')}
          </p>

          <div
            className={`mt-8 flex flex-col gap-3 sm:flex-row sm:items-center ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            } transition-all delay-200 duration-700`}
          >
            <AppLink
              to="/register"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-on-primary shadow-[0_12px_30px_rgba(13,27,42,0.22)] hover:bg-primary-hover"
            >
              {t('landing.ctaStart')}
              <MaterialIcon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </AppLink>
            <AppLink
              to="/essai"
              className="inline-flex h-12 items-center justify-center rounded-full border border-on-surface/15 bg-surface-container-lowest/70 px-7 text-base font-semibold text-on-surface backdrop-blur hover:bg-surface-container"
            >
              {t('landing.ctaTrial')}
            </AppLink>
          </div>

          <div
            className={`mt-8 flex flex-wrap gap-2 transition-all delay-300 duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {CHIPS.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-on-surface/10 bg-background/70 px-3 py-1.5 text-xs font-medium text-on-surface-variant"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t(key)}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`relative w-full transition-all delay-200 duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Full-bleed right panel */}
          <div className="relative mx-auto aspect-square w-full max-w-[34rem] lg:max-w-none lg:min-h-[min(72vh,38rem)] lg:aspect-auto xl:min-h-[min(78vh,42rem)]">
            {/* Soft ambient glow */}
            <div
              className="pointer-events-none absolute -inset-[8%] rounded-[3rem] opacity-70"
              style={{
                background:
                  'radial-gradient(circle at 50% 45%, rgba(119,141,169,0.14), transparent 62%)',
              }}
            />

            {/* Modern frame */}
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-[#778da9]/15 bg-gradient-to-br from-[#f7f7f5] via-[#f0f1ef]/90 to-[#e8eaeb]/70 shadow-[0_24px_60px_rgba(119,141,169,0.12)] backdrop-blur-sm sm:rounded-[2.5rem]">
              {/* Corner marks */}
              <span className="absolute top-5 left-5 h-8 w-8 rounded-tl-xl border-t-2 border-l-2 border-[#778da9]/30 sm:top-7 sm:left-7" />
              <span className="absolute top-5 right-5 h-8 w-8 rounded-tr-xl border-t-2 border-r-2 border-[#778da9]/30 sm:top-7 sm:right-7" />
              <span className="absolute bottom-5 left-5 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-[#778da9]/30 sm:bottom-7 sm:left-7" />
              <span className="absolute right-5 bottom-5 h-8 w-8 rounded-br-xl border-r-2 border-b-2 border-[#778da9]/30 sm:right-7 sm:bottom-7" />

              {/* Subtle grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.45]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(119,141,169,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(119,141,169,0.08) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                  maskImage: 'radial-gradient(circle at center, black 35%, transparent 78%)',
                }}
              />

              <div className="absolute inset-[7%] sm:inset-[8%]">
                <HeroQrMark density="hero" />
              </div>

              <div className="absolute inset-x-0 bottom-4 flex justify-center sm:bottom-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#778da9]/18 bg-white/80 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#778da9] uppercase backdrop-blur">
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
