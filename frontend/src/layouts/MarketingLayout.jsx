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

function navLinkClass(active) {
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
    { href: '#accueil', label: t('landing.navHome') },
    { href: '#probleme', label: t('landing.navProblem') },
    { href: '#fonctionnalites', label: t('landing.navFeatures') },
    { href: '#demo', label: t('landing.navDemo') },
    { href: '#comment', label: t('landing.navHow') },
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
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const pill = scrolled || menuOpen || !isHome;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface">
      <header
        className={`pointer-events-none fixed z-50 transition-all duration-500 ${
          pill ? 'inset-x-4 top-4' : 'inset-x-0 top-0 pt-[env(safe-area-inset-top)]'
        }`}
      >
        <nav
          className={`pointer-events-auto mx-auto transition-all duration-500 ${
            pill
              ? 'max-w-[1200px] rounded-2xl border border-on-surface/10 bg-background/80 shadow-lg backdrop-blur-xl'
              : 'max-w-[1400px] bg-transparent'
          }`}
        >
          <div
            className={`flex items-center justify-between gap-3 px-4 transition-all duration-500 sm:px-6 lg:px-8 ${
              pill ? 'h-14' : 'h-16 sm:h-20'
            }`}
          >
            <MarketingLink
              to="/"
              className="relative z-20 flex min-w-0 shrink items-center"
              aria-label={APP_NAME}
              onClick={() => {
                if (path === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <BrandLogo className={`transition-all duration-500 ${pill ? 'h-6 max-w-[9rem] sm:h-7' : 'h-7 max-w-[10rem] sm:h-8 sm:max-w-[12rem]'}`} />
            </MarketingLink>

            <div className="hidden items-center gap-8 lg:flex xl:gap-10">
              {isHome
                ? homeLinks.map((link) => (
                    <a key={link.href} href={link.href} className={navLinkClass(false)}>
                      {link.label}
                      <span className="absolute -bottom-1 start-0 h-px w-0 bg-on-surface transition-all duration-300 group-hover:w-full" />
                    </a>
                  ))
                : pageLinks.map((link) => (
                    <Link key={link.to} to={link.to} className={navLinkClass(link.match(path))}>
                      {link.label}
                      <span className="absolute -bottom-1 start-0 h-px w-0 bg-on-surface transition-all duration-300 group-hover:w-full" />
                    </Link>
                  ))}
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <LanguageSwitcher compact className="hidden md:inline-flex" />
              <AppLink
                to="/login"
                className={`hidden transition-all duration-500 sm:inline-flex ${
                  pill ? 'text-xs text-on-surface/70 hover:text-on-surface' : 'text-sm text-on-surface/70 hover:text-on-surface'
                }`}
              >
                {t('landing.ctaLogin')}
              </AppLink>
              <AppLink
                to="/essai"
                className={`inline-flex items-center justify-center rounded-full bg-on-surface font-medium text-background transition-all duration-500 hover:bg-on-surface/90 ${
                  pill ? 'h-8 px-4 text-xs' : 'h-10 px-5 text-sm sm:h-11 sm:px-6'
                }`}
              >
                {t('landing.ctaTrial')}
              </AppLink>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-on-surface hover:bg-on-surface/5 lg:hidden"
                aria-label={t('common.openMenu')}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MaterialIcon name={menuOpen ? 'close' : 'menu'} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-background px-8 pt-28 pb-[max(2rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="flex h-full flex-col">
            <nav className="flex flex-1 flex-col justify-center gap-6 overflow-y-auto">
              {isHome
                ? homeLinks.map((link, index) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="font-display text-4xl text-on-surface transition-colors hover:text-on-surface-variant sm:text-5xl"
                      style={{ transitionDelay: `${index * 75}ms` }}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))
                : pageLinks.map((link, index) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="font-display text-4xl text-on-surface transition-colors hover:text-on-surface-variant sm:text-5xl"
                      style={{ transitionDelay: `${index * 75}ms` }}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
              <Link
                to={LANDING_CONTACT}
                className="font-display text-4xl text-on-surface transition-colors hover:text-on-surface-variant sm:text-5xl"
                onClick={() => setMenuOpen(false)}
              >
                {t('landing.navContact')}
              </Link>
            </nav>
            <div className="space-y-4 border-t border-on-surface/10 pt-8">
              <div className="md:hidden">
                <LanguageSwitcher compact />
              </div>
              <div className="flex gap-3">
                <AppLink
                  to="/login"
                  className="inline-flex h-14 flex-1 items-center justify-center rounded-full border border-on-surface/20 text-base font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('landing.ctaLogin')}
                </AppLink>
                <AppLink
                  to="/essai"
                  className="inline-flex h-14 flex-1 items-center justify-center rounded-full bg-on-surface text-base font-medium text-background"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('landing.ctaTrial')}
                </AppLink>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
