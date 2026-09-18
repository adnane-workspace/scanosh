import MaterialIcon from '../ui/MaterialIcon.jsx';
import { applyCardAppearance } from '../../utils/menuTheme.js';

const CARD_COLORS = ['#ffffff', '#f7f6f3', '#f4efe6', '#eef2f6', '#f3e9e1'];

function Tile({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 text-center transition sm:gap-2 sm:px-3 sm:py-3 ${
        active
          ? 'bg-[#0d1b2a] text-white shadow-[0_8px_20px_rgba(13,27,42,0.18)]'
          : 'bg-[#f4f5f6] text-[#5c6570] hover:bg-[#eceeef]'
      }`}
    >
      <span className={active ? 'text-white' : 'text-[#0d1b2a]'}>{children}</span>
      <span className="text-[10px] font-semibold leading-tight sm:text-[11px]">{label}</span>
    </button>
  );
}

function CardPreview({ card, backdrop }) {
  const tokens = applyCardAppearance({}, card);
  const list = card.layout === 'list';

  return (
    <div
      className="relative mx-auto aspect-[9/16] w-full max-w-[8.5rem] overflow-hidden rounded-[1.85rem] border-[3px] border-black/8 shadow-[0_18px_40px_rgba(13,27,42,0.12)] sm:max-w-[10.5rem]"
      style={{ background: backdrop, ...tokens }}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
        <span className="h-1 w-8 rounded-full bg-black/15" />
      </div>
      <div className="flex h-full flex-col px-2.5 pt-6 pb-3">
        <div className="mb-2.5 h-1.5 w-14 self-center rounded-full bg-[#0d1b2a]/20" />
        {list ? (
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex gap-1.5 bg-[var(--menu-card-bg)] p-1 shadow-[var(--menu-card-shadow)] ring-1 ring-[var(--menu-card-ring)]"
                style={{ borderRadius: 'var(--menu-card-radius)' }}
              >
                <div
                  className="h-7 w-7 shrink-0 bg-[#d9ddd8]"
                  style={{ borderRadius: 'calc(var(--menu-card-radius) - 0.3rem)' }}
                />
                <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                  <div className="h-1.5 w-3/4 rounded bg-[#0d1b2a]/45" />
                  <div className="h-1 w-1/2 rounded bg-[#0d1b2a]/18" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="overflow-hidden bg-[var(--menu-card-bg)] shadow-[var(--menu-card-shadow)] ring-1 ring-[var(--menu-card-ring)]"
                style={{ borderRadius: 'var(--menu-card-radius)' }}
              >
                <div className="bg-[#d9ddd8]" style={{ aspectRatio: 'var(--menu-card-image-ratio, 1 / 1)' }} />
                <div className="space-y-1 p-1.5">
                  <div className="h-1.5 w-4/5 rounded bg-[#0d1b2a]/45" />
                  <div className="h-1 w-1/2 rounded bg-[#0d1b2a]/18" />
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
    <div className="grid gap-5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:items-start lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:gap-6">
      <CardPreview card={card} backdrop={backdrop} />

      <div className="min-w-0 space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-on-surface-variant uppercase">
            {t('publicMenu.cardLayout')}
          </p>
          <div className="flex gap-2">
            <Tile active={card.layout === 'grid'} label={t('publicMenu.cardLayoutGrid')} onClick={() => onChange({ layout: 'grid' })}>
              <span className="grid grid-cols-2 gap-0.5">
                {[0, 1, 2, 3].map((index) => (
                  <span key={index} className="h-3.5 w-3.5 rounded-[3px] bg-current opacity-80" />
                ))}
              </span>
            </Tile>
            <Tile active={card.layout === 'list'} label={t('publicMenu.cardLayoutList')} onClick={() => onChange({ layout: 'list' })}>
              <span className="flex w-10 flex-col gap-1">
                {[0, 1, 2].map((index) => (
                  <span key={index} className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-current opacity-80" />
                    <span className="h-1 flex-1 rounded-full bg-current opacity-50" />
                  </span>
                ))}
              </span>
            </Tile>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-on-surface-variant uppercase">
            {t('publicMenu.cardRadius')}
          </p>
          <div className="flex gap-2">
            {[
              { id: 'sm', radius: '4px' },
              { id: 'md', radius: '10px' },
              { id: 'lg', radius: '16px' },
            ].map((item) => (
              <Tile
                key={item.id}
                active={card.radius === item.id}
                label={t(`publicMenu.cardRadius${item.id === 'sm' ? 'Sm' : item.id === 'md' ? 'Md' : 'Lg'}`)}
                onClick={() => onChange({ radius: item.id })}
              >
                <span className="h-8 w-10 border-2 border-current bg-white/20" style={{ borderRadius: item.radius }} />
              </Tile>
            ))}
          </div>
        </div>

        {card.layout !== 'list' ? (
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-on-surface-variant uppercase">
              {t('publicMenu.cardRatio')}
            </p>
            <div className="flex gap-2">
              <Tile
                active={card.imageRatio === 'square'}
                label={t('publicMenu.cardRatioSquare')}
                onClick={() => onChange({ imageRatio: 'square' })}
              >
                <span className="h-8 w-8 rounded-md bg-current opacity-80" />
              </Tile>
              <Tile
                active={card.imageRatio === 'portrait'}
                label={t('publicMenu.cardRatioPortrait')}
                onClick={() => onChange({ imageRatio: 'portrait' })}
              >
                <span className="h-9 w-7 rounded-md bg-current opacity-80" />
              </Tile>
              <Tile
                active={card.imageRatio === 'landscape'}
                label={t('publicMenu.cardRatioLandscape')}
                onClick={() => onChange({ imageRatio: 'landscape' })}
              >
                <span className="h-6 w-9 rounded-md bg-current opacity-80" />
              </Tile>
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-on-surface-variant uppercase">
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
                  className={`relative h-9 w-9 overflow-hidden rounded-full transition hover:scale-105 ${
                    selected ? 'ring-2 ring-[#0d1b2a] ring-offset-2 ring-offset-white' : 'ring-1 ring-black/10'
                  }`}
                  style={{ background: hex }}
                >
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center text-[#0d1b2a]">
                      <MaterialIcon name="check" className="text-[16px]" filled />
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
