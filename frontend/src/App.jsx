import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLegacyRedirect from './components/common/DashboardLegacyRedirect.jsx';
import ExternalRedirect from './components/common/ExternalRedirect.jsx';
import LandingSeoRedirect from './components/common/LandingSeoRedirect.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import { MenuSlugProvider } from './context/MenuSlugContext.jsx';
import { getSeoDocumentPaths } from './content/seo/index.js';
import { useAuth } from './hooks/useAuth.js';
import { useLocale } from './hooks/useLocale.js';
import {
  buildTenantOrigin,
  currentLocationParts,
  getAppHref,
  getMarketingOrigin,
  parseHost,
  tenantPathFromMenuUrl,
} from './utils/hosts.js';
import { getHomePath } from './utils/paths.js';
import { getDemoMenuUrl } from './utils/demoMenu.js';

const DashboardLayout = lazy(() => import('./layouts/DashboardLayout.jsx'));
const ActivityLogsPage = lazy(() => import('./pages/ActivityLogsPage.jsx'));
const StoragePage = lazy(() => import('./pages/StoragePage.jsx'));
const CafeDetailPage = lazy(() => import('./pages/CafeDetailPage.jsx'));
const CafesPage = lazy(() => import('./pages/CafesPage.jsx'));
const CreateCafePage = lazy(() => import('./pages/CreateCafePage.jsx'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const ProductsPage = lazy(() => import('./pages/ProductsPage.jsx'));
const AiFillPage = lazy(() => import('./pages/AiFillPage.jsx'));
const PublicMenuLandingPage = lazy(() => import('./pages/PublicMenuLandingPage.jsx'));
const MenuDeveloperPage = lazy(() => import('./pages/MenuDeveloperPage.jsx'));
const PublicMenuSectionsPage = lazy(() => import('./pages/PublicMenuSectionsPage.jsx'));
const PublicMenuPage = lazy(() => import('./pages/PublicMenuPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const TrialLeadsPage = lazy(() => import('./pages/TrialLeadsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const PublicMenuSettingsPage = lazy(() => import('./pages/PublicMenuSettingsPage.jsx'));
const SiteLandingPage = lazy(() => import('./pages/SiteLandingPage.jsx'));
const BlogIndexPage = lazy(() => import('./pages/BlogIndexPage.jsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const SeoDocumentPage = lazy(() => import('./pages/SeoDocumentPage.jsx'));

const SEO_DOCUMENT_PATHS = getSeoDocumentPaths();

function RouteFallback() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-on-surface-variant">{t('common.loading')}</p>
    </div>
  );
}

function AppHostHome() {
  const { isAuthenticated, isReady, user } = useAuth();
  const { t } = useLocale();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomePath(user)} replace />;
}

function ToAppRedirect() {
  const location = useLocation();
  return <ExternalRedirect to={getAppHref(`${location.pathname}${location.search}`)} />;
}

function ToMarketingRedirect() {
  const location = useLocation();
  return <ExternalRedirect to={`${getMarketingOrigin()}${location.pathname}${location.search}`} />;
}

function PrintedMenuRedirect() {
  const { slug } = useParams();
  const location = useLocation();
  const loc = currentLocationParts();
  const rest = tenantPathFromMenuUrl(location.pathname) || '/';
  return <ExternalRedirect to={`${buildTenantOrigin(slug, loc)}${rest}${location.search}`} />;
}

function TenantLegacyMenuRedirect() {
  const location = useLocation();
  const rest = tenantPathFromMenuUrl(location.pathname) || '/';
  return <Navigate to={{ pathname: rest, search: location.search }} replace />;
}

function AuthRoutes() {
  return (
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/demo" element={<ExternalRedirect to={getDemoMenuUrl()} />} />
      <Route path="/essai" element={<ExternalRedirect to={getDemoMenuUrl()} />} />
    </Route>
  );
}

function ProductRoutes() {
  return (
    <>
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="ai-fill" element={<AiFillPage />} />
          <Route path="menu" element={<PublicMenuSettingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['superadmin']} />}>
        <Route path="/platform" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="cafes" element={<CafesPage />} />
          <Route path="cafes/new" element={<CreateCafePage />} />
          <Route path="cafes/:id" element={<CafeDetailPage />} />
          <Route path="trials" element={<TrialLeadsPage />} />
          <Route path="logs" element={<ActivityLogsPage />} />
          <Route path="storage" element={<StoragePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </>
  );
}

function MarketingRoutes() {
  return (
    <>
      <Route path="/" element={<SiteLandingPage />} />
      <Route path="/accueil" element={<LandingSeoRedirect />} />
      <Route path="/home" element={<LandingSeoRedirect />} />
      <Route path="/features" element={<LandingSeoRedirect />} />
      <Route path="/product" element={<LandingSeoRedirect />} />
      <Route path="/produit" element={<LandingSeoRedirect />} />
      <Route path="/blog" element={<BlogIndexPage />} />
      <Route path="/tarifs" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      {SEO_DOCUMENT_PATHS.map((path) => (
        <Route key={path} path={path} element={<SeoDocumentPage />} />
      ))}
    </>
  );
}

function UnifiedPublicMenuRoutes() {
  return (
    <Route element={<PublicLayout />}>
      <Route path="/menu/:slug" element={<PublicMenuLandingPage />} />
      <Route path="/menu/:slug/developer" element={<MenuDeveloperPage />} />
      <Route path="/menu/:slug/sections" element={<PublicMenuSectionsPage />} />
      <Route path="/menu/:slug/categories" element={<PublicMenuPage />} />
      <Route path="/menu/:slug/:sectionKey/:categoryId" element={<PublicMenuPage />} />
      <Route path="/menu/:slug/:sectionKey" element={<PublicMenuPage />} />
    </Route>
  );
}

function MenuTenantRoutes({ slug }) {
  return (
    <MenuSlugProvider slug={slug}>
      <Routes>
        <Route path="/login" element={<ToAppRedirect />} />
        <Route path="/register" element={<ToAppRedirect />} />
        <Route path="/demo" element={<ToAppRedirect />} />
        <Route path="/essai" element={<ToAppRedirect />} />
        <Route path="/forgot-password" element={<ToAppRedirect />} />
        <Route path="/app" element={<ToAppRedirect />} />
        <Route path="/app/*" element={<ToAppRedirect />} />
        <Route path="/platform" element={<ToAppRedirect />} />
        <Route path="/platform/*" element={<ToAppRedirect />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PublicMenuLandingPage />} />
          <Route path="/developer" element={<MenuDeveloperPage />} />
          <Route path="/sections" element={<PublicMenuSectionsPage />} />
          <Route path="/categories" element={<PublicMenuPage />} />
          <Route path="/:sectionKey/:categoryId" element={<PublicMenuPage />} />
          <Route path="/:sectionKey" element={<PublicMenuPage />} />
        </Route>
        <Route path="/menu/:slug" element={<TenantLegacyMenuRedirect />} />
        <Route path="/menu/:slug/categories" element={<TenantLegacyMenuRedirect />} />
        <Route path="/menu/:slug/:categoryId" element={<TenantLegacyMenuRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MenuSlugProvider>
  );
}

function ProductHostRoutes({ product }) {
  return (
    <Routes>
      <Route path="/" element={product === 'platform' ? <Navigate to="/platform" replace /> : <AppHostHome />} />
      {AuthRoutes()}
      {ProductRoutes()}
      <Route path="/dashboard" element={<DashboardLegacyRedirect />} />
      <Route path="/dashboard/*" element={<DashboardLegacyRedirect />} />
      <Route path="/menu/:slug" element={<PrintedMenuRedirect />} />
      <Route path="/menu/:slug/categories" element={<PrintedMenuRedirect />} />
      <Route path="/menu/:slug/:categoryId" element={<PrintedMenuRedirect />} />
      <Route path="*" element={<ToMarketingRedirect />} />
    </Routes>
  );
}

function MarketingHostRoutes() {
  return (
    <Routes>
      {MarketingRoutes()}
      <Route path="/login" element={<ToAppRedirect />} />
      <Route path="/register" element={<ToAppRedirect />} />
      <Route path="/demo" element={<ToAppRedirect />} />
      <Route path="/essai" element={<ToAppRedirect />} />
      <Route path="/forgot-password" element={<ToAppRedirect />} />
      <Route path="/app" element={<ToAppRedirect />} />
      <Route path="/app/*" element={<ToAppRedirect />} />
      <Route path="/platform" element={<ToAppRedirect />} />
      <Route path="/platform/*" element={<ToAppRedirect />} />
      <Route path="/menu/:slug" element={<PrintedMenuRedirect />} />
      <Route path="/menu/:slug/categories" element={<PrintedMenuRedirect />} />
      <Route path="/menu/:slug/:categoryId" element={<PrintedMenuRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function UnifiedRoutes() {
  return (
    <Routes>
      {MarketingRoutes()}
      {AuthRoutes()}
      <Route path="/dashboard" element={<DashboardLegacyRedirect />} />
      <Route path="/dashboard/*" element={<DashboardLegacyRedirect />} />
      {ProductRoutes()}
      {UnifiedPublicMenuRoutes()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  const host = parseHost(typeof window !== 'undefined' ? window.location.hostname : '');

  return (
    <Suspense fallback={<RouteFallback />}>
      {host.kind === 'menu' ? (
        <MenuTenantRoutes slug={host.slug} />
      ) : host.kind === 'app' ? (
        <ProductHostRoutes product={host.product} />
      ) : host.kind === 'marketing' ? (
        <MarketingHostRoutes />
      ) : (
        <UnifiedRoutes />
      )}
    </Suspense>
  );
}
