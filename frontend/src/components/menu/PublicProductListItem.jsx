import { useLocale } from '../../hooks/useLocale.js';
import { useProductImageReady } from '../../hooks/useProductImageReady.js';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import { formatPrice } from '../../utils/format.js';

export default function PublicProductListItem({ product, onSelect, showDescription = true }) {
  const { locale } = useLocale();
  const ready = useProductImageReady(product.image);

  if (!ready) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex w-full gap-3 bg-[var(--menu-card-bg)] p-3 text-start shadow-[var(--menu-card-shadow)] ring-1 ring-[var(--menu-card-ring)] transition-colors duration-200 animate-[fadeIn_0.35s_ease] active:bg-[#faf9f7] sm:gap-4 sm:p-4"
      style={{ borderRadius: 'var(--menu-card-radius)' }}
    >
      <div
        className="h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden bg-surface-container sm:h-24 sm:w-24"
        style={{ borderRadius: 'calc(var(--menu-card-radius) - 0.35rem)' }}
      >
        <CloudinaryImage src={product.image} alt="" preset="productCard" className="h-full w-full object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[0.95rem] font-semibold leading-snug tracking-tight text-[#0d1b2a] sm:text-base">
            {product.name}
          </h3>
          <p className="shrink-0 text-sm font-semibold tracking-tight text-[#0d1b2a] sm:text-[0.95rem]">
            {formatPrice(product.price, locale)}
          </p>
        </div>

        {showDescription && product.description ? (
          <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-[#4a5560] sm:text-sm">
            {product.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}
