import MaterialIcon from '../ui/MaterialIcon.jsx';

export function SettingsToggle({ checked, onChange, label, hint, icon }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-3 sm:items-center sm:gap-4 sm:px-4 sm:py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary sm:h-10 sm:w-10">
            <MaterialIcon name={icon} className="text-[20px]" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="font-semibold leading-snug text-on-surface">{label}</p>
          {hint ? <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">{hint}</p> : null}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-outline-variant'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5 rtl:-translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
