import AppLink from '../common/AppLink.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

export default function LandingCta() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.15);

  return (
    <section id="cta" ref={ref} className="border-t border-on-surface/10 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className={`relative overflow-hidden rounded-[1.75rem] bg-primary px-6 py-12 text-on-primary transition-all duration-1000 sm:rounded-[2rem] sm:px-12 sm:py-14 lg:px-16 lg:py-20 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 85% 20%, rgba(224,225,221,0.25), transparent 40%)',
            }}
          />
          <div className="relative max-w-3xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{t('landing.bottomTitle')}</h2>
            <p className="mt-5 text-lg text-on-primary/75 lg:text-xl">{t('landing.bottomBody')}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <AppLink
                to="/register"
                className="group inline-flex h-auto min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#e0e1dd] px-5 py-3 text-sm font-semibold text-[#0d1b2a] hover:bg-white sm:w-auto sm:px-7 sm:text-base"
              >
                <span className="text-center">{t('landing.ctaStart')}</span>
                <MaterialIcon name="arrow_forward" className="shrink-0 text-[18px] transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </AppLink>
              <AppLink
                to="/essai"
                className="inline-flex h-auto min-h-12 w-full items-center justify-center rounded-full border border-on-primary/25 px-5 py-3 text-sm font-semibold text-on-primary hover:bg-white/10 sm:w-auto sm:px-7 sm:text-base"
              >
                {t('landing.ctaTrial')}
              </AppLink>
            </div>
            <p className="mt-6 text-sm text-on-primary/55">{t('landing.ctaNote')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
