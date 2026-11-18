import { useEffect, useState } from 'react';
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
import PublicMenuLoading from '../components/menu/PublicMenuLoading.jsx';

function telHref(phone) {
  return `tel:${String(phone).replace(/[^\d+]/g, '')}`;
}

function escapeWifiValue(value) {
  return String(value || '').replace(/[\\;,:"]/g, '\\$&');
}

function WifiAccessModal({ wifi, onClose, t }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const security = wifi.security || 'WPA';
    const password = security === 'nopass' ? '' : `P:${escapeWifiValue(wifi.password)};`;
    const payload = `WIFI:T:${security};S:${escapeWifiValue(wifi.ssid)};${password};`;

    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0d1b2a', light: '#ffffff' },
      }))
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError(t('wifi.generateError'));
      });

    return () => {
      cancelled = true;
    };
  }, [wifi.password, wifi.security, wifi.ssid, t]);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(wifi.password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('wifi.copyError'));
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 bg-black/65" aria-label={t('common.close')} onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="wifi-dialog-title"
        className="relative z-10 max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 text-[#0d1b2a] shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="wifi-dialog-title" className="font-display text-xl font-semibold">{t('wifi.title')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('wifi.connectHint')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <MaterialIcon name="close" />
          </button>
        </div>

        {error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            {qrDataUrl ? <img src={qrDataUrl} alt={`${t('wifi.title')} ${wifi.ssid}`} className="h-48 w-48" /> : (
              <div className="flex h-48 w-48 items-center justify-center text-sm text-slate-500">{t('common.loading')}</div>
            )}
          </div>
          <p className="text-center text-xs text-slate-500">{t('wifi.qrHint')}</p>
        </div>

        <dl className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('wifi.network')}</dt>
            <dd className="mt-1 break-all font-semibold">{wifi.ssid}</dd>
          </div>
          {wifi.security === 'nopass' ? (
            <p className="text-slate-600">{t('wifi.openNetwork')}</p>
          ) : (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('wifi.password')}</dt>
              <dd className="mt-1 flex items-center justify-between gap-3">
                <span className="break-all font-semibold">{wifi.password}</span>
                <button type="button" onClick={copyPassword} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold ring-1 ring-slate-200">
                  <MaterialIcon name={copied ? 'check' : 'content_copy'} className="text-base" />
                  {copied ? t('wifi.copied') : t('wifi.copyPassword')}
                </button>
              </dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}

function SocialIcons({ links, wifi, onWifiClick, wifiLabel }) {
  const activeNetworks = [
    {
      id: 'instagram',
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r=".8" className="fill-current stroke-none" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] fill-current">
          <path d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2V13H10v8h3.4Z" />
        </svg>
      ),
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] fill-current">
          <path d="M19.6 7.2a5.8 5.8 0 0 1-3.5-1.2v7.2a5.7 5.7 0 1 1-5.7-5.7c.4 0 .8 0 1.2.1v3.2a2.6 2.6 0 1 0 1.5 2.4V2.8h3.1c.2 1.8 1.5 3.2 3.4 3.5v.9Z" />
        </svg>
      ),
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] fill-current">
          <path d="M12 2a9.7 9.7 0 0 0-8.4 14.6L2.3 22l5.6-1.5A9.8 9.8 0 1 0 12 2Zm0 17.8c-1.4 0-2.8-.4-4-1.1l-.3-.2-3.3.9.9-3.2-.2-.4A7.7 7.7 0 1 1 12 19.8Zm4.2-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.3.1-.4l.4-.5c.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5-.1-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4H8.7c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 3.9 3.5.5.2.9.4 1.2.5.5.2 1 .2 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.2-.2-.2-.4-.3Z" />
        </svg>
      ),
    },
    {
      id: 'youtube',
      label: 'YouTube',
      icon: (
        <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] fill-current">
          <path d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.5v-7l6 3.5-6 3.5Z" />
        </svg>
      ),
    },
  ].filter(({ id }) => links?.[id]?.enabled && links[id].url);
  const showWifi = wifi?.enabled && wifi.ssid;

  return (
    <div className="inline-flex items-center gap-4 text-white/85">
      {showWifi ? (
        <button type="button" onClick={onWifiClick} aria-label={wifiLabel} className="transition hover:scale-110 hover:text-white">
          <MaterialIcon name="wifi" className="text-[28px]" />
        </button>
      ) : null}
      {activeNetworks.map(({ id, label, icon }) => (
        <a
          key={id}
          href={links[id].url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="transition hover:scale-110 hover:text-white"
        >
          {icon}
        </a>
      ))}
    </div>
  );
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
  const [wifiOpen, setWifiOpen] = useState(false);
  const slug = useMenuSlug();
  const { t } = useLocale();
  const { menu, loading, errorStatus } = usePublicMenu(slug, { view: 'landing' });
  const paths = getMenuPaths(slug);

  const productCount = Number.isFinite(menu?.productCount)
    ? menu.productCount
    : countPublicProducts(menu?.categories);
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
        <PublicMenuLoading />
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
          <SocialIcons
            links={ui.socialLinks}
            wifi={ui.wifi}
            wifiLabel={t('wifi.title')}
            onWifiClick={() => setWifiOpen(true)}
          />
          <Link
            to={menuDestination}
            className="inline-flex h-12 w-full max-w-[17.5rem] items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold tracking-[0.02em] text-[#0d1b2a] shadow-[0_14px_36px_rgba(0,0,0,0.32)] transition hover:bg-[#f7f6f3] active:scale-[0.98] sm:h-[3.25rem] sm:max-w-[19rem]"
          >
            <span>{t('menu.viewMenu')}</span>
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
          <div className="flex flex-col items-center gap-2">
            <MenuDeveloperBadge to={paths.developer} />
          </div>
        </div>
      </div>
      {wifiOpen ? <WifiAccessModal wifi={ui.wifi} onClose={() => setWifiOpen(false)} t={t} /> : null}
    </LandingShell>
  );
}
