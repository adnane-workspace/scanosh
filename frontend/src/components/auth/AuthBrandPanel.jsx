import MarketingLink from '../common/MarketingLink.jsx';
import BrandLogo from '../ui/BrandLogo.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';

export default function AuthBrandPanel() {
  const { t } = useLocale();

  return (
    <aside className="relative flex h-48 overflow-hidden text-[#e0e1dd] sm:h-56 lg:h-full lg:min-h-screen lg:flex-col lg:justify-between lg:px-14 lg:py-14 xl:px-16">
      <img
        src="/landing/loginImg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#0d1b2a]/50" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/85 via-[#0d1b2a]/35 to-[#0d1b2a]/20" />

      <div className="relative z-10 hidden lg:block">
        <MarketingLink to="/" aria-label={t('landing.navHome')}>
          <BrandLogo onDark className="h-20" />
        </MarketingLink>
      </div>

      <div className="relative z-10 hidden max-w-md lg:block">
        <h1 className="font-display text-5xl font-semibold leading-[1.15] tracking-tight xl:text-6xl">
          {t('auth.headline')}
        </h1>
      </div>

      <ul className="relative z-10 hidden space-y-4 text-sm text-[#e0e1dd]/80 lg:block">
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
