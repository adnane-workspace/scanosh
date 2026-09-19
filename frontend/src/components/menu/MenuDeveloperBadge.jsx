import { Link } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function MenuDeveloperBadge({ to }) {
  const { t } = useLocale();

  return (
    <Link
      to={to}
      className="text-[10px] font-semibold tracking-[0.28em] text-white/35 uppercase transition-colors hover:text-white/70"
      aria-label={t('menu.developer.badgeAria')}
    >
      {APP_NAME}
    </Link>
  );
}
