import AppLink from '../common/AppLink.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

export default function LandingCta() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.2);

  return (
    <section id="cta" ref={ref} className="relative overflow-hidden border-t border-on-surface/10 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className={`relative border border-on-surface px-8 py-16 transition-all duration-1000 lg:px-16 lg:py-24 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="mb-6 max-w-3xl font-display text-4xl leading-[0.95] tracking-tight lg:text-7xl">
            {t('landing.bottomTitle')}
          </h2>
          <p className="mb-12 max-w-xl text-xl leading-relaxed text-on-surface-variant">{t('landing.bottomBody')}</p>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <AppLink
              to="/register"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-on-surface px-8 text-base font-medium text-background"
            >
              {t('landing.bottomCta')}
              <MaterialIcon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </AppLink>
            <AppLink
              to="/essai"
              className="inline-flex h-14 items-center justify-center rounded-full border border-on-surface/20 px-8 text-base font-medium hover:bg-on-surface/5"
            >
              {t('landing.ctaTrial')}
            </AppLink>
          </div>
          <p className="mt-8 font-mono text-sm text-on-surface-variant">{t('landing.ctaNote')}</p>
        </div>
      </div>
    </section>
  );
}
