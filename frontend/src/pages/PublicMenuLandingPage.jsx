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
    <div className="fixed inset-x-0 top-0 z-10 flex h-[100svh] max-h-[100svh] flex-col overflow-hidden overscroll-none bg-[#0d1b2a] text-white">
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

      <div className="pointer-events-none absolute inset-0 bg-black/30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-lg flex-col px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-center sm:max-w-xl sm:px-8">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          {cafe.logo ? (
            <div className="rounded-full bg-white/12 p-1 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/35 backdrop-blur-sm">
              <CloudinaryImage
                src={cafe.logo}
                alt=""
                preset="logoHero"
                width={160}
                height={160}
                className="h-[5.25rem] w-[5.25rem] rounded-full object-cover ring-2 ring-white sm:h-[clamp(5.5rem,16vmin,8rem)] sm:w-[clamp(5.5rem,16vmin,8rem)]"
              />
            </div>
          ) : (
            <div className="flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-full bg-white/12 font-display text-3xl font-semibold text-white ring-2 ring-white/85 sm:h-[clamp(5.5rem,16vmin,8rem)] sm:w-[clamp(5.5rem,16vmin,8rem)] sm:text-[clamp(1.5rem,6vmin,2.5rem)]">
              {cafe.name.slice(0, 1)}
            </div>
          )}

          <h1 className="mt-5 max-w-[16rem] break-words font-display text-[2rem] leading-[1.05] font-semibold tracking-[0.06em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] sm:mt-6 sm:max-w-md sm:text-[clamp(2.1rem,6.5vmin,3.1rem)]">
            {cafe.name}
          </h1>

          <span className="mt-4 h-px w-10 bg-[#e8d5a8]/80" aria-hidden />

          {(showAddress || showPhone) && (
            <div className="mt-4 flex max-w-xs flex-col items-center gap-2 text-[13px] text-white/85 sm:max-w-md sm:text-sm">
              {showAddress ? (
                <a
                  href={mapsHref(cafe)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 ring-1 ring-white/12 hover:bg-white/14"
                >
                  <MaterialIcon name="location_on" className="shrink-0 text-[16px] text-[#e8d5a8]" />
                  <span className="truncate">{cafe.address || t('menu.directions')}</span>
                </a>
              ) : null}
              {showPhone ? (
                <a
                  href={telHref(cafe.phone)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 ring-1 ring-white/12 hover:bg-white/14"
                >
                  <MaterialIcon name="call" className="text-[16px] text-[#e8d5a8]" />
                  {cafe.phone}
                </a>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-5 pb-1 pt-4">
          <Link
            to={menuDestination}
            className="inline-flex h-12 w-full max-w-[17.5rem] items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold tracking-[0.02em] text-[#0d1b2a] shadow-[0_14px_36px_rgba(0,0,0,0.32)] transition hover:bg-[#f7f6f3] active:scale-[0.98] sm:h-[3.25rem] sm:max-w-[19rem]"
          >
            <span>{t('menu.viewMenu')}</span>
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
          <MenuDeveloperBadge to={paths.developer} />
        </div>
      </div>
    </LandingShell>
  );
}
