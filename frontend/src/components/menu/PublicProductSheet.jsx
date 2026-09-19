import { useEffect } from 'react';
import { useLocale } from '../../hooks/useLocale.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import { formatPrice } from '../../utils/format.js';
import ShareButton from './ShareButton.jsx';

export default function PublicProductSheet({ product, onClose, shareTitle, shareText, shareUrl }) {
  const { t, locale } = useLocale();

  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', handleKey);
    };
  }, [product, onClose]);

  if (!product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#0d1b2a]/50 backdrop-blur-[6px] transition-opacity animate-[fadeIn_180ms_ease-out]"
        aria-label={t('common.close')}
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-sheet-title"
        className="relative z-10 flex max-h-[min(92dvh,100svh)] w-full max-w-full flex-col overflow-hidden rounded-t-[1.85rem] bg-white shadow-[0_-24px_60px_rgba(13,27,42,0.28)] animate-[sheetUp_280ms_cubic-bezier(0.22,1,0.36,1)] sm:max-w-[26rem] sm:rounded-[1.85rem] sm:animate-[sheetPop_260ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-white/80 shadow-sm" />
        </div>

        <div className="relative aspect-[5/4] max-h-[42dvh] w-full shrink-0 overflow-hidden bg-[#ebe8e2] sm:aspect-[4/3] sm:max-h-[18rem]">
          {product.image ? (
            <CloudinaryImage
              src={product.image}
              alt=""
              preset="productSheet"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[11rem] w-full items-center justify-center text-[#0d1b2a]/28">
              <MaterialIcon name="restaurant" className="text-5xl" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/45 via-[#0d1b2a]/10 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-[max(0.75rem,env(safe-area-inset-top))] end-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1b2a]/55 text-white backdrop-blur-md transition-colors hover:bg-[#0d1b2a]/75"
            aria-label={t('common.close')}
          >
            <MaterialIcon name="close" className="text-[22px]" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7 sm:pt-6 sm:pb-7">
          <p className="font-display text-[1.65rem] font-semibold leading-none tracking-tight text-[#b8945a] sm:text-[1.85rem]">
            {formatPrice(product.price, locale)}
          </p>

          <h2
            id="product-sheet-title"
            className="mt-3 break-words font-display text-[1.4rem] leading-[1.2] font-semibold tracking-tight text-[#0d1b2a] sm:text-[1.65rem]"
          >
            {product.name}
          </h2>

          <span className="mt-3 block h-px w-10 bg-[#c4a574]" />

          {product.description ? (
            <p className="mt-3.5 text-[0.95rem] leading-relaxed text-[#5c6570] sm:text-base">{product.description}</p>
          ) : null}

          {shareUrl ? (
            <div className="mt-auto pt-7">
              <ShareButton
                title={shareTitle}
                text={shareText}
                url={shareUrl}
                variant="sheet"
                showLabel
                className="w-full"
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
