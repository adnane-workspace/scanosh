import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.js';
import { getMenuPaths } from '../../utils/hosts.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';

export default function PublicMenuHeader({ cafe, slug, backTo, backLabel }) {
  const { t } = useLocale();
  const paths = getMenuPaths(slug);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--menu-chrome-border)] bg-[var(--menu-chrome-bg)] pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-[3.5rem] max-w-6xl items-center justify-between gap-3 px-3 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Link
          to={backTo}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--menu-chrome-pill-bg)] text-on-surface shadow-[0_6px_16px_rgba(13,27,42,0.08)] ring-1 ring-[var(--menu-chrome-pill-ring)] transition hover:bg-[var(--menu-tab-hover-bg)] active:scale-[0.96] sm:h-11 sm:w-auto sm:gap-2 sm:px-3.5"
          aria-label={backLabel}
        >
          <MaterialIcon name="arrow_back" className="text-[20px] rtl:scale-x-[-1]" />
          <span className="hidden text-sm font-semibold sm:inline">{backLabel}</span>
        </Link>

        <Link
          to={paths.home}
          className="shrink-0 rounded-full bg-[var(--menu-chrome-pill-bg)] p-0.5 shadow-[0_8px_20px_rgba(13,27,42,0.12)] ring-1 ring-[var(--menu-chrome-pill-ring)] transition hover:opacity-90 active:scale-[0.96] sm:p-[3px]"
          aria-label={cafe?.name || t('platform.menu')}
        >
          {cafe?.logo ? (
            <CloudinaryImage
              src={cafe.logo}
              alt=""
              preset="logo"
              width={48}
              height={48}
              className="h-8 w-8 rounded-full object-cover sm:h-10 sm:w-10"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary sm:h-10 sm:w-10">
              {(cafe?.name || '?').slice(0, 1)}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
