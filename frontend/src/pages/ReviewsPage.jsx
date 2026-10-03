import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useLocale } from '../hooks/useLocale.js';
import { getMyCafe } from '../services/cafe.service.js';
import { getFeedbackStats, listFeedback } from '../services/feedback.service.js';
import { getApiError } from '../utils/apiError.js';
import { deltaTone, distributionPercents, FEEDBACK_PERIODS } from '../utils/feedback.js';
import { formatDateTime } from '../utils/format.js';

const RATINGS = [5, 4, 3, 2, 1];

function stars(rating) {
  return '★★★★★☆☆☆☆☆'.slice(5 - rating, 10 - rating);
}

function chipClass(active) {
  return `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
  }`;
}

export default function ReviewsPage() {
  const { t, locale } = useLocale();
  const [period, setPeriod] = useState('30d');
  const [rating, setRating] = useState(null);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getMyCafe()
      .then((cafe) => {
        if (!cancelled) {
          setGoogleReviewUrl(cafe?.googleReviewUrl || '');
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      getFeedbackStats({ period }),
      listFeedback({ period, page, ...(rating ? { rating } : {}) }),
    ])
      .then(([nextStats, list]) => {
        if (cancelled) {
          return;
        }

        setStats(nextStats);
        setItems(list.items || []);
        setPagination(list.pagination);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiError(err, t, 'reviews.loadError'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period, rating, page, t]);

  const tone = deltaTone(stats?.satisfactionDelta || 0);
  const deltaValue = Math.abs(stats?.satisfactionDelta || 0);
  const deltaLabel =
    tone === 'up'
      ? t('reviews.deltaUp', { value: deltaValue })
      : tone === 'down'
        ? t('reviews.deltaDown', { value: deltaValue })
        : t('reviews.deltaFlat');
  const counts = (stats?.distribution || RATINGS.map((value) => ({ rating: value, count: 0 }))).map((row) => row.count);
  const percents = distributionPercents(counts);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FEEDBACK_PERIODS.map((value) => (
          <button
            key={value}
            type="button"
            className={chipClass(period === value)}
            onClick={() => {
              setPeriod(value);
              setPage(1);
            }}
          >
            {t(`reviews.period.${value}`)}
          </button>
        ))}
      </div>

      {googleReviewUrl === '' ? (
        <p className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface">
          {t('reviews.googleMissing')}{' '}
          <Link to="/app/settings" className="font-semibold text-primary underline-offset-2 hover:underline">
            {t('reviews.googleSettings')}
          </Link>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t('reviews.satisfaction')}
          value={stats ? `${stats.satisfaction}%` : '—'}
          icon="sentiment_satisfied"
          loading={loading}
          hint={stats && stats.total ? deltaLabel : t('reviews.noData')}
        />
        <StatCard
          label={t('reviews.average')}
          value={stats ? stats.average : '—'}
          icon="star"
          loading={loading}
        />
        <StatCard
          label={t('reviews.total')}
          value={stats ? stats.total : '—'}
          icon="forum"
          loading={loading}
        />
        <StatCard
          label={t('reviews.positive')}
          value={stats ? stats.positive : '—'}
          icon="thumb_up"
          loading={loading}
        />
        <StatCard
          label={t('reviews.negative')}
          value={stats ? stats.negative : '—'}
          icon="thumb_down"
          loading={loading}
        />
      </div>

      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
        <h2 className="font-display text-lg font-semibold text-on-surface">{t('reviews.distribution')}</h2>
        <ul className="mt-4 space-y-3">
          {(stats?.distribution || RATINGS.map((value) => ({ rating: value, count: 0 }))).map((row, index) => (
            <li key={row.rating} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="font-medium tracking-tight text-primary">{stars(row.rating)}</span>
              <span className="h-2 overflow-hidden rounded-full bg-surface-container">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${percents[index] || 0}%` }} />
              </span>
              <span className="text-end tabular-nums text-on-surface-variant">{percents[index] || 0}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-on-surface">{t('reviews.recent')}</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={chipClass(rating == null)}
              onClick={() => {
                setRating(null);
                setPage(1);
              }}
            >
              {t('reviews.all')}
            </button>
            {RATINGS.map((value) => (
              <button
                key={value}
                type="button"
                className={chipClass(rating === value)}
                onClick={() => {
                  setRating(value);
                  setPage(1);
                }}
              >
                {t('reviews.stars', { rating: value })}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-surface-container" />
        ) : items.length ? (
          <ul className="mt-4 divide-y divide-outline-variant">
            {items.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium tracking-tight text-primary">{stars(item.rating)}</span>
                  <time className="text-xs text-on-surface-variant" dateTime={item.createdAt}>
                    {formatDateTime(item.createdAt, locale)}
                  </time>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-on-surface">
                  {item.comment ? `“${item.comment}”` : t('reviews.noComment')}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-on-surface-variant">{t('reviews.empty')}</p>
        )}

        {pagination ? (
          <div className="mt-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              disabled={loading}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
