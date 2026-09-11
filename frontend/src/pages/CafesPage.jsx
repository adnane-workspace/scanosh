import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Pagination from '../components/ui/Pagination.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../hooks/useLocale.js';
import { listPlatformCafes, updatePlatformCafe } from '../services/platform.service.js';
import { getApiError } from '../utils/apiError.js';
import { formatDate } from '../utils/format.js';
import { getPublicMenuUrl } from '../utils/constants.js';
import { getHomePath } from '../utils/paths.js';
import Field from '../components/ui/Field.jsx';

export default function CafesPage() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const [cafes, setCafes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const skipFilterDebounceRef = useRef(true);

  const loadCafes = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      setError('');

      try {
        const result = await listPlatformCafes({
          page,
          limit: 20,
          q: query.trim(),
          status,
          from: from || undefined,
          to: to || undefined,
        });
        setCafes(result.items);
        setPagination(result.pagination);
      } catch (err) {
        setError(getApiError(err, t, 'dashboard.loadCafesError'));
        setCafes([]);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [from, page, query, status, t, to],
  );

  useEffect(() => {
    setPage(1);
  }, [query, status, from, to]);

  useEffect(() => {
    if (user?.role !== 'superadmin') {
      return undefined;
    }

    if (skipFilterDebounceRef.current) {
      skipFilterDebounceRef.current = false;
      loadCafes();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      loadCafes();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadCafes, user?.role]);

  if (user?.role !== 'superadmin') {
    return <Navigate to={getHomePath(user)} replace />;
  }

  async function handleToggle(cafe) {
    setActionError('');
    setPendingId(cafe._id);

    try {
      await updatePlatformCafe(cafe._id, { isActive: !cafe.isActive });
      await loadCafes({ silent: true });
    } catch (err) {
      setActionError(getApiError(err, t, 'platform.updateError'));
    } finally {
      setPendingId('');
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-on-surface">{t('platform.cafesTitle')}</h1>
          <p className="mt-1 text-on-surface-variant">
            {t('platform.cafesSubtitle')}
          </p>
        </div>
        <Link
          to="/platform/cafes/new"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-md"
        >
          {t('platform.createCafe')}
        </Link>
      </div>

      <div className="grid gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/20 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          size="compact"
          icon="search"
          label={t('platform.searchLabel')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('platform.searchPlaceholder')}
        />
        <Field as="select" size="compact" icon="filter_list" label={t('platform.status')} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">{t('platform.statusAll')}</option>
          <option value="active">{t('platform.statusActive')}</option>
          <option value="inactive">{t('platform.statusInactive')}</option>
        </Field>
        <Field size="compact" type="date" label={t('platform.registeredFrom')} value={from} onChange={(event) => setFrom(event.target.value)} />
        <Field size="compact" type="date" label={t('platform.registeredTo')} value={to} onChange={(event) => setTo(event.target.value)} />
      </div>

      {error || actionError ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {actionError || error}
        </p>
      ) : null}

      <p className="text-sm text-on-surface-variant">
        {loading
          ? t('common.loading')
          : t('platform.count', { filtered: cafes.length, total: pagination.total })}
      </p>

      <div className="overflow-x-auto rounded-2xl bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/20">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-outline-variant/30 text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-semibold">{t('platform.colCafe')}</th>
              <th className="px-4 py-3 font-semibold">{t('platform.colOwner')}</th>
              <th className="px-4 py-3 font-semibold">{t('platform.colMenu')}</th>
              <th className="px-4 py-3 font-semibold">{t('platform.colQr')}</th>
              <th className="px-4 py-3 font-semibold">{t('platform.colRegistered')}</th>
              <th className="px-4 py-3 font-semibold">{t('platform.colStatus')}</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-on-surface-variant" colSpan={7}>
                  {t('common.loading')}
                </td>
              </tr>
            ) : cafes.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-on-surface-variant" colSpan={7}>
                  {t('platform.empty')}
                </td>
              </tr>
            ) : (
              cafes.map((cafe) => (
                <tr key={cafe._id} className="border-t border-outline-variant/20 hover:bg-surface-container-high/50">
                  <td className="px-4 py-3">
                    <Link to={`/platform/cafes/${cafe._id}`} className="font-medium text-primary hover:underline">
                      {cafe.name}
                    </Link>
                    <p className="text-on-surface-variant">{cafe.slug}</p>
                  </td>
                    <td className="px-4 py-3 text-on-surface-variant">{cafe.ownerEmail || t('common.none')}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {t('platform.menuStats', { categories: cafe.categoryCount, products: cafe.productCount })}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {cafe.qrGeneratedAt ? t('qr.statusGenerated') : t('qr.statusNotGenerated')}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{formatDate(cafe.createdAt, locale)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      cafe.isActive ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error'
                    }`}>
                      {cafe.isActive ? t('platform.statusActive') : t('platform.statusInactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <a
                        href={getPublicMenuUrl(cafe.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        {t('platform.menu')}
                      </a>
                      <button
                        type="button"
                        disabled={pendingId === cafe._id}
                        onClick={() => handleToggle(cafe)}
                        className="rounded-lg bg-surface-container-high px-3 py-1.5 text-sm font-semibold text-on-surface disabled:opacity-60"
                      >
                        {cafe.isActive ? t('platform.deactivate') : t('platform.activate')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={setPage}
        disabled={loading}
      />
    </section>
  );
}
