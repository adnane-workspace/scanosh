import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import DashboardCard from './DashboardCard.jsx';
import SectionHeader from './SectionHeader.jsx';

export default function MenuHealth({ stats, qr, loading }) {
  const { t } = useLocale();
  const cafe = stats.cafe || {};
  const emptyCategories = (stats.categories || []).filter((item) => (item.productCount || 0) === 0).length;
  const hasLocation = cafe.latitude != null && cafe.longitude != null;
  const alerts = [];

  if ((stats.unavailableProducts || 0) > 0) {
    alerts.push({
      id: 'hidden',
      to: '/app/products',
      icon: 'visibility_off',
      title: t('dashboard.healthHidden', { count: stats.unavailableProducts }),
      hint: t('dashboard.healthHiddenHint'),
    });
  }

  if ((stats.productsWithoutImage || 0) > 0) {
    alerts.push({
      id: 'photos',
      to: '/app/products',
      icon: 'image_not_supported',
      title: t('dashboard.healthPhotos', { count: stats.productsWithoutImage }),
      hint: t('dashboard.healthPhotosHint'),
    });
  }

  if (emptyCategories > 0) {
    alerts.push({
      id: 'empty',
      to: '/app/categories',
      icon: 'folder_off',
      title: t('dashboard.healthEmptyCats', { count: emptyCategories }),
      hint: t('dashboard.healthEmptyCatsHint'),
    });
  }

  if (!cafe.logo) {
    alerts.push({
      id: 'logo',
      to: '/app/settings?tab=general',
      icon: 'hide_image',
      title: t('dashboard.healthLogo'),
      hint: t('dashboard.healthLogoHint'),
    });
  }

  if (!hasLocation) {
    alerts.push({
      id: 'map',
      to: '/app/settings?tab=general',
      icon: 'location_off',
      title: t('dashboard.healthLocation'),
      hint: t('dashboard.healthLocationHint'),
    });
  }

  if (qr && !qr.generated) {
    alerts.push({
      id: 'qr',
      icon: 'qr_code_2',
      title: t('dashboard.healthQr'),
      hint: t('dashboard.healthQrHint'),
    });
  }

  return (
    <DashboardCard className="h-full">
      <SectionHeader title={t('dashboard.healthTitle')} />

      {loading ? (
        <p className="text-sm text-on-surface-variant">{t('dashboard.loading')}</p>
      ) : alerts.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl bg-tertiary/8 px-4 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary/15 text-tertiary">
            <MaterialIcon name="verified" />
          </span>
          <div>
            <p className="font-semibold text-on-surface">{t('dashboard.healthOk')}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{t('dashboard.healthOkHint')}</p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.map((item) => {
            const body = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary">
                  <MaterialIcon name={item.icon} className="text-[20px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-on-surface">{item.title}</span>
                  <span className="mt-0.5 block text-sm text-on-surface-variant">{item.hint}</span>
                </span>
                {item.to ? (
                  <MaterialIcon name="chevron_right" className="text-on-surface-variant" />
                ) : null}
              </>
            );

            return (
              <li key={item.id}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="flex items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-surface-container-low"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl px-1 py-2">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
