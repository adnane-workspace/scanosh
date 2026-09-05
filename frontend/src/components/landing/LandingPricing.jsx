import { Link } from 'react-router-dom';
import AppLink from '../common/AppLink.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';
import { LANDING_PRICING } from '../../utils/paths.js';

const FEATURES = [
  'landing.priceFeat1',
  'landing.priceFeat2',
  'landing.priceFeat3',
  'landing.priceFeat4',
  'landing.priceFeat5',
  'landing.priceFeat6',
];

export default function LandingPricing() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="tarifs" ref={ref} className="border-t border-on-surface/10 bg-surface-container/35 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">{t('landing.pricingBadge')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.pricingTitle')}</h2>
          <p className="mt-4 text-lg text-on-surface-variant">{t('landing.pricingLead')}</p>
        </div>

        <div
          className={`grid gap-5 lg:grid-cols-2 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          } transition-all duration-700`}
        >
          <div className="relative rounded-3xl border-2 border-primary bg-surface-container-lowest p-8 shadow-[0_20px_50px_rgba(13,27,42,0.1)] lg:p-10">
            <span className="absolute -top-3 start-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold tracking-wide text-on-primary uppercase">
              {t('landing.pricingRecommended')}
            </span>
            <p className="text-sm font-medium text-on-surface-variant">{t('landing.pricingPlan')}</p>
            <p className="mt-2 font-display text-4xl font-bold">{t('landing.pricingFree')}</p>
            <p className="mt-3 text-on-surface-variant">{t('landing.pricingCardBody')}</p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm text-on-surface-variant">
                  <MaterialIcon name="check_circle" className="mt-0.5 text-[18px] text-primary" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <AppLink
              to="/register"
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              {t('landing.ctaStart')}
            </AppLink>
          </div>

          <div className="rounded-3xl border border-on-surface/10 bg-surface-container-lowest p-8 lg:p-10">
            <p className="text-sm font-medium text-on-surface-variant">{t('landing.pricingTrialLabel')}</p>
            <p className="mt-2 font-display text-3xl font-bold">{t('landing.ctaFilledTrial')}</p>
            <p className="mt-3 text-on-surface-variant">{t('landing.pricingTrialBody')}</p>
            <p className="mt-8 text-on-surface-variant">{t('landing.pricingTrialNote')}</p>
            <AppLink
              to="/essai"
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full border border-on-surface/15 text-sm font-semibold hover:bg-surface-container"
            >
              {t('landing.ctaTrial')}
            </AppLink>
            <p className="mt-6 text-center text-sm text-on-surface-variant">
              {t('landing.pricingNote')}{' '}
              <Link to={LANDING_PRICING} className="font-semibold text-on-surface underline underline-offset-4">
                {t('landing.navPricing')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
