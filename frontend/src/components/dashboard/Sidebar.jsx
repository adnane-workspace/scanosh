import { NavLink } from 'react-router-dom';
import MarketingLink from '../common/MarketingLink.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { APP_NAME } from '../../utils/constants.js';
import { useTheme } from '../../hooks/useTheme.js';
import BrandLogo from '../ui/BrandLogo.jsx';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { getPublicMenuUrl } from '../../utils/constants.js';

function navClassName() {
  return ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-primary font-semibold text-on-primary'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;
}

export default function Sidebar({ cafe, role, onLogout, onNavigate, qrRequestCount = 0 }) {
  const { t } = useLocale();
  const { isDark } = useTheme();
  const isSuperAdmin = role === 'superadmin';
  const links = isSuperAdmin
    ? [
        { to: '/platform', label: t('nav.dashboard'), icon: 'home', end: true },
        { to: '/platform/cafes', label: t('nav.cafes'), icon: 'storefront' },
        { to: '/platform/trials', label: t('nav.trials'), icon: 'science' },
        { to: '/platform/qr-requests', label: t('nav.qrRequests'), icon: 'qr_code_2', badge: qrRequestCount },
        { to: '/platform/logs', label: t('nav.logs'), icon: 'history' },
        { to: '/platform/storage', label: t('nav.storage'), icon: 'cloud' },
        { to: '/platform/settings', label: t('nav.settings'), icon: 'settings' },
      ]
    : [
        { to: '/app', label: t('nav.dashboard'), icon: 'home', end: true },
        { to: '/app/categories', label: t('nav.categories'), icon: 'grid_view' },
        { to: '/app/products', label: t('nav.products'), icon: 'lunch_dining' },
        { to: '/app/ai-fill', label: t('nav.aiFill'), icon: 'auto_awesome' },
        { to: '/app/menu', label: t('nav.publicMenu'), icon: 'menu_book' },
        { to: '/app/settings', label: t('nav.settings'), icon: 'settings' },
      ];
  const menuUrl = cafe?.slug ? getPublicMenuUrl(cafe.slug) : '';

  return (
    <div
      className="flex h-full flex-col border-e border-outline-variant bg-sidebar"
    >
      <div className="px-5 pt-5 pb-4">
        {isSuperAdmin ? (
          <>
            <MarketingLink to="/" aria-label={APP_NAME} className="inline-flex">
              <BrandLogo onDark={isDark} className="h-10" />
            </MarketingLink>
            <span className="mt-2.5 block text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
              {t('header.platform')}
            </span>
          </>
        ) : (
          <>
            <MarketingLink to="/" aria-label={APP_NAME} className="inline-flex">
              <BrandLogo onDark={isDark} className="h-8 max-w-[11rem]" />
            </MarketingLink>
            <div className="mt-5 flex items-center gap-3.5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-container">
                {cafe?.logo ? (
                  <CloudinaryImage
                    src={cafe.logo}
                    alt=""
                    preset="logoHero"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <MaterialIcon name="storefront" className="text-[28px] text-on-surface-variant" />
                )}
              </div>
              <p className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-on-surface">
                {cafe?.name || t('auth.digitalMenu')}
              </p>
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={navClassName()}
            onClick={onNavigate}
          >
            <MaterialIcon name={link.icon} className="text-[20px]" />
            <span className="flex-1">{link.label}</span>
            {link.badge ? (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-bold">
                {link.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-3 pb-5">
        {menuUrl ? (
          <div className="mb-3 border-t border-outline-variant pt-4">
            <a
              href={menuUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface"
              onClick={onNavigate}
            >
              <MaterialIcon name="open_in_new" className="text-[20px]" />
              {t('nav.viewMenu')}
            </a>
          </div>
        ) : (
          <div className="mb-3 border-t border-outline-variant pt-4" />
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-start text-sm font-medium text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface"
        >
          <MaterialIcon name="logout" className="text-[20px]" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );
}
