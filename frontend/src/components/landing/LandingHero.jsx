import { useEffect, useState } from 'react';
import AppLink from '../common/AppLink.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import HeroQrMark from './HeroQrMark.jsx';

const WORDS = ['landing.heroWord1', 'landing.heroWord2', 'landing.heroWord3', 'landing.heroWord4'];

export default function LandingHero() {
  const { t, dir } = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const word = t(WORDS[wordIndex]);
  const letters = dir === 'rtl' ? [word] : word.split('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const interval = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section id="accueil" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={`h-${index}`}
            className="absolute inset-x-0 h-px bg-on-surface/10"
            style={{ top: `${12.5 * (index + 1)}%` }}
          />
        ))}
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={`v-${index}`}
            className="absolute inset-y-0 w-px bg-on-surface/10"
            style={{ left: `${8.33 * (index + 1)}%` }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute top-1/2 end-[-4%] hidden h-[26rem] w-[26rem] -translate-y-1/2 opacity-50 lg:block lg:h-[34rem] lg:w-[34rem] xl:end-0">
        <HeroQrMark />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-28 pb-24 lg:px-12 lg:pt-36 lg:pb-32">
        <p
          className={`mb-8 inline-flex items-center gap-3 font-mono text-sm text-on-surface-variant transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="h-px w-8 bg-on-surface/30" />
          {t('landing.heroEyebrow')}
        </p>

        <h1
          className={`mb-12 font-display text-[clamp(2.4rem,8vw,5.5rem)] font-bold leading-[1.05] tracking-[-0.03em] transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <span className="block">{t('landing.heroLine1')}</span>
          <span className="block">
            {t('landing.heroLine2')}{' '}
            <span className="relative inline-block">
              <span key={wordIndex} className="inline-flex">
                {letters.map((char, index) => (
                  <span
                    key={`${wordIndex}-${index}`}
                    className="landing-char-in inline-block"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </span>
              <span className="absolute inset-x-0 -bottom-2 h-3 bg-on-surface/10" />
            </span>
          </span>
        </h1>

        <div className="grid items-end gap-12 lg:grid-cols-2 lg:gap-24">
          <p
            className={`max-w-xl text-xl leading-relaxed text-on-surface-variant lg:text-2xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            } transition-all delay-200 duration-700`}
          >
            {t('landing.heroBody')}
          </p>
          <div
            className={`flex flex-col items-stretch gap-3 sm:flex-row sm:items-center ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            } transition-all delay-300 duration-700`}
          >
            <AppLink
              to="/register"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-on-surface px-8 text-base font-medium text-background"
            >
              {t('landing.ctaStart')}
              <MaterialIcon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </AppLink>
            <AppLink
              to="/essai"
              className="inline-flex h-14 items-center justify-center rounded-full border border-on-surface/20 px-8 text-base font-medium text-on-surface hover:bg-on-surface/5"
            >
              {t('landing.ctaFilledTrial')}
            </AppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
