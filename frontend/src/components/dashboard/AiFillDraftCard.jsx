import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';

function IconAction({ label, disabled, onClick, icon, spinning }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75 disabled:opacity-50"
    >
      <MaterialIcon name={spinning ? 'progress_activity' : icon} className={spinning ? 'animate-spin text-[18px]' : 'text-[18px]'} />
    </button>
  );
}

export default function AiFillDraftCard({
  product,
  sectionKey,
  mode = 'review',
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
  const photosMode = mode === 'photos';

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(13,27,42,0.07)] ring-1 transition ${
        selected ? 'ring-black/8' : 'opacity-45 ring-dashed ring-black/15'
      }`}
    >
      <div className={`relative overflow-hidden bg-[#eef0f2] ${photosMode ? 'aspect-square' : 'aspect-[4/3]'}`}>
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
            disabled={isPublished || busy || !photosMode}
            onClick={onGenerate}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#5c6570] disabled:cursor-default"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0d1b2a] shadow-sm">
              <MaterialIcon
                name={generatingNow ? 'progress_activity' : photosMode ? 'auto_awesome' : 'image'}
                className={generatingNow ? 'animate-spin text-[22px]' : 'text-[22px]'}
              />
            </span>
            <span className="px-3 text-center text-sm font-semibold text-[#0d1b2a]">
              {photosMode
                ? generating
                  ? t('aiFill.generatingThisPhoto')
                  : t('aiFill.generateThisPhoto')
                : t('aiFill.photoLater')}
            </span>
          </button>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold">
            <MaterialIcon name="progress_activity" className="me-2 animate-spin" />
            {t('aiFill.photoUploading')}
          </div>
        ) : null}

        <label className="absolute start-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#0d1b2a]"
            checked={selected}
            disabled={isPublished}
            onChange={(event) => onChange({ selected: event.target.checked })}
          />
        </label>

        {product.needsReview ? (
          <span className="absolute end-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-800 uppercase">
            {t('aiFill.needsReview')}
          </span>
        ) : null}

        {!isPublished && photosMode ? (
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-1.5">
            {product.image ? (
              <button
                type="button"
                disabled={busy || generatingNow}
                onClick={onGenerate}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-[#0d1b2a] shadow-sm disabled:opacity-50"
              >
                <MaterialIcon
                  name={generatingNow ? 'progress_activity' : 'auto_awesome'}
                  className={generatingNow ? 'animate-spin text-[16px]' : 'text-[16px]'}
                />
                {generatingNow ? t('aiFill.generatingThisPhoto') : t('aiFill.regenerateThisPhoto')}
              </button>
            ) : null}
            <span className="ms-auto flex gap-1">
              <IconAction label={t('aiFill.chooseLibrary')} disabled={busy} onClick={onPickLibrary} icon="photo_library" />
              <IconAction label={t('aiFill.uploadPhoto')} disabled={busy} onClick={onUpload} icon="upload" />
              {product.image ? (
                <IconAction label={t('aiFill.removePhoto')} disabled={busy} onClick={onRemoveImage} icon="hide_image" />
              ) : null}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {photosMode ? (
          <p className="truncate text-sm font-semibold text-[#0d1b2a]">{product.name || t('aiFill.productName')}</p>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_5.25rem] gap-2">
              <input
                value={product.name}
                disabled={isPublished}
                onChange={(event) => onChange({ name: event.target.value })}
                placeholder={t('aiFill.productName')}
                className="h-10 rounded-xl border-0 bg-[#f4f5f6] px-3 text-sm font-semibold text-[#0d1b2a] outline-none focus:bg-white focus:ring-1 focus:ring-[#0d1b2a]/20 disabled:opacity-70"
              />
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.price}
                  disabled={isPublished}
                  onChange={(event) => onChange({ price: event.target.value })}
                  className="h-10 w-full rounded-xl border-0 bg-[#f4f5f6] pe-8 ps-2 text-sm font-semibold text-[#0d1b2a] outline-none focus:bg-white focus:ring-1 focus:ring-[#0d1b2a]/20 disabled:opacity-70"
                />
                <span className="pointer-events-none absolute inset-e-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#8a9199]">
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
                className="min-h-[3rem] resize-none rounded-xl border-0 bg-[#f4f5f6] px-3 py-2 text-sm text-[#0d1b2a] outline-none placeholder:text-[#8a9199] focus:bg-white focus:ring-1 focus:ring-[#0d1b2a]/20 disabled:opacity-70"
              />
            )}
            {!isPublished ? (
              <button
                type="button"
                onClick={onRemove}
                className="self-end text-[11px] font-semibold text-[#8a9199] hover:text-error"
              >
                {t('aiFill.removeProduct')}
              </button>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
