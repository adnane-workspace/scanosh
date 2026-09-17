import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';

export default function QuickActions({ hasCategory }) {
  const { t } = useLocale();
  const items = [
    {
      key: 'aiFill',
      to: '/app/ai-fill',
      icon: 'auto_awesome',
      label: t('dashboard.quickAiFill'),
      hint: t('dashboard.quickAiFillHint'),
      featured: true,
    },
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
          className={`group flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
            item.featured
              ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
              : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-high'
          }`}
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              item.featured ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary'
            }`}
          >
            <MaterialIcon name={item.icon} className="text-[20px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-on-surface">{item.label}</span>
            <span className="mt-0.5 block text-xs leading-snug text-on-surface-variant sm:text-sm">{item.hint}</span>
          </span>
          <MaterialIcon name="chevron_right" className="mt-1 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  );
}
