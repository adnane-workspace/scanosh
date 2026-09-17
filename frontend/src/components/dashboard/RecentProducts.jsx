import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.js';
import { categoryBadgeClass, formatPrice } from '../../utils/format.js';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import AvailabilityToggle from './AvailabilityToggle.jsx';
import DashboardCard from './DashboardCard.jsx';
import SectionHeader from './SectionHeader.jsx';

function ProductThumb({ product }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-surface-container">
      {product.image ? (
        <CloudinaryImage
          src={product.image}
          alt=""
          preset="thumb"
          width={40}
          height={40}
          className={`h-full w-full object-cover ${product.available ? '' : 'grayscale'}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
          <MaterialIcon name="image" className="text-[18px]" />
        </div>
      )}
    </div>
  );
}

export default function RecentProducts({ products, loading, onToggleAvailable }) {
  const { t, locale } = useLocale();
  const [pendingId, setPendingId] = useState(null);

  async function handleToggle(product) {
    if (!onToggleAvailable) {
      return;
    }

    setPendingId(product._id);

    try {
      await onToggleAvailable(product);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <DashboardCard>
      <SectionHeader
        title={t('dashboard.recentTitle')}
        action={
          <Link
            to="/app/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {t('common.seeAll')}
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3 py-2">
              <div className="h-10 w-10 animate-pulse rounded-[10px] bg-surface-container-high" />
              <div className="h-4 flex-1 animate-pulse rounded bg-surface-container-high" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface-container-low px-4 py-6">
          <p className="text-sm text-on-surface-variant">{t('dashboard.noProductsYet')}</p>
          <Link
            to="/app/products?new=1"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            {t('dashboard.quickAddProduct')}
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-outline-variant md:hidden">
            {products.map((product) => (
              <li
                key={product._id}
                className={`flex items-center gap-3 py-3.5 ${product.available ? '' : 'opacity-55'}`}
              >
                <ProductThumb product={product} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium text-on-surface ${product.available ? '' : 'line-through'}`}>
                    {product.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-on-surface-variant">
                    {product.categoryName || t('dashboard.uncategorized')} · {formatPrice(product.price, locale)}
                  </p>
                </div>
                <AvailabilityToggle
                  checked={Boolean(product.available)}
                  disabled={pendingId === product._id}
                  label={t('dashboard.toggleLabel', { name: product.name })}
                  onChange={() => handleToggle(product)}
                />
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <table className="w-full text-start">
              <thead>
                <tr className="text-on-surface-variant">
                  <th className="pb-3 text-start text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {t('dashboard.productName')}
                  </th>
                  <th className="pb-3 text-start text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {t('dashboard.category')}
                  </th>
                  <th className="pb-3 text-start text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {t('dashboard.price')}
                  </th>
                  <th className="pb-3 text-end text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {t('dashboard.availability')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className={`border-t border-outline-variant transition-colors duration-150 hover:bg-surface-container-low/80 ${
                      product.available ? '' : 'opacity-55'
                    }`}
                  >
                    <td className="py-3.5 pe-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={product} />
                        <span className={`font-medium text-on-surface ${product.available ? '' : 'line-through'}`}>
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 pe-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${categoryBadgeClass(
                          product.categoryName,
                          product.available,
                        )}`}
                      >
                        {product.categoryName || t('dashboard.uncategorized')}
                      </span>
                    </td>
                    <td className="py-3.5 pe-3 font-semibold text-on-surface">
                      {formatPrice(product.price, locale)}
                    </td>
                    <td className="py-3.5 text-end">
                      <AvailabilityToggle
                        checked={Boolean(product.available)}
                        disabled={pendingId === product._id}
                        label={t('dashboard.toggleLabel', { name: product.name })}
                        onChange={() => handleToggle(product)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardCard>
  );
}
