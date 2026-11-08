import { LOCALES } from '../../i18n/publicMessages.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function LanguageSwitcher({ compact = false, className = '', onDark = false, tone = 'default' }) {
  const { locale, setLocale } = useLocale();
  const menu = tone === 'menu';

  return (
    <div
      className={`inline-flex rounded-full p-0.5 ${
        menu
          ? 'bg-white shadow-[0_6px_18px_rgba(13,27,42,0.06)] ring-1 ring-[#0d1b2a]/8'
          : onDark
            ? 'bg-[#e0e1dd]/15 ring-1 ring-[#e0e1dd]/25 backdrop-blur-md'
            : 'bg-surface-container'
      } ${className}`}
    >
      {LOCALES.map((item) => {
        const active = locale === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setLocale(item.id)}
            className={`rounded-full font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${
              compact ? 'min-h-7 px-2.5 py-1 text-[10px] sm:min-h-8 sm:px-3 sm:text-[11px]' : 'px-2 py-1 text-[11px] sm:px-2.5 sm:text-xs'
            } ${
              menu
                ? active
                  ? 'bg-[#0d1b2a] text-[#e8d5a8]'
                  : 'text-[#5c6570] hover:text-[#0d1b2a]'
                : active
                  ? onDark
                    ? 'bg-[#e0e1dd] text-[#0d1b2a]'
                    : 'bg-surface-container-lowest text-primary'
                  : onDark
                    ? 'text-[#e0e1dd]/80 hover:text-[#e0e1dd]'
                    : 'text-on-surface-variant hover:text-on-surface'
            }`}
            aria-pressed={active}
          >
            {item.id}
          </button>
        );
      })}
    </div>
  );
}
