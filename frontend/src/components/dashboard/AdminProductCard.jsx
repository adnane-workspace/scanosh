import { useLocale } from '../../hooks/useLocale.js';
import { formatPrice } from '../../utils/format.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import AvailabilityToggle from './AvailabilityToggle.jsx';

export default function AdminProductCard({
  product,
  toggling,
  suggesting,
  onEdit,
  onDelete,
  onToggleAvailable,
  onSuggestImage,
}) {
  const { t, locale } = useLocale();
  const available = Boolean(product.available);
  const canSuggest = Boolean(onSuggestImage);
  const showEmptyPick = canSuggest && !product.image;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-surface-container shadow-sm transition-shadow hover:shadow-md ${
        available ? '' : 'opacity-75'
      }`}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {canSuggest ? (
          <button
            type="button"
            disabled={suggesting}
            onClick={() => onSuggestImage(product)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-on-surface shadow-sm transition-colors hover:bg-surface disabled:opacity-50"
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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-on-surface shadow-sm transition-colors hover:bg-surface"
          aria-label={`${t('common.edit')} ${product.name}`}
        >
          <MaterialIcon name="edit" className="text-[18px]" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-error-container/90 text-on-error-container shadow-sm transition-colors hover:bg-error-container"
          aria-label={`${t('common.delete')} ${product.name}`}
        >
          <MaterialIcon name="delete" className="text-[18px]" />
        </button>
      </div>

      <div className={`relative h-48 w-full bg-surface-container-highest ${available ? '' : 'grayscale-[30%]'}`}>
        {product.image ? (
          <CloudinaryImage src={product.image} alt="" preset="productCard" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-on-surface-variant">
            <MaterialIcon name="image" className="text-4xl" />
            {showEmptyPick ? (
              <button
                type="button"
                disabled={suggesting}
                onClick={() => onSuggestImage(product)}
                className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm disabled:opacity-50"
              >
                <MaterialIcon
                  name={suggesting ? 'progress_activity' : 'photo_library'}
                  className={`text-[14px] ${suggesting ? 'animate-spin' : ''}`}
                />
                {suggesting ? t('products.suggestingImage') : t('products.suggestImage')}
              </button>
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
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="flex-1 font-display text-headline-lg-mobile font-semibold text-on-surface line-clamp-1">
            {product.name}
          </h3>
          <span
            className={`ml-3 shrink-0 text-body-lg font-bold ${
              available ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            {formatPrice(product.price, locale)}
          </span>
        </div>
        <p className="mb-3 flex-1 text-on-surface-variant line-clamp-2">
          {product.description || t('products.noDescription')}
        </p>
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
