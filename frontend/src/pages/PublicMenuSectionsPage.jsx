import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CloudinaryImage from '../components/ui/CloudinaryImage.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import { useMenuSlug } from '../context/MenuSlugContext.jsx';
import { setPageMeta, usePublicMenu } from '../hooks/usePublicMenu.js';
import { useLocale } from '../hooks/useLocale.js';
import { getMenuPaths } from '../utils/hosts.js';
import { resolveMenuBackdrop } from '../utils/menuUi.js';
import { getActiveSections, getSectionMenuDestination, sectionIcon } from '../utils/menuSections.js';

const SECTION_FALLBACK = {
  accent: 'bg-white/15 text-white',
  fallback: 'linear-gradient(160deg, #2a3530 0%, #141c24 100%)',
};

const SECTION_THEMES = {
  restaurant: {
    accent: 'bg-[#e8d5a8]/15 text-[#e8d5a8]',
    fallback: 'linear-gradient(160deg, #2a3530 0%, #141c24 100%)',
  },
  cafe: {
    accent: 'bg-[#d4b896]/15 text-[#d4b896]',
    fallback: 'linear-gradient(160deg, #352a22 0%, #141c24 100%)',
  },
};

function SectionsShell({ children }) {
  return (
    <div className="fixed inset-0 z-10 flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-[#0d1b2a] text-white">
      {children}
    </div>
  );
}

function SectionsStatus({ title, message }) {
  return (
    <SectionsShell>
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-white md:text-2xl">{title}</h1>
          <p className="mt-2 max-w-md text-sm text-white/75 md:text-base">{message}</p>
        </div>
      </div>
    </SectionsShell>
  );
}

function SectionCard({ section, to }) {
  const theme = SECTION_THEMES[section.key] || SECTION_FALLBACK;
  const icon = sectionIcon(section.key);

  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-[1.25rem] border border-white/12 bg-white/[0.07] p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all active:scale-[0.99] sm:gap-5 sm:p-4"
    >
      <div className="relative h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:h-[4.75rem] sm:w-[4.75rem]">
        {section.image ? (
          <CloudinaryImage
            src={section.image}
            alt=""
            preset="cover"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: theme.fallback }}>
            <MaterialIcon name={icon} className="text-[1.75rem] text-white/70" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-white sm:text-lg">
          {section.name}
        </h2>
        {section.description ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-white/68 sm:text-sm">
            {section.description}
          </p>
        ) : null}
      </div>

      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${theme.accent} transition-transform group-hover:translate-x-0.5`}
      >
        <MaterialIcon name="arrow_forward" className="text-[20px] rtl:scale-x-[-1]" />
      </span>
    </Link>
  );
}

export default function PublicMenuSectionsPage() {
  const slug = useMenuSlug();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { menu, loading, errorStatus } = usePublicMenu(slug);
  const paths = getMenuPaths(slug);
  const cafe = menu?.cafe;
  const activeSections = useMemo(() => getActiveSections(menu), [menu]);
  const backdrop = resolveMenuBackdrop(cafe);

  useEffect(() => {
    if (cafe) {
      setPageMeta({
        title: t('menu.sectionsTitle'),
        description: cafe.description || t('menu.welcome', { name: cafe.name }),
        robots: 'noindex,follow',
      });
    }
  }, [cafe, t]);

  useEffect(() => {
    if (!menu) {
      return;
    }

    if (activeSections.length === 0) {
      return;
    }

    if (activeSections.length === 1) {
      navigate(getSectionMenuDestination(menu, paths), { replace: true });
    }
  }, [menu, activeSections, navigate, paths]);

  if (loading) {
    return (
      <SectionsShell>
        <div className="flex h-full items-center justify-center">
          <div className="h-12 w-12 animate-pulse rounded-full bg-white/20" />
        </div>
      </SectionsShell>
    );
  }

  if (errorStatus === 403) {
    return <SectionsStatus title={t('menu.unavailableTitle')} message={t('menu.unavailable')} />;
  }

  if (errorStatus || !cafe) {
    return <SectionsStatus title={t('menu.missingTitle')} message={t('menu.missing')} />;
  }

  if (activeSections.length === 0) {
    return <SectionsStatus title={t('menu.emptyTitle')} message={t('menu.empty')} />;
  }

  if (activeSections.length === 1) {
    return null;
  }

  return (
    <SectionsShell>
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

      <div className="pointer-events-none absolute inset-0 bg-black/50" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/75" />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-lg flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:max-w-md sm:px-6">
        <div className="flex items-center py-3">
          <Link
            to={paths.home}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/16"
            aria-label={t('menu.home')}
          >
            <MaterialIcon name="arrow_back" className="text-[22px] rtl:scale-x-[-1]" />
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="mb-8 text-center sm:mb-10">
            {cafe.logo ? (
              <CloudinaryImage
                src={cafe.logo}
                alt=""
                preset="logoHero"
                width={80}
                height={80}
                className="mx-auto h-[4.25rem] w-[4.25rem] rounded-full object-cover shadow-[0_10px_28px_rgba(0,0,0,0.35)] ring-2 ring-white/85"
              />
            ) : (
              <div className="mx-auto flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-white/10 text-xl font-semibold text-white ring-2 ring-white/75">
                {cafe.name.slice(0, 1)}
              </div>
            )}
            <p className="mt-4 text-sm font-medium tracking-wide text-white/70">{cafe.name}</p>
            <h1 className="mt-2 text-balance text-[clamp(1.45rem,5vw,1.85rem)] font-semibold leading-tight tracking-tight text-white">
              {t('menu.sectionsTitle')}
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            {activeSections.map((section) => {
              const firstCategory = section.children?.[0];
              const to = firstCategory?.id
                ? paths.sectionCategory(section.key, firstCategory.id)
                : paths.section(section.key);

              return <SectionCard key={section.key} section={section} to={to} />;
            })}
          </div>
        </div>
      </div>
    </SectionsShell>
  );
}
