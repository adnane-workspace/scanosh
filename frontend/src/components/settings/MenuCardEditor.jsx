import MaterialIcon from '../ui/MaterialIcon.jsx';
import { applyCardAppearance } from '../../utils/menuTheme.js';

const CARD_COLORS = ['#ffffff', '#f7f6f3', '#f4efe6', '#eef2f6', '#f3e9e1'];

function ChoiceGroup({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-on-surface-variant uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Choice({ active, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-[#0d1b2a] text-white shadow-sm'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      }`}
    >
      {icon ? <MaterialIcon name={icon} className="text-[18px]" /> : null}
      {label}
    </button>
  );
}

function CardPreview({ card, backdrop }) {
  const tokens = applyCardAppearance({}, card);
  const list = card.layout === 'list';

  return (
    <div
      className="relative mx-auto aspect-[9/16] w-full max-w-[11.5rem] overflow-hidden rounded-[2rem] border-[3px] border-on-surface/10 shadow-[0_20px_50px_rgba(13,27,42,0.12)]"
      style={{ background: backdrop, ...tokens }}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
        <span className="h-1 w-10 rounded-full bg-on-surface/15" />
      </div>
      <div className="flex h-full flex-col px-3 pt-7 pb-4">
        <div className="mb-3 h-1.5 w-16 self-center rounded-full bg-[#0d1b2a]/25" />
        {list ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex gap-2 bg-[var(--menu-card-bg)] p-1.5 shadow-[var(--menu-card-shadow)] ring-1 ring-[var(--menu-card-ring)]"
                style={{ borderRadius: 'var(--menu-card-radius)' }}
              >
                <div
                  className="h-8 w-8 shrink-0 bg-[#d9ddd8]"
                  style={{ borderRadius: 'calc(var(--menu-card-radius) - 0.35rem)' }}
                />
                <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                  <div className="h-1.5 w-3/4 rounded bg-[#0d1b2a]/50" />
                  <div className="h-1 w-1/2 rounded bg-[#0d1b2a]/20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="overflow-hidden bg-[var(--menu-card-bg)] shadow-[var(--menu-card-shadow)] ring-1 ring-[var(--menu-card-ring)]"
                style={{ borderRadius: 'var(--menu-card-radius)' }}
              >
                <div className="bg-[#d9ddd8]" style={{ aspectRatio: 'var(--menu-card-image-ratio, 1 / 1)' }} />
                <div className="space-y-1 p-1.5">
                  <div className="h-1.5 w-4/5 rounded bg-[#0d1b2a]/50" />
                  <div className="h-1 w-1/2 rounded bg-[#0d1b2a]/20" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuCardEditor({ card, backdrop, t, onChange }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <p className="mb-3 text-center text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase lg:text-start">
          {t('settings.menuBgPreview')}
        </p>
        <CardPreview card={card} backdrop={backdrop} />
      </div>

      <div className="min-w-0 space-y-5">
        <ChoiceGroup label={t('publicMenu.cardLayout')}>
          <Choice
            active={card.layout === 'grid'}
            label={t('publicMenu.cardLayoutGrid')}
            icon="grid_view"
            onClick={() => onChange({ layout: 'grid' })}
          />
          <Choice
            active={card.layout === 'list'}
            label={t('publicMenu.cardLayoutList')}
            icon="view_agenda"
            onClick={() => onChange({ layout: 'list' })}
          />
        </ChoiceGroup>

        <ChoiceGroup label={t('publicMenu.cardRadius')}>
          <Choice active={card.radius === 'sm'} label={t('publicMenu.cardRadiusSm')} onClick={() => onChange({ radius: 'sm' })} />
          <Choice active={card.radius === 'md'} label={t('publicMenu.cardRadiusMd')} onClick={() => onChange({ radius: 'md' })} />
          <Choice active={card.radius === 'lg'} label={t('publicMenu.cardRadiusLg')} onClick={() => onChange({ radius: 'lg' })} />
        </ChoiceGroup>

        {card.layout !== 'list' ? (
          <ChoiceGroup label={t('publicMenu.cardRatio')}>
            <Choice
              active={card.imageRatio === 'square'}
              label={t('publicMenu.cardRatioSquare')}
              onClick={() => onChange({ imageRatio: 'square' })}
            />
            <Choice
              active={card.imageRatio === 'portrait'}
              label={t('publicMenu.cardRatioPortrait')}
              onClick={() => onChange({ imageRatio: 'portrait' })}
            />
            <Choice
              active={card.imageRatio === 'landscape'}
              label={t('publicMenu.cardRatioLandscape')}
              onClick={() => onChange({ imageRatio: 'landscape' })}
            />
          </ChoiceGroup>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-on-surface-variant uppercase">
            {t('publicMenu.cardColor')}
          </p>
          <div className="flex flex-wrap gap-2">
            {CARD_COLORS.map((hex) => {
              const selected = card.background === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => onChange({ background: hex })}
                  title={hex}
                  aria-pressed={selected}
                  className={`relative h-10 w-10 overflow-hidden rounded-xl transition-transform hover:scale-105 ${
                    selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest' : 'ring-1 ring-black/10'
                  }`}
                  style={{ background: hex }}
                >
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center text-[#0d1b2a]">
                      <MaterialIcon name="check" className="text-[18px]" filled />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
