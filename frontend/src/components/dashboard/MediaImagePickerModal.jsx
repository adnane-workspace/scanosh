import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../../hooks/useLocale.js';
import { applyMediaImage, getProductImageCandidates, listMediaLibrary } from '../../services/product.service.js';
import { getApiError } from '../../utils/apiError.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';

export default function MediaImagePickerModal({ open, product, onClose, onApplied }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('');
  const [suggested, setSuggested] = useState([]);
  const [library, setLibrary] = useState([]);

  const title = product?.name || '';

  useEffect(() => {
    if (!open || !product?._id) return undefined;

    let cancelled = false;
    setError('');
    setSearch(product.name || '');
    setLoading(true);

    (async () => {
      try {
        const data = await getProductImageCandidates(product._id);
        if (cancelled) return;
        setSuggested(Array.isArray(data?.suggested) ? data.suggested : []);
        setLibrary(Array.isArray(data?.library) ? data.library : []);
        if (data?.sectionKey === 'cafe' || data?.sectionKey === 'restaurant') {
          setSection(data.sectionKey);
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err, t, 'products.pickImageError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, product?._id, product?.name, t]);

  async function handleSearch(event) {
    event?.preventDefault?.();
    setLoading(true);
    setError('');
    try {
      const data = await listMediaLibrary({
        section,
        search: search.trim(),
        limit: 60,
      });
      setLibrary(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(getApiError(err, t, 'products.pickImageError'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePick(item) {
    if (!product?._id || !item?.id) return;
    setApplyingId(item.id);
    setError('');
    try {
      const result = await applyMediaImage(product._id, {
        mediaId: item.id,
        imageUrl: item.image,
      });
      onApplied?.(result?.product || null, item);
      onClose?.();
    } catch (err) {
      setError(getApiError(err, t, 'products.pickImageError'));
    } finally {
      setApplyingId(null);
    }
  }

  const gallery = useMemo(() => {
    const seen = new Set();
    const rows = [];
    for (const item of [...suggested, ...library]) {
      const id = String(item?.id || '');
      if (!id || seen.has(id) || !item?.image) continue;
      seen.add(id);
      rows.push(item);
    }
    return rows;
  }, [suggested, library]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/40"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface-container-lowest shadow-xl sm:max-w-3xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-5 py-4">
          <div className="min-w-0">
            <h2 id="media-picker-title" className="font-display text-headline-md font-semibold text-on-surface">
              {t('products.pickImageTitle')}
            </h2>
            <p className="mt-1 truncate text-sm text-on-surface-variant">
              {t('products.pickImageHint', { name: title })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
            aria-label={t('common.close')}
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 border-b border-outline-variant/30 px-5 py-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('products.pickImageSearch')}
            className="min-w-[12rem] flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          />
          <select
            value={section}
            onChange={(event) => setSection(event.target.value)}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
          >
            <option value="">{t('products.pickImageSectionAll')}</option>
            <option value="cafe">{t('products.pickImageSectionCafe')}</option>
            <option value="restaurant">{t('products.pickImageSectionRestaurant')}</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
          >
            <MaterialIcon name="search" className="text-[18px]" />
            {t('products.pickImageSearchAction')}
          </button>
        </form>

        {error ? (
          <p className="mx-5 mt-3 rounded-xl border border-error/20 bg-error-container px-3 py-2 text-sm text-error">
            {error}
          </p>
        ) : null}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && !gallery.length ? (
            <div className="flex items-center justify-center gap-2 py-16 text-on-surface-variant">
              <MaterialIcon name="progress_activity" className="animate-spin" />
              {t('products.pickImageLoading')}
            </div>
          ) : gallery.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((item) => {
                const busy = applyingId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={Boolean(applyingId)}
                    onClick={() => handlePick(item)}
                    className="group overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container text-left transition hover:border-primary disabled:opacity-60"
                  >
                    <div className="relative aspect-[4/3] bg-surface-container-highest">
                      <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      {busy ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
                          <MaterialIcon name="progress_activity" className="animate-spin text-primary" />
                        </div>
                      ) : null}
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="line-clamp-2 text-xs font-medium text-on-surface">{item.title || item.id}</p>
                      {typeof item.score === 'number' ? (
                        <p className="mt-0.5 text-[10px] text-on-surface-variant">
                          {t('products.pickImageScore', { score: item.score })}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-on-surface-variant">{t('products.pickImageEmpty')}</p>
          )}
        </div>
      </section>
    </div>
  );
}
