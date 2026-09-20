import { useLocale } from '../../hooks/useLocale.js';
import { useProductImageReady } from '../../hooks/useProductImageReady.js';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import { formatPrice } from '../../utils/format.js';

export default function PublicProductListItem({ product, onSelect, showDescription = true, index = 0 }) {
  const { locale } = useLocale();
  const ready = useProductImageReady(product.image);

  if (!ready) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="menu-product-enter menu-product-row flex w-full min-w-0 gap-2.5 bg-[var(--menu-card-bg)] p-2.5 text-start shadow-[var(--menu-card-shadow)] ring-1 ring-[var(--menu-card-ring)] transition-[transform,box-shadow,background-color] duration-300 ease-out active:scale-[0.99] sm:gap-4 sm:p-4"
      style={{
        borderRadius: 'var(--menu-card-radius)',
        '--product-delay': `${Math.min(index, 14) * 45}ms`,
      }}
    >
      <div
        className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden bg-surface-container sm:h-24 sm:w-24"
        style={{ borderRadius: 'calc(var(--menu-card-radius) - 0.35rem)' }}
      >
        <CloudinaryImage src={product.image} alt="" preset="productCard" className="h-full w-full object-cover will-change-transform" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <h3 className="min-w-0 break-words text-[0.95rem] font-semibold leading-snug tracking-tight text-[#0d1b2a] sm:text-base">
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
