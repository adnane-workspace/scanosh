import { Link } from 'react-router-dom';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';

export default function MenuDeveloperBadge({ to }) {
  const { t } = useLocale();

  return (
    <Link
      to={to}
      className="group inline-flex items-center transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97]"
      aria-label={t('menu.developer.badgeAria')}
    >
      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-transparent">
        <MaterialIcon
          name="priority_high"
          className="text-[22px] text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]"
          filled
        />
      </span>
    </Link>
  );
}
