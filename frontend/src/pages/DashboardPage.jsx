import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import CafeDashboardHero from '../components/dashboard/CafeDashboardHero.jsx';
import MenuHealth from '../components/dashboard/MenuHealth.jsx';
import QrCodeModal from '../components/dashboard/QrCodeModal.jsx';
import QuickActions from '../components/dashboard/QuickActions.jsx';
import RecentProducts from '../components/dashboard/RecentProducts.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../hooks/useLocale.js';
import { generateCafeQr } from '../services/cafe.service.js';
import { getStorageReport, listPlatformCafes } from '../services/platform.service.js';
import { updateProduct } from '../services/product.service.js';
import { getPublicMenuUrl } from '../utils/constants.js';
import { getApiError } from '../utils/apiError.js';
import { firstName, formatBytes, formatDate } from '../utils/format.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { stats, platformOverview = {}, loading, error, refreshStats } = useOutletContext();
  const [recentCafes, setRecentCafes] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrIssuing, setQrIssuing] = useState(false);
  const [qrIssueError, setQrIssueError] = useState('');
  const [qrMode, setQrMode] = useState('view');
  const [storage, setStorage] = useState(null);
  const isSuperAdmin = user?.role === 'superadmin';
  const menuUrl = getPublicMenuUrl(stats.cafe?.slug);
  const qr = stats.cafe?.qr || {
    generated: false,
    locked: false,
    canGenerate: true,
  };
  const greetingName = firstName(user?.name, t('dashboard.fallbackName'));

  useEffect(() => {
    if (!isSuperAdmin) {
      return undefined;
    }

    let cancelled = false;
    setRecentLoading(true);

    listPlatformCafes({ page: 1, limit: 6 })
      .then((result) => {
        if (!cancelled) {
          setRecentCafes(result.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecentCafes([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRecentLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) {
      return undefined;
    }

    let cancelled = false;

    getStorageReport()
      .then((report) => {
        if (!cancelled) {
          setStorage(report);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStorage(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  async function handleConfirmIssue() {
    setQrIssuing(true);
    setQrIssueError('');

    try {
      await generateCafeQr();
      await refreshStats();
    } catch (err) {
      setQrIssueError(getApiError(err, t, 'qr.issueError'));
    } finally {
      setQrIssuing(false);
    }
  }

  function openQr(mode) {
    setQrIssueError('');
    setQrMode(mode);
    setIsQrOpen(true);
  }

  async function handleToggleAvailable(product) {
    setActionError('');

    try {
      await updateProduct(product._id, { available: !product.available });
      await refreshStats();
    } catch (err) {
      setActionError(getApiError(err, t, 'dashboard.availabilityError'));
    }
  }

  const availableRatio =
    stats.totalProducts > 0 ? Math.round((stats.availableProducts / stats.totalProducts) * 100) : 0;

  return (
    <div className="flex w-full flex-col gap-6 lg:gap-8">
      {error || actionError ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {actionError || error}
        </p>
      ) : null}

      {isSuperAdmin ? (
        <section className="flex flex-col gap-6 rounded-[18px] border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_1px_2px_rgba(31,37,35,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
              {t('dashboard.roleSuper')}
            </p>
            <h1 className="mt-2 font-display text-[1.75rem] leading-tight font-semibold tracking-tight text-on-surface sm:text-[2rem]">
              {t('dashboard.hello', { name: greetingName })}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {t('dashboard.subtitleSuper')}
            </p>
          </div>
          <Link
            to="/platform/cafes/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover active:scale-[0.98]"
          >
            <MaterialIcon name="add" className="text-[20px]" />
            {t('platform.createCafe')}
          </Link>
        </section>
      ) : (
        <CafeDashboardHero cafe={stats.cafe} greetingName={greetingName} menuUrl={menuUrl} qr={qr} onOpenQr={openQr} />
      )}

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {isSuperAdmin ? (
          <>
            <StatCard label={t('dashboard.cafes')} value={platformOverview.cafeCount || 0} icon="storefront" loading={loading} />
            <StatCard label={t('dashboard.activeCafes')} value={platformOverview.activeCafeCount || 0} icon="verified" loading={loading} />
            <StatCard
              label={t('storage.photos')}
              value={storage ? storage.totals.photos : '—'}
              icon="photo_library"
              loading={loading && !storage}
            />
            <Link to="/platform/storage" className="block">
              <StatCard
                label={t('storage.storageUsed')}
                value={storage ? formatBytes(storage.totals.bytes, locale) : '—'}
                icon="hard_drive"
                loading={loading && !storage}
              />
            </Link>
          </>
        ) : (
          <>
            <StatCard
              label={t('dashboard.totalProducts')}
              value={stats.totalProducts}
              icon="inventory_2"
              loading={loading}
              to="/app/products"
              hint={t('dashboard.statProductsHint')}
            />
            <StatCard
              label={t('dashboard.categories')}
              value={stats.totalCategories}
              icon="category"
              loading={loading}
              to="/app/categories"
              hint={t('dashboard.statCategoriesHint')}
            />
            <StatCard
              label={t('dashboard.availableProducts')}
              value={stats.availableProducts}
              icon="check_circle"
              loading={loading}
              to="/app/products"
              hint={loading ? undefined : t('dashboard.statAvailableHint', { ratio: availableRatio })}
            />
            <StatCard
              label={t('dashboard.hiddenProducts')}
              value={stats.unavailableProducts || 0}
              icon="visibility_off"
              loading={loading}
              to="/app/products"
              hint={t('dashboard.statHiddenHint')}
            />
          </>
        )}
      </div>

      {isSuperAdmin ? (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { to: '/platform/cafes', icon: 'storefront', label: t('nav.cafes'), hint: t('dashboard.quickCafes') },
              { to: '/platform/storage', icon: 'cloud', label: t('nav.storage'), hint: t('dashboard.quickStorage') },
              { to: '/platform/logs', icon: 'history', label: t('nav.logs'), hint: t('dashboard.quickLogs') },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-start gap-3 rounded-[18px] border border-outline-variant bg-surface-container-lowest p-5 transition-colors duration-200 hover:bg-surface-container-high"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container text-primary">
                  <MaterialIcon name={item.icon} />
                </span>
                <span>
                  <span className="block font-semibold text-on-surface">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-on-surface-variant">{item.hint}</span>
                </span>
                <MaterialIcon name="chevron_right" className="ms-auto text-on-surface-variant group-hover:text-primary" />
              </Link>
            ))}
          </div>

          <div className="overflow-hidden rounded-[18px] border border-outline-variant bg-surface-container-lowest shadow-[0_1px_2px_rgba(31,37,35,0.04)]">
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
              <h2 className="font-display text-xl font-semibold text-on-surface">{t('dashboard.recentCafes')}</h2>
              <Link to="/platform/cafes" className="text-sm font-medium text-primary hover:text-primary-hover">
                {t('dashboard.viewAllCafes')}
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-on-surface-variant">
                  <tr>
                    <th className="px-5 py-3 font-semibold">{t('platform.colCafe')}</th>
                    <th className="px-5 py-3 font-semibold">{t('platform.colOwner')}</th>
                    <th className="px-5 py-3 font-semibold">{t('platform.colMenu')}</th>
                    <th className="px-5 py-3 font-semibold">{t('platform.colRegistered')}</th>
                    <th className="px-5 py-3 font-semibold">{t('platform.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoading ? (
                    <tr>
                      <td className="px-5 py-6 text-on-surface-variant" colSpan={5}>
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : recentCafes.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-on-surface-variant" colSpan={5}>
                        {t('platform.empty')}
                      </td>
                    </tr>
                  ) : (
                    recentCafes.map((cafe) => (
                      <tr key={cafe._id} className="border-t border-outline-variant/15 hover:bg-surface-container-high/60">
                        <td className="px-5 py-3">
                          <Link to={`/platform/cafes/${cafe._id}`} className="font-medium text-primary hover:underline">
                            {cafe.name}
                          </Link>
                          <p className="text-on-surface-variant">{cafe.slug}</p>
                        </td>
                        <td className="px-5 py-3 text-on-surface-variant">{cafe.ownerEmail || t('common.none')}</td>
                        <td className="px-5 py-3 text-on-surface-variant">
                          {t('platform.menuStats', { categories: cafe.categoryCount, products: cafe.productCount })}
                        </td>
                        <td className="px-5 py-3 text-on-surface-variant">{formatDate(cafe.createdAt, locale)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              cafe.isActive ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error'
                            }`}
                          >
                            {cafe.isActive ? t('platform.statusActive') : t('platform.statusInactive')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
      <>
      <QuickActions menuUrl={menuUrl} hasCategory={(stats.totalCategories || 0) > 0} />
      <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-3 xl:gap-6">
        <div className="xl:col-span-2">
          <RecentProducts
            products={stats.recentProducts}
            loading={loading}
            onToggleAvailable={handleToggleAvailable}
          />
        </div>
        <MenuHealth stats={stats} qr={qr} loading={loading} />
      </div>
      </>
      )}

      {isSuperAdmin ? null : (
        <QrCodeModal
          open={isQrOpen}
          cafeName={stats.cafe?.name}
          menuUrl={menuUrl}
          slug={stats.cafe?.slug}
          needsIssue={qrMode === 'issue' && qr.canGenerate}
          issuing={qrIssuing}
          issueError={qrIssueError}
          onConfirmIssue={handleConfirmIssue}
          locked={qr.locked}
          onClose={() => setIsQrOpen(false)}
        />
      )}
    </div>
  );
}
