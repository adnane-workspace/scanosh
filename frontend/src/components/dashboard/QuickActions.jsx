import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';

export default function QuickActions({ menuUrl, hasCategory }) {
  const { t } = useLocale();
  const items = [
    {
      key: 'product',
      to: hasCategory ? '/app/products?new=1' : '/app/categories?new=1',
      icon: 'add_circle',
      label: t('dashboard.quickAddProduct'),
      hint: hasCategory ? t('dashboard.quickAddProductHint') : t('dashboard.quickAddProductLocked'),
    },
    {
      key: 'category',
      to: '/app/categories?new=1',
      icon: 'create_new_folder',
      label: t('dashboard.quickAddCategory'),
      hint: t('dashboard.quickAddCategoryHint'),
    },
    {
      key: 'aiFill',
      to: '/app/ai-fill',
      icon: 'auto_awesome',
      label: t('dashboard.quickAiFill'),
      hint: t('dashboard.quickAiFillHint'),
    },
    {
      key: 'settings',
      to: '/app/settings',
      icon: 'tune',
      label: t('dashboard.quickSettings'),
      hint: t('dashboard.quickSettingsHint'),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className="group flex items-start gap-3 rounded-[18px] border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-high"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MaterialIcon name={item.icon} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-on-surface">{item.label}</span>
            <span className="mt-0.5 block text-sm text-on-surface-variant">{item.hint}</span>
          </span>
        </Link>
      ))}
      {menuUrl ? (
        <a
          href={menuUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-3 rounded-[18px] border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-high"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MaterialIcon name="menu_book" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-on-surface">{t('dashboard.quickViewMenu')}</span>
            <span className="mt-0.5 block text-sm text-on-surface-variant">{t('dashboard.quickViewMenuHint')}</span>
          </span>
        </a>
      ) : (
        <div className="flex items-start gap-3 rounded-[18px] border border-dashed border-outline-variant p-4 opacity-70">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
            <MaterialIcon name="menu_book" />
          </span>
          <span>
            <span className="block font-semibold text-on-surface">{t('dashboard.quickViewMenu')}</span>
            <span className="mt-0.5 block text-sm text-on-surface-variant">{t('dashboard.quickViewMenuEmpty')}</span>
          </span>
        </div>
      )}
    </div>
  );
}
