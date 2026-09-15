import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuDeveloperBadge from '../components/menu/MenuDeveloperBadge.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import CloudinaryImage from '../components/ui/CloudinaryImage.jsx';
import DocumentHead from '../components/seo/DocumentHead.jsx';
import { useMenuSlug } from '../context/MenuSlugContext.jsx';
import { countPublicProducts, setPageMeta, usePublicMenu } from '../hooks/usePublicMenu.js';
import { restaurantJsonLd } from '../utils/seoJsonLd.js';
import { useLocale } from '../hooks/useLocale.js';
import { getMenuPaths } from '../utils/hosts.js';
import { hasCoordinates, mapsHref } from '../utils/location.js';
import { normalizeMenuUi, resolveMenuBackdrop } from '../utils/menuUi.js';
import { getSectionMenuDestination } from '../utils/menuSections.js';

function telHref(phone) {
  return `tel:${String(phone).replace(/[^\d+]/g, '')}`;
}

function useLockPageScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
    };
  }, []);
}

function LandingShell({ children }) {
  useLockPageScroll();

  return (
    <div className="fixed inset-0 z-10 flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-[#0d1b2a] text-white">
      {children}
    </div>
  );
}

function LandingStatus({ title, message }) {
  return (
    <LandingShell>
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-2 max-w-md text-sm text-white/75">{message}</p>
        </div>
      </div>
    </LandingShell>
  );
}

export default function PublicMenuLandingPage() {
  const slug = useMenuSlug();
  const { t } = useLocale();
  const { menu, loading, errorStatus } = usePublicMenu(slug);
  const paths = getMenuPaths(slug);

  const productCount = countPublicProducts(menu?.categories);
  const indexable = Boolean(menu?.cafe && productCount > 0);
  const menuDestination = getSectionMenuDestination(menu, paths);

  useEffect(() => {
    if (menu?.cafe) {
      setPageMeta({
        title: menu.cafe.name,
        description: menu.cafe.description || t('menu.welcome', { name: menu.cafe.name }),
        robots: indexable ? 'index,follow' : 'noindex,follow',
      });
      return;
    }

    if (errorStatus) {
      setPageMeta({
        title: t('menu.missingTitle'),
        description: t('menu.missing'),
        robots: 'noindex,follow',
      });
    }
  }, [menu, errorStatus, indexable, t]);

  if (loading) {
    return (
      <LandingShell>
        <div className="flex h-full items-center justify-center">
          <div className="h-16 w-16 animate-pulse rounded-full bg-white/20" />
        </div>
      </LandingShell>
    );
  }

  if (errorStatus === 403) {
    return <LandingStatus title={t('menu.unavailableTitle')} message={t('menu.unavailable')} />;
  }

  if (errorStatus && errorStatus !== 404) {
    return <LandingStatus title={t('menu.loadErrorTitle')} message={t('menu.loadError')} />;
  }

  if (errorStatus || !menu?.cafe) {
    return <LandingStatus title={t('menu.missingTitle')} message={t('menu.missing')} />;
  }

  const { cafe } = menu;
  const ui = normalizeMenuUi(cafe.menuUi);
  const backdrop = resolveMenuBackdrop(cafe);
  const located = Boolean(cafe.address || hasCoordinates(cafe));
  const showAddress = ui.showAddress && located;
  const showPhone = ui.showPhone && Boolean(cafe.phone);

  return (
    <LandingShell>
      <DocumentHead
        title={`${cafe.name}`}
        description={cafe.description || t('menu.welcome', { name: cafe.name })}
        path={paths.home}
        robots={indexable ? 'index,follow' : 'noindex,follow'}
        jsonLd={indexable ? restaurantJsonLd(cafe, slug) : undefined}
      />

      {backdrop.image ? (
        <CloudinaryImage
          src={backdrop.image}
          alt=""
          preset="cover"
          fetchPriority="high"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${
            backdrop.blur ? 'scale-125 blur-2xl' : ''
          }`}
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: backdrop.color || '#0d1b2a' }}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-black/40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />

      <div className="absolute left-0 top-0 z-20 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <MenuDeveloperBadge to={paths.developer} />
      </div>

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-lg flex-col justify-end px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 text-center min-[480px]:px-6 sm:max-w-xl sm:justify-center sm:px-8 sm:py-16">
        <div className="flex min-h-0 w-full shrink flex-col items-center">
          {cafe.logo ? (
            <CloudinaryImage
              src={cafe.logo}
              alt=""
              preset="logoHero"
              width={144}
              height={144}
              className="h-[clamp(4rem,18vmin,8.5rem)] w-[clamp(4rem,18vmin,8.5rem)] shrink-0 rounded-full object-cover shadow-[0_12px_32px_rgba(0,0,0,0.35)] ring-[3px] ring-white"
            />
          ) : (
            <div className="flex h-[clamp(4rem,18vmin,8.5rem)] w-[clamp(4rem,18vmin,8.5rem)] shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-[clamp(1.35rem,6vmin,2.5rem)] font-semibold text-white ring-[3px] ring-white/80">
              {cafe.name.slice(0, 1)}
            </div>
          )}

          <h1 className="mt-5 max-w-full shrink-0 line-clamp-2 break-words text-balance font-display text-[clamp(1.75rem,7vmin,3.25rem)] leading-[1.1] font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            {cafe.name}
          </h1>

          {(showAddress || showPhone) && (
            <div className="mt-4 flex max-w-md flex-col items-center gap-1.5 text-sm text-white/90">
              {showAddress ? (
                <a
                  href={mapsHref(cafe)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 hover:text-white"
                >
                  <MaterialIcon name="location_on" className="shrink-0 text-[18px] text-[#e8d5a8]" />
                  <span className="truncate">{cafe.address || t('menu.directions')}</span>
                </a>
              ) : null}
              {showPhone ? (
                <a href={telHref(cafe.phone)} className="inline-flex items-center gap-1.5 hover:text-white">
                  <MaterialIcon name="call" className="text-[18px] text-[#e8d5a8]" />
                  {cafe.phone}
                </a>
              ) : null}
            </div>
          )}

          <Link
            to={menuDestination}
            className="mt-7 inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0d1b2a] shadow-[0_12px_32px_rgba(0,0,0,0.28)] transition-transform hover:bg-[#f7f6f3] active:scale-[0.98] sm:w-auto sm:min-w-52"
          >
            <span className="tracking-wide">{t('menu.viewMenu')}</span>
            <MaterialIcon name="arrow_forward" className="text-[20px]" />
          </Link>
        </div>
      </div>
    </LandingShell>
  );
}
