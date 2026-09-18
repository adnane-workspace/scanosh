import { useLocale } from '../../hooks/useLocale.js';
import { formatPrice } from '../../utils/format.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import AvailabilityToggle from './AvailabilityToggle.jsx';

export default function AdminProductCard({
  product,
  toggling,
  suggesting,
  generating,
  onEdit,
  onDelete,
  onToggleAvailable,
  onSuggestImage,
  onGenerateImage,
}) {
  const { t, locale } = useLocale();
  const available = Boolean(product.available);
  const canPick = Boolean(onSuggestImage);
  const canGenerate = Boolean(onGenerateImage);
  const busy = Boolean(suggesting || generating);
  const showEmptyPick = (canPick || canGenerate) && !product.image;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-surface-container shadow-sm transition-shadow hover:shadow-md ${
        available ? '' : 'opacity-75'
      }`}
    >
      <div className="absolute top-2 right-2 z-10 flex rounded-full border border-white/40 bg-surface/90 p-0.5 shadow-sm backdrop-blur-sm">
        {canPick ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onSuggestImage(product)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-lowest hover:text-on-surface disabled:opacity-50"
            aria-label={t('products.suggestImage')}
            title={t('products.suggestImage')}
          >
            <MaterialIcon
              name={suggesting ? 'progress_activity' : 'photo_library'}
              className={`text-[18px] ${suggesting ? 'animate-spin' : ''}`}
            />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-lowest hover:text-on-surface"
          aria-label={`${t('common.edit')} ${product.name}`}
          title={t('common.edit')}
        >
          <MaterialIcon name="edit" className="text-[18px]" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
          aria-label={`${t('common.delete')} ${product.name}`}
          title={t('common.delete')}
        >
          <MaterialIcon name="delete" className="text-[18px]" />
        </button>
      </div>

      <div className={`relative h-48 w-full bg-surface-container-highest ${available ? '' : 'grayscale-[30%]'}`}>
        {product.image ? (
          <>
            <CloudinaryImage src={product.image} alt="" preset="productCard" className="h-full w-full object-cover" />
            {canGenerate ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onGenerateImage(product)}
                className="absolute bottom-2 end-2 z-10 inline-flex h-8 items-center gap-1 rounded-full bg-black/65 px-3 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-black/75 disabled:opacity-50"
              >
                <MaterialIcon
                  name={generating ? 'progress_activity' : 'auto_awesome'}
                  className={`text-[14px] ${generating ? 'animate-spin' : ''}`}
                />
                {generating ? t('products.generatingPhoto') : t('products.regeneratePhoto')}
              </button>
            ) : null}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-on-surface-variant">
            <MaterialIcon name="image" className="text-4xl" />
            {showEmptyPick ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {canGenerate ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onGenerateImage(product)}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-[11px] font-semibold text-on-primary shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    <MaterialIcon
                      name={generating ? 'progress_activity' : 'auto_awesome'}
                      className={`text-[14px] ${generating ? 'animate-spin' : ''}`}
                    />
                    {generating ? t('products.generatingPhoto') : t('products.generatePhoto')}
                  </button>
                ) : null}
                {canPick ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSuggestImage(product)}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-outline-variant/80 bg-surface/90 px-3 text-[11px] font-semibold text-on-surface shadow-sm transition hover:bg-surface disabled:opacity-50"
                  >
                    <MaterialIcon
                      name={suggesting ? 'progress_activity' : 'photo_library'}
                      className={`text-[14px] ${suggesting ? 'animate-spin' : ''}`}
                    />
                    {suggesting ? t('products.suggestingImage') : t('products.suggestImage')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        <div className="absolute top-2 left-2 rounded-full bg-surface/90 px-3 py-1 shadow-sm backdrop-blur-sm">
          <span className="text-label-md font-medium tracking-wider text-on-surface-variant uppercase">
            {product.categoryName || t('dashboard.uncategorized')}
          </span>
        </div>
        {available ? null : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/40">
            <span className="rounded-full bg-error px-4 py-1 text-label-lg font-semibold tracking-[0.05em] text-on-error shadow-sm">
              {t('products.outOfStockBanner')}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-stack-md">
        <div className="mb-2 flex flex-col gap-1 sm:mb-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <h3 className="min-w-0 break-words font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-on-surface sm:text-lg">
            {product.name}
          </h3>
          <span
            className={`shrink-0 whitespace-nowrap text-base font-bold tabular-nums sm:text-body-lg ${
              available ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            {formatPrice(product.price, locale)}
          </span>
        </div>
        {product.sectionKey === 'cafe' ? null : (
        <p className="mb-3 flex-1 text-on-surface-variant line-clamp-2">
          {product.description || t('products.noDescription')}
        </p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-2">
          <span className="text-label-md font-medium text-on-surface-variant">{t('dashboard.availability')}</span>
          <AvailabilityToggle
            checked={available}
            disabled={toggling}
            label={t('dashboard.toggleLabel', { name: product.name })}
            onChange={() => onToggleAvailable(product)}
          />
        </div>
      </div>
    </article>
  );
}
