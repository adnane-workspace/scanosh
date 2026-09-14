import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';

export default function AiFillDraftCard({
  product,
  sectionKey,
  isPublished,
  busy,
  uploading,
  generating,
  suggestingPhotos,
  t,
  onChange,
  onGenerate,
  onUpload,
  onPickLibrary,
  onRemoveImage,
  onRemove,
}) {
  const selected = Boolean(product.selected);
  const generatingNow = generating || suggestingPhotos;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(13,27,42,0.06)] ring-1 transition ${
        selected ? 'ring-outline-variant/70' : 'opacity-50 ring-dashed ring-outline-variant'
      }`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-surface-container">
        {product.image ? (
          <CloudinaryImage
            src={product.image}
            alt=""
            preset="productCard"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <button
            type="button"
            disabled={isPublished || busy}
            onClick={onGenerate}
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-primary,#0d1b2a)_10%,transparent),transparent_70%)] text-on-surface-variant disabled:opacity-60"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MaterialIcon
                name={generatingNow ? 'progress_activity' : 'auto_awesome'}
                className={generatingNow ? 'animate-spin text-[22px]' : 'text-[22px]'}
              />
            </span>
            <span className="text-sm font-semibold text-on-surface">
              {generating ? t('aiFill.generatingThisPhoto') : t('aiFill.generateThisPhoto')}
            </span>
          </button>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70 text-sm font-semibold">
            <MaterialIcon name="progress_activity" className="me-2 animate-spin" />
            {t('aiFill.photoUploading')}
          </div>
        ) : null}

        <label className="absolute start-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-primary,#0d1b2a)]"
            checked={selected}
            disabled={isPublished}
            onChange={(event) => onChange({ selected: event.target.checked })}
          />
        </label>

        {!isPublished ? (
          <div className="absolute inset-x-3 bottom-3 flex gap-1 opacity-100">
            {product.image ? (
              <button
                type="button"
                disabled={busy || generatingNow}
                onClick={onGenerate}
                className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
              >
                <MaterialIcon
                  name={generatingNow ? 'progress_activity' : 'auto_awesome'}
                  className={`text-[14px] ${generatingNow ? 'animate-spin' : ''}`}
                />
                {generatingNow ? t('aiFill.generatingThisPhoto') : t('aiFill.regenerateThisPhoto')}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={onUpload}
              className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
            >
              <MaterialIcon name="upload" className="text-[14px]" />
              {t('aiFill.uploadPhoto')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onPickLibrary}
              className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
            >
              <MaterialIcon name="photo_library" className="text-[14px]" />
              {t('aiFill.chooseLibrary')}
            </button>
            {product.image ? (
              <button
                type="button"
                onClick={onRemoveImage}
                className="ms-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label={t('aiFill.removePhoto')}
              >
                <MaterialIcon name="hide_image" className="text-[15px]" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
          <input
            value={product.name}
            disabled={isPublished}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={t('aiFill.productName')}
            className="h-11 rounded-2xl border-0 bg-surface-container px-3 text-sm font-semibold text-on-surface outline-none ring-0 focus:bg-background focus:ring-1 focus:ring-primary/30 disabled:opacity-70"
          />
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={product.price}
              disabled={isPublished}
              onChange={(event) => onChange({ price: event.target.value })}
              className="h-11 w-full rounded-2xl border-0 bg-surface-container pe-8 ps-2.5 text-sm font-semibold text-on-surface outline-none focus:bg-background focus:ring-1 focus:ring-primary/30 disabled:opacity-70"
            />
            <span className="pointer-events-none absolute inset-e-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-on-surface-variant">
              {t('aiFill.currency')}
            </span>
          </div>
        </div>
        {sectionKey === 'cafe' ? null : (
        <textarea
          value={product.description || ''}
          disabled={isPublished}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={2}
          maxLength={500}
          placeholder={t('aiFill.productDescription')}
          className="min-h-[3.5rem] resize-none rounded-2xl border-0 bg-surface-container px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:bg-background focus:ring-1 focus:ring-primary/30 disabled:opacity-70"
        />
        )}
        <div className="flex items-center justify-between">
          {product.needsReview ? (
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              {t('aiFill.needsReview')}
            </span>
          ) : (
            <span />
          )}
          {!isPublished ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] font-semibold text-on-surface-variant hover:text-error"
            >
              {t('aiFill.removeProduct')}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
