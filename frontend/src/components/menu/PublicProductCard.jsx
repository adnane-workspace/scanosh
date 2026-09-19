import { useLocale } from '../../hooks/useLocale.js';
import { useProductImageReady } from '../../hooks/useProductImageReady.js';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import { formatPrice } from '../../utils/format.js';

export default function PublicProductCard({ product, onSelect, showDescription = true }) {
  const { locale } = useLocale();
  const ready = useProductImageReady(product.image);

  if (!ready) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex h-full min-w-0 flex-col overflow-hidden bg-[var(--menu-card-bg)] text-start shadow-[var(--menu-card-shadow)] ring-1 ring-[var(--menu-card-ring)] transition-transform duration-200 animate-[fadeIn_0.35s_ease] active:scale-[0.985]"
      style={{ borderRadius: 'var(--menu-card-radius)' }}
    >
      <div className="px-2 pt-2 sm:px-0 sm:pt-0">
        <div className="mx-auto aspect-square w-full overflow-hidden rounded-[calc(var(--menu-card-radius)-0.4rem)] bg-surface-container sm:rounded-none sm:aspect-[var(--menu-card-image-ratio,1/1)]">
          <CloudinaryImage src={product.image} alt="" preset="productCard" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-2.5 py-2.5 sm:px-3.5 sm:py-3.5">
        <h3 className="min-w-0 break-words text-sm font-semibold leading-snug tracking-tight text-[#0d1b2a] sm:text-[0.95rem]">
          {product.name}
        </h3>
        {showDescription && product.description ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#5c6570] sm:text-xs">{product.description}</p>
        ) : null}
        <p className="mt-auto pt-2.5 text-sm font-semibold tracking-tight text-[#0d1b2a]">
          {formatPrice(product.price, locale)}
        </p>
      </div>
    </button>
  );
}
