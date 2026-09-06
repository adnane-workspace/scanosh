import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppLink from '../components/common/AppLink.jsx';
import MarketingLink from '../components/common/MarketingLink.jsx';
import AsciiWave from '../components/landing/AsciiWave.jsx';
import BrandLogo from '../components/ui/BrandLogo.jsx';
import LanguageSwitcher from '../components/ui/LanguageSwitcher.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import { useLocale } from '../hooks/useLocale.js';
import { APP_NAME, DEVELOPER_NAME, DEVELOPER_URL } from '../utils/constants.js';
import {
  LANDING_BLOG,
  LANDING_CONTACT,
  LANDING_FEATURES,
  LANDING_HOME,
  LANDING_PRICING,
  LANDING_PRODUCT,
} from '../utils/paths.js';

function navLinkClass(active, onDark = false) {
  if (onDark) {
    return `relative text-sm transition-colors duration-300 group ${
      active ? 'text-white' : 'text-white/75 hover:text-white'
    }`;
  }
  return `relative text-sm transition-colors duration-300 group ${
    active ? 'text-on-surface' : 'text-on-surface/70 hover:text-on-surface'
  }`;
}

export default function MarketingLayout({ children }) {
  const { t } = useLocale();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = location.pathname;
  const isHome = path === '/';

  const pageLinks = [
    { to: LANDING_HOME, label: t('landing.navHome'), match: (value) => value === '/' },
    { to: LANDING_PRODUCT, label: t('landing.navMenuDigital'), match: (value) => value.startsWith('/menu-digital') || value.startsWith('/menu-qr') || value.startsWith('/qr-code') },
    { to: LANDING_FEATURES, label: t('landing.navFeatures'), match: (value) => value.startsWith('/fonctionnalites') || value.startsWith('/dashboard-restaurant') || value.startsWith('/gestion-') || value === '/menu-multilingue' || value === '/statistiques-menu' },
    { to: LANDING_PRICING, label: t('landing.navPricing'), match: (value) => value === '/tarifs' },
    { to: LANDING_BLOG, label: t('landing.navBlog'), match: (value) => value.startsWith('/blog') },
  ];

  const homeLinks = [
    { href: '#comment', label: t('landing.navHow') },
    { href: '#fonctionnalites', label: t('landing.navFeatures') },
    { href: '#faq', label: t('landing.navFaq') },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const pill = scrolled || !isHome;
  const onDarkNav = !pill;
  const activeHash = location.hash;
  const drawerLinks = isHome
    ? [
        ...homeLinks.map((link) => ({
          key: link.href,
          href: link.href,
          label: link.label,
          type: 'anchor',
          active: activeHash === link.href,
        })),
        { key: 'contact', to: LANDING_CONTACT, label: t('landing.navContact'), type: 'route' },
      ]
    : [
        ...pageLinks.map((link) => ({
          key: link.to,
          to: link.to,
          label: link.label,
          type: 'route',
          active: link.match(path),
        })),
        {
          key: 'contact',
          to: LANDING_CONTACT,
          label: t('landing.navContact'),
          type: 'route',
          active: path.startsWith('/contact'),
        },
      ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface">
      <header
        className={`pointer-events-none fixed z-50 transition-all duration-500 ${
          pill || onDarkNav
            ? 'inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] sm:inset-x-4 sm:top-[max(1rem,env(safe-area-inset-top))]'
            : 'inset-x-0 top-0 pt-[env(safe-area-inset-top)]'
        }`}
      >
        <nav
          className={`pointer-events-auto relative mx-auto transition-all duration-500 ${
            pill
              ? 'max-w-[1200px] rounded-2xl border border-on-surface/10 bg-background/80 shadow-lg backdrop-blur-xl'
              : onDarkNav
                ? 'max-w-[1200px] rounded-2xl border border-white/10 bg-[#0d1b2a]/70 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl'
                : 'max-w-[1400px] bg-transparent'
          }`}
        >
          <div
            className={`flex items-center justify-between gap-3 px-4 transition-all duration-500 sm:px-6 lg:px-8 ${
              pill || onDarkNav ? 'h-14' : 'h-16 sm:h-20'
            }`}
          >
            <MarketingLink
              to="/"
              className="relative z-20 flex min-w-0 shrink items-center"
              aria-label={APP_NAME}
              onClick={() => {
                setMenuOpen(false);
                if (path === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <BrandLogo
                onDark={onDarkNav}
                className={`transition-all duration-500 ${
                  pill || onDarkNav ? 'h-6 max-w-[9rem] sm:h-7' : 'h-7 max-w-[10rem] sm:h-8 sm:max-w-[12rem]'
                }`}
              />
            </MarketingLink>

            <div className="hidden min-w-0 items-center gap-5 xl:flex xl:gap-8">
              {isHome
                ? homeLinks.map((link) => (
                    <a key={link.href} href={link.href} className={`${navLinkClass(false, onDarkNav)} shrink-0 whitespace-nowrap`}>
                      {link.label}
                      <span
                        className={`absolute -bottom-1 start-0 h-px w-0 transition-all duration-300 group-hover:w-full ${
                          onDarkNav ? 'bg-white' : 'bg-on-surface'
                        }`}
                      />
                    </a>
                  ))
                : pageLinks.map((link) => (
                    <Link key={link.to} to={link.to} className={`${navLinkClass(link.match(path), onDarkNav)} shrink-0 whitespace-nowrap`}>
                      {link.label}
                      <span
                        className={`absolute -bottom-1 start-0 h-px w-0 transition-all duration-300 group-hover:w-full ${
                          onDarkNav ? 'bg-white' : 'bg-on-surface'
                        }`}
                      />
                    </Link>
                  ))}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <LanguageSwitcher compact onDark={onDarkNav} className="hidden md:inline-flex" />
              <AppLink
                to="/login"
                className={`hidden transition-all duration-500 sm:inline-flex ${
                  onDarkNav
                    ? 'text-sm text-white/80 hover:text-white'
                    : pill
                      ? 'text-xs text-on-surface/70 hover:text-on-surface'
                      : 'text-sm text-on-surface/70 hover:text-on-surface'
                }`}
              >
                {t('landing.ctaLogin')}
              </AppLink>
              <AppLink
                to="/essai"
                className={`inline-flex max-w-[9.5rem] items-center justify-center truncate rounded-full font-medium transition-all duration-500 sm:max-w-none ${
                  onDarkNav
                    ? 'h-9 bg-[#e0e1dd] px-3.5 text-xs text-[#0d1b2a] hover:bg-white sm:h-11 sm:px-6 sm:text-sm'
                    : `bg-on-surface text-background hover:bg-on-surface/90 ${
                        pill ? 'h-8 px-3 text-[11px] sm:px-4 sm:text-xs' : 'h-9 px-3.5 text-xs sm:h-11 sm:px-6 sm:text-sm'
                      }`
                }`}
              >
                {t('landing.ctaTrial')}
              </AppLink>
              <button
                type="button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl xl:hidden ${
                  onDarkNav ? 'text-white hover:bg-white/10' : 'text-on-surface hover:bg-on-surface/5'
                }`}
                aria-label={menuOpen ? t('common.closeMenu') : t('common.openMenu')}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MaterialIcon name={menuOpen ? 'close' : 'menu'} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-[60] xl:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label={t('common.closeMenu')}
          className={`absolute inset-0 bg-[#0d1b2a]/50 transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />

        <aside
          className={`absolute inset-y-0 start-0 flex w-[min(80vw,21rem)] flex-col overflow-hidden bg-[#0d1b2a] text-[#e0e1dd] shadow-[16px_0_48px_rgba(0,0,0,0.4)] transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
          }`}
        >
          {/* Atmosphere */}
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(ellipse 90% 50% at 0% 0%, rgba(119,141,169,0.22), transparent 55%), radial-gradient(ellipse 70% 40% at 100% 100%, rgba(65,90,119,0.2), transparent 50%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(224,225,221,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(224,225,221,0.35) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              maskImage: 'linear-gradient(to bottom, black, transparent 70%)',
            }}
          />

          <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 px-5 pt-[max(1.1rem,env(safe-area-inset-top))] pb-4">
            <div>
              <p className="font-display text-lg font-bold tracking-[0.04em] text-[#e0e1dd]">{APP_NAME}</p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.16em] text-[#778da9] uppercase">
                {t('landing.heroEyebrow')}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#e0e1dd]/85 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t('common.closeMenu')}
              onClick={() => setMenuOpen(false)}
            >
              <MaterialIcon name="close" className="text-[18px]" />
            </button>
          </div>

          <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-3">
            {drawerLinks.map((link, index) => {
              const className = `group relative flex items-center gap-3 rounded-xl px-3 py-3.5 transition-all duration-300 ${
                link.active ? 'bg-white/8' : 'hover:bg-white/5'
              } ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-3 opacity-0'}`;
              const delay = menuOpen ? `${80 + index * 45}ms` : '0ms';

              const inner = (
                <>
                  <span
                    className={`w-7 shrink-0 font-mono text-[11px] tracking-wider ${
                      link.active ? 'text-[#778da9]' : 'text-white/25 group-hover:text-white/45'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`min-w-0 flex-1 font-display text-[1.2rem] font-semibold tracking-tight ${
                      link.active ? 'text-white' : 'text-[#e0e1dd]/88 group-hover:text-white'
                    }`}
                  >
                    {link.label}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-opacity ${
                      link.active ? 'bg-[#778da9] opacity-100' : 'opacity-0 group-hover:bg-white/40 group-hover:opacity-100'
                    }`}
                  />
                  {link.active ? (
                    <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-[#778da9]" />
                  ) : null}
                </>
              );

              if (link.type === 'anchor') {
                return (
                  <a
                    key={link.key}
                    href={link.href}
                    className={className}
                    style={{ transitionDelay: delay }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {inner}
                  </a>
                );
              }

              return (
                <Link
                  key={link.key}
                  to={link.to}
                  className={className}
                  style={{ transitionDelay: delay }}
                  onClick={() => setMenuOpen(false)}
                >
                  {inner}
                </Link>
              );
            })}
          </nav>

          <div className="relative z-10 mt-auto space-y-3 border-t border-white/10 bg-[#0a1520]/55 px-4 pt-4 pb-[max(1.15rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <LanguageSwitcher compact onDark />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AppLink
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#e0e1dd]/22 text-sm font-medium text-[#e0e1dd] transition-colors hover:bg-white/5"
                onClick={() => setMenuOpen(false)}
              >
                {t('landing.ctaLogin')}
              </AppLink>
              <AppLink
                to="/essai"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#e0e1dd] text-sm font-semibold text-[#0d1b2a] transition-colors hover:bg-white"
                onClick={() => setMenuOpen(false)}
              >
                {t('landing.ctaTrial')}
              </AppLink>
            </div>
          </div>
        </aside>
      </div>

      <div
        className={
          isHome
            ? ''
            : 'pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(5.5rem+env(safe-area-inset-top))]'
        }
      >
        {children}
      </div>

      <footer className="relative overflow-hidden border-t border-on-surface/10 bg-background pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-28 opacity-40 lg:block">
          <AsciiWave />
        </div>
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:gap-12 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="mb-6">
                <MarketingLink to="/" aria-label={APP_NAME} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <BrandLogo className="h-8" />
                </MarketingLink>
              </div>
              <p className="max-w-sm text-on-surface-variant">{t('landing.footerBlurb')}</p>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-semibold tracking-wide text-on-surface uppercase">{t('landing.footerProduct')}</h4>
              <ul className="flex flex-col gap-4 text-on-surface-variant">
                <li>
                  <Link to={LANDING_PRODUCT} className="hover:text-on-surface">
                    {t('landing.navMenuDigital')}
                  </Link>
                </li>
                <li>
                  <Link to="/menu-qr-code" className="hover:text-on-surface">
                    {t('landing.navQrMenu')}
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard-restaurant" className="hover:text-on-surface">
                    {t('landing.navDashboard')}
                  </Link>
                </li>
                <li>
                  <Link to={LANDING_PRICING} className="hover:text-on-surface">
                    {t('landing.navPricing')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-semibold tracking-wide text-on-surface uppercase">{t('landing.footerResources')}</h4>
              <ul className="flex flex-col gap-4 text-on-surface-variant">
                <li>
                  <Link to={LANDING_FEATURES} className="hover:text-on-surface">
                    {t('landing.navFeatures')}
                  </Link>
                </li>
                <li>
                  <Link to={LANDING_BLOG} className="hover:text-on-surface">
                    {t('landing.navBlog')}
                  </Link>
                </li>
                <li>
                  <Link to="/maroc/menu-digital" className="hover:text-on-surface">
                    {t('landing.navMorocco')}
                  </Link>
                </li>
                <li>
                  <Link to={LANDING_CONTACT} className="hover:text-on-surface">
                    {t('landing.navContact')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-semibold tracking-wide text-on-surface uppercase">{t('landing.footerContact')}</h4>
              <ul className="flex flex-col gap-4 text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <MaterialIcon name="alternate_email" className="text-[18px]" />
                  <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="hover:text-on-surface">
                    {t('landing.contactMe')}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MaterialIcon name="login" className="text-[18px]" />
                  <AppLink to="/login" className="hover:text-on-surface">
                    {t('auth.loginTitle')}
                  </AppLink>
                </li>
                <li className="flex items-center gap-2">
                  <MaterialIcon name="person_add" className="text-[18px]" />
                  <AppLink to="/register" className="hover:text-on-surface">
                    {t('auth.createCafe')}
                  </AppLink>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-on-surface/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-start">
              <p className="text-label-md text-on-surface-variant">{t('landing.copyright', { year: new Date().getFullYear(), name: APP_NAME })}</p>
              <p className="mt-2 text-label-md text-on-surface-variant">
                {t('landing.developedBy')}{' '}
                <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="text-on-surface hover:underline">
                  {DEVELOPER_NAME}
                </a>
              </p>
            </div>
            <p className="inline-flex items-center justify-center gap-2 font-mono text-xs text-on-surface-variant sm:justify-end">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
              {t('landing.footerStatus')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
