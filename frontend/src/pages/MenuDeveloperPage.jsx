import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import CloudinaryImage from '../components/ui/CloudinaryImage.jsx';
import DocumentHead from '../components/seo/DocumentHead.jsx';
import { useMenuSlug } from '../context/MenuSlugContext.jsx';
import { usePublicMenu } from '../hooks/usePublicMenu.js';
import { useLocale } from '../hooks/useLocale.js';
import { APP_NAME, DEVELOPER_NAME, DEVELOPER_URL, MARKETING_SITE_URL } from '../utils/constants.js';
import { getMenuPaths } from '../utils/hosts.js';
import { resolveMenuBackdrop } from '../utils/menuUi.js';

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

export default function MenuDeveloperPage() {
  const slug = useMenuSlug();
  const { t } = useLocale();
  const { menu } = usePublicMenu(slug);
  const paths = getMenuPaths(slug);
  const backdrop = resolveMenuBackdrop(menu?.cafe || {});

  useLockPageScroll();

  return (
    <div className="fixed inset-x-0 top-0 z-10 flex h-[100svh] max-h-[100svh] flex-col overflow-hidden overscroll-none bg-[#0d1b2a] text-white">
      <DocumentHead
        title={t('menu.developer.pageTitle', { name: APP_NAME })}
        description={t('menu.developer.pageDescription')}
        path={paths.developer}
        robots="noindex,follow"
      />

      {backdrop.image ? (
        <CloudinaryImage
          src={backdrop.image}
          alt=""
          preset="cover"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${backdrop.blur ? 'scale-125 blur-2xl' : ''}`}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0" style={{ background: backdrop.color || '#0d1b2a' }} />
      )}

      <div className="pointer-events-none absolute inset-0 bg-black/50" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35" />

      <div className="absolute left-0 top-0 z-20 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <Link
          to={paths.home}
          className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-black/50 hover:text-white"
        >
          <MaterialIcon name="arrow_back" className="text-[16px] rtl:scale-x-[-1]" />
          <span>{t('menu.developer.backHome')}</span>
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-lg flex-col justify-center px-5 py-16 text-center min-[480px]:px-6 sm:max-w-xl sm:px-8">
        <div className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#e8d5a8] uppercase">{t('menu.developer.kicker')}</p>

          <h1 className="mt-3 font-display text-[clamp(1.75rem,6vmin,2.5rem)] font-semibold tracking-tight text-white">
            {APP_NAME}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-white/78 sm:text-[0.95rem]">{t('menu.developer.productBody')}</p>

          <div className="my-6 h-px bg-white/12" />

          <p className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">{t('menu.developer.craftedBy')}</p>
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-display text-2xl font-semibold tracking-tight text-white transition-colors hover:text-[#e8d5a8]"
          >
            {DEVELOPER_NAME}
          </a>
          <p className="mt-1 text-sm text-white/65">{t('menu.developer.role')}</p>
          <p className="mt-3 text-xs tracking-wide text-white/45">{t('menu.developer.stack')}</p>

          <div className="mt-7 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center">
            <a
              href={DEVELOPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0d1b2a] transition-colors hover:bg-[#f7f6f3] sm:w-auto"
            >
              <MaterialIcon name="mail" className="text-[18px]" />
              {t('menu.developer.contact')}
            </a>
            <a
              href={MARKETING_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#e8d5a8] px-5 py-2.5 text-sm font-semibold text-[#0d1b2a] transition-colors hover:bg-[#f0e2bc] sm:w-auto"
            >
              <MaterialIcon name="language" className="text-[18px]" />
              {t('menu.developer.visitScanosh')}
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs text-white/45">{t('menu.developer.footer', { year: new Date().getFullYear(), name: APP_NAME })}</p>
      </div>
    </div>
  );
}
