import MarketingLink from '../common/MarketingLink.jsx';
import BrandLogo from '../ui/BrandLogo.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';

export default function AuthBrandPanel() {
  const { t } = useLocale();

  return (
    <aside className="relative hidden overflow-hidden bg-[#0d1b2a] text-[#e0e1dd] lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14 xl:px-16">
      <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-[#778da9]/25 blur-[110px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 translate-x-1/4 translate-y-1/4 rounded-full bg-[#415a77]/30 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#e0e1dd_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative z-10">
        <MarketingLink to="/" aria-label={t('landing.navHome')}>
          <BrandLogo onDark className="h-20" />
        </MarketingLink>
      </div>

      <div className="relative z-10 max-w-md">
        <h1 className="font-display text-5xl font-semibold leading-[1.15] tracking-tight xl:text-6xl">
          {t('auth.headline')}
        </h1>
      </div>

      <ul className="relative z-10 space-y-4 text-sm text-[#e0e1dd]/80">
        <li className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0e1dd]/10">
            <MaterialIcon name="qr_code_2" className="text-[20px]" />
          </span>
          {t('auth.featureQr')}
        </li>
        <li className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0e1dd]/10">
            <MaterialIcon name="restaurant_menu" className="text-[20px]" />
          </span>
          {t('auth.featureMenu')}
        </li>
        <li className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0e1dd]/10">
            <MaterialIcon name="dashboard" className="text-[20px]" />
          </span>
          {t('auth.featureDashboard')}
        </li>
      </ul>
    </aside>
  );
}
