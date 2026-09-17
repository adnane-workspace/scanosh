import { Link } from 'react-router-dom';
import MaterialIcon from '../ui/MaterialIcon.jsx';

export default function StatCard({ label, value, icon, loading, hint, to }) {
  const card = (
    <article className="group h-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 transition-colors duration-200 hover:border-primary/25 hover:bg-surface-container-low">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-on-surface-variant uppercase">
          {label}
        </p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container text-primary transition-colors group-hover:bg-primary/10">
          <MaterialIcon name={icon} className="text-[20px]" />
        </span>
      </div>

      {loading ? (
        <div className="mt-4 h-9 w-16 animate-pulse rounded-md bg-surface-container-high" />
      ) : (
        <p className="mt-4 font-display text-[1.85rem] leading-none font-semibold tracking-tight text-on-surface tabular-nums">
          {value}
        </p>
      )}

      {hint && !loading ? <p className="mt-2 text-sm text-on-surface-variant">{hint}</p> : null}
    </article>
  );

  if (!to) {
    return card;
  }

  return (
    <Link to={to} className="block h-full">
      {card}
    </Link>
  );
}
