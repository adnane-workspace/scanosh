import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { DEFAULT_MENU_BACKGROUND, normalizeHexColor } from '../../utils/menuUi.js';

const PRESETS = [
  '#f4f2ee',
  '#e0e1dd',
  '#f4efe6',
  '#f7f3ee',
  '#dce3ea',
  '#0d1b2a',
  '#1b263b',
  '#415a77',
  '#2a1a14',
  '#1c2e24',
  '#3a1d28',
  '#3d2b1f',
];

function ColorSwatch({ hex, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(hex)}
      title={hex}
      aria-pressed={selected}
      className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-xl transition-transform hover:scale-105 ${
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest' : 'ring-1 ring-black/10'
      }`}
      style={{ background: hex }}
    >
      {selected ? (
        <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-sm">
          <MaterialIcon name="check" className="text-[18px]" filled />
        </span>
      ) : null}
    </button>
  );
}

function MenuPreview({ menuUi, activeHex }) {
  const showImage = menuUi.bgMode === 'image' && menuUi.backgroundImage;
  const fill = activeHex || DEFAULT_MENU_BACKGROUND;

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[8.5rem] overflow-hidden rounded-[1.85rem] border-[3px] border-black/8 bg-surface-container shadow-[0_18px_40px_rgba(13,27,42,0.12)] sm:max-w-[11.5rem]">
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
        <span className="h-1 w-10 rounded-full bg-on-surface/15" />
      </div>
      {showImage ? (
        <CloudinaryImage src={menuUi.backgroundImage} alt="" preset="cover" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: fill }} />
      )}
      {showImage ? <div className="absolute inset-0 bg-[#0d1b2a]/40" /> : null}
      <div className="relative flex h-full flex-col px-3.5 pt-7 pb-4">
        <div className="mx-auto mb-3 h-7 w-7 rounded-full bg-white/90 ring-2 ring-white shadow-sm" />
        <div className="mb-3 h-2 w-20 self-center rounded-full bg-[#0d1b2a]/20" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="overflow-hidden rounded-xl bg-white/95 shadow-sm ring-1 ring-[#0d1b2a]/6">
              <div className="h-9 bg-[#ebe8e2]" />
              <div className="space-y-1 p-2">
                <div className="h-1.5 w-4/5 rounded bg-[#0d1b2a]/55" />
                <div className="h-1 w-1/2 rounded bg-[#0d1b2a]/25" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModeSegment({ active, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors sm:gap-2 sm:px-3 sm:text-sm ${
        active
          ? 'bg-surface-container-lowest text-on-surface shadow-sm'
          : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      <MaterialIcon name={icon} className="shrink-0 text-[18px]" />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function MenuBackgroundEditor({
  menuUi,
  colorDraft,
  uploading,
  t,
  onModeChange,
  onColorChange,
  onImageChange,
  onImageRemove,
  onImagePreview,
}) {
  const activeHex = normalizeHexColor(colorDraft) || menuUi.backgroundColor || DEFAULT_MENU_BACKGROUND;

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:items-start lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:gap-6">
      <div>
        <MenuPreview menuUi={menuUi} activeHex={activeHex} />
      </div>

      <div className="min-w-0 space-y-5">
        <div className="inline-flex w-full rounded-xl bg-surface-container p-1 sm:max-w-md">
          <ModeSegment
            active={menuUi.bgMode === 'color'}
            label={t('settings.menuBgColor')}
            icon="palette"
            onClick={() => onModeChange('color')}
          />
          <ModeSegment
            active={menuUi.bgMode === 'image'}
            label={t('settings.menuBgImage')}
            icon="image"
            onClick={() => onModeChange('image')}
          />
        </div>

        {menuUi.bgMode === 'color' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-3 sm:gap-4 sm:p-4">
              <label className="relative flex h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-inner ring-1 ring-black/10">
                <span className="absolute inset-0" style={{ background: activeHex }} />
                <input
                  type="color"
                  value={activeHex}
                  onChange={(event) => onColorChange(event.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-[0.12em] text-on-surface-variant uppercase">
                  {t('settings.menuBgSelected')}
                </p>
                <input
                  type="text"
                  value={colorDraft}
                  onChange={(event) => onColorChange(event.target.value)}
                  maxLength={7}
                  spellCheck={false}
                  className="mt-1 w-full bg-transparent font-mono text-lg font-semibold tracking-tight text-on-surface outline-none"
                />
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-xs font-semibold text-on-surface-variant">{t('settings.menuBgPresets')}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {PRESETS.map((hex) => (
                  <ColorSwatch key={hex} hex={hex} selected={activeHex === hex} onSelect={onColorChange} />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {menuUi.bgMode === 'image' ? (
          <div>
            {menuUi.backgroundImage ? (
              <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
                <button type="button" onClick={onImagePreview} className="relative block aspect-[16/9] w-full">
                  <CloudinaryImage src={menuUi.backgroundImage} alt="" preset="cover" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-[#0d1b2a]/0 transition-colors hover:bg-[#0d1b2a]/30">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#0d1b2a] shadow-lg">
                      <MaterialIcon name="zoom_in" className="text-[22px]" />
                    </span>
                  </span>
                </button>
                <div className="flex flex-col gap-2 border-t border-outline-variant p-3 sm:flex-row sm:flex-wrap">
                  <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary sm:h-auto sm:w-auto sm:rounded-xl sm:py-2.5">
                    <MaterialIcon name="upload" className="text-[18px]" />
                    {uploading ? t('settings.uploading') : t('settings.replaceCover')}
                    <input type="file" accept="image/*" className="hidden" onChange={onImageChange} disabled={uploading} />
                  </label>
                  <button
                    type="button"
                    onClick={onImageRemove}
                    className="inline-flex h-11 w-full items-center justify-center rounded-full px-4 text-sm font-semibold text-error hover:bg-error-container sm:h-auto sm:w-auto sm:rounded-xl sm:py-2.5"
                  >
                    {t('settings.removeCover')}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-surface-container sm:px-6 sm:py-12">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MaterialIcon name="add_photo_alternate" className="text-3xl" />
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {uploading ? t('settings.uploading') : t('settings.menuBgDrop')}
                </span>
                <span className="max-w-xs text-xs text-on-surface-variant">{t('settings.menuBgImageHintEmpty')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={onImageChange} disabled={uploading} />
              </label>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
