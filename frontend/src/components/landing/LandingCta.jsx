import AppLink from '../common/AppLink.jsx';
import DemoMenuLink from '../common/DemoMenuLink.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

export default function LandingCta() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.15);

  return (
    <section id="cta" ref={ref} className="bg-[#0d1b2a] pb-16 lg:pb-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-12">
        <div
          className={`flex flex-col items-start justify-between gap-6 rounded-[1.75rem] border border-white/10 bg-white/[0.06] px-6 py-8 text-[#e0e1dd] sm:px-10 sm:py-10 lg:flex-row lg:items-center ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          } transition-all duration-700`}
        >
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{t('landing.bottomTitle')}</h2>
            <p className="mt-2 text-sm text-white/55 sm:text-base">{t('landing.ctaNote')}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <AppLink
              to="/register"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e0e1dd] px-6 py-3 text-sm font-semibold text-[#0d1b2a] hover:bg-white"
            >
              {t('landing.ctaStart')}
              <MaterialIcon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </AppLink>
            <DemoMenuLink className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              {t('landing.ctaTrial')}
            </DemoMenuLink>
          </div>
        </div>
      </div>
    </section>
  );
}
