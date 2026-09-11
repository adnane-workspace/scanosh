import { useCallback, useEffect, useMemo } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PublicMenuFrame from '../components/menu/PublicMenuFrame.jsx';
import CategoryTabs from '../components/menu/CategoryTabs.jsx';
import PublicMenuHeader from '../components/menu/PublicMenuHeader.jsx';
import PublicProductCard from '../components/menu/PublicProductCard.jsx';
import PublicProductListItem from '../components/menu/PublicProductListItem.jsx';
import PublicProductSheet from '../components/menu/PublicProductSheet.jsx';
import { useMenuSlug } from '../context/MenuSlugContext.jsx';
import { setPageMeta, usePublicMenu } from '../hooks/usePublicMenu.js';
import { useLocale } from '../hooks/useLocale.js';
import { getMenuPaths } from '../utils/hosts.js';
import { buildShareUrl } from '../utils/share.js';
import { formatPrice } from '../utils/format.js';
import {
  findSectionByKey,
  findSectionKeyForCategory,
  getFlatCatalogCategories,
  getActiveSections,
  getSectionMenuDestination,
  isLegacyCategoryId,
  isMenuSectionKey,
  resolveFlatSelection,
  resolveSectionCategory,
} from '../utils/menuSections.js';

const productGridClass = 'grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
const productListClass = 'flex flex-col gap-3 sm:gap-4';
const contentClass = 'mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8';

function MenuStatus({ title, message }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold text-on-surface md:text-2xl">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-on-surface-variant md:text-base">{message}</p>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className={`${contentClass} animate-pulse`}>
      <div className="mb-5 flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-9 w-24 shrink-0 rounded-full bg-[#ebe8e2]" />
        ))}
      </div>
      <div className={productGridClass}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="aspect-[3/4] rounded-[1.35rem] bg-[#ebe8e2]" />
        ))}
      </div>
    </div>
  );
}

export default function PublicMenuPage({ fixedSectionKey = null }) {
  const slug = useMenuSlug();
  const { sectionKey: sectionKeyParam, categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const { menu, loading, errorStatus } = usePublicMenu(slug);
  const selectedProductId = searchParams.get('product');
  const paths = getMenuPaths(slug);
  const activeSections = useMemo(() => getActiveSections(menu), [menu]);
  // UUID category ids also match the section-key pattern — treat them as flat catalog ids.
  const sectionKey =
    fixedSectionKey ||
    (sectionKeyParam && !isLegacyCategoryId(sectionKeyParam) && isMenuSectionKey(sectionKeyParam)
      ? sectionKeyParam
      : null);
  const isSectionMode = Boolean(sectionKey);
  const flatCategoryId = isSectionMode
    ? null
    : categoryId || (isLegacyCategoryId(sectionKeyParam) ? sectionKeyParam : null);

  const section = useMemo(
    () => (isSectionMode ? findSectionByKey(menu, sectionKey) : null),
    [isSectionMode, menu, sectionKey],
  );

  const selection = useMemo(() => {
    if (isSectionMode) {
      return resolveSectionCategory(section, categoryId);
    }

    return resolveFlatSelection(menu?.categories, flatCategoryId);
  }, [isSectionMode, section, categoryId, menu?.categories, flatCategoryId]);

  const selectedProduct = useMemo(
    () => selection.products?.find((product) => String(product.id) === String(selectedProductId)) || null,
    [selection.products, selectedProductId],
  );

  useEffect(() => {
    if (menu?.cafe && selection.category) {
      setPageMeta({
        title: selectedProduct
          ? `${selectedProduct.name} · ${menu.cafe.name}`
          : `${selection.category.name} · ${menu.cafe.name}`,
        description:
          selectedProduct?.description ||
          menu.cafe.description ||
          t('menu.pageDescription', { name: menu.cafe.name }),
        robots: 'noindex,follow',
      });
      return;
    }

    if (menu?.cafe) {
      setPageMeta({
        title: t('menu.pageTitle', { name: menu.cafe.name }),
        description: menu.cafe.description || t('menu.pageDescription', { name: menu.cafe.name }),
        robots: 'noindex,follow',
      });
      return;
    }

    if (errorStatus) {
      setPageMeta({
        title: t('menu.missingTitle'),
        description: t('menu.missing'),
      });
    }
  }, [menu, errorStatus, selection.category, selectedProduct, t]);

  const openProduct = useCallback(
    (product) => {
      setSearchParams({ product: product.id }, { replace: false });
    },
    [setSearchParams],
  );

  const closeProduct = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const goToCategory = useCallback(
    (category) => {
      if (!category?.id) {
        return;
      }

      if (isSectionMode) {
        navigate(paths.sectionCategory(sectionKey, category.id), { replace: false });
        return;
      }

      navigate(paths.category(category.id), { replace: false });
    },
    [isSectionMode, navigate, paths, sectionKey],
  );

  const cafe = menu?.cafe;
  const landingPath = paths.home;

  function frame(content) {
    return (
      <PublicMenuFrame cafe={cafe}>
        {content}
      </PublicMenuFrame>
    );
  }

  if (loading) {
    return frame(
      <>
        <PublicMenuHeader cafe={cafe} slug={slug} backTo={landingPath} backLabel={t('menu.home')} />
        <MenuSkeleton />
      </>,
    );
  }

  if (errorStatus && errorStatus !== 404 && errorStatus !== 403) {
    return frame(
      <>
        <PublicMenuHeader cafe={cafe} slug={slug} backTo={landingPath} backLabel={t('menu.home')} />
        <MenuStatus title={t('menu.loadErrorTitle')} message={t('menu.loadError')} />
      </>,
    );
  }

  if (errorStatus === 403) {
    return frame(
      <>
        <PublicMenuHeader cafe={cafe} slug={slug} backTo={landingPath} backLabel={t('menu.home')} />
        <MenuStatus title={t('menu.unavailableTitle')} message={t('menu.unavailable')} />
      </>,
    );
  }

  if (errorStatus) {
    return frame(
      <>
        <PublicMenuHeader cafe={cafe} slug={slug} backTo={landingPath} backLabel={t('menu.home')} />
        <MenuStatus title={t('menu.missingTitle')} message={t('menu.missing')} />
      </>,
    );
  }

  if (!sectionKey) {
    if (activeSections.length > 1) {
      return <Navigate to={paths.sections} replace />;
    }

    if (activeSections.length === 1) {
      const onlySection = activeSections[0];
      const firstCategory = onlySection.children?.[0];

      if (firstCategory?.id) {
        return <Navigate to={paths.sectionCategory(onlySection.key, firstCategory.id)} replace />;
      }

      return <Navigate to={paths.section(onlySection.key)} replace />;
    }
  }

  if (!menu?.categories?.length && !activeSections.length) {
    return frame(
      <>
        <PublicMenuHeader cafe={cafe} slug={slug} backTo={landingPath} backLabel={t('menu.home')} />
        <MenuStatus title={t('menu.emptyTitle')} message={t('menu.empty')} />
      </>,
    );
  }

  if (!sectionKey && categoryId && isLegacyCategoryId(categoryId)) {
    const legacySectionKey = findSectionKeyForCategory(menu, categoryId);

    if (legacySectionKey) {
      return (
        <Navigate
          to={{ pathname: paths.sectionCategory(legacySectionKey, categoryId), search: location.search }}
          replace
        />
      );
    }
  }

  if (isSectionMode && !section) {
    return <Navigate to={getSectionMenuDestination(menu, paths)} replace />;
  }

  if (isSectionMode && !categoryId && selection.category) {
    return <Navigate to={paths.sectionCategory(sectionKey, selection.category.id)} replace />;
  }

  if (!isSectionMode && !flatCategoryId && selection.category) {
    return <Navigate to={paths.category(selection.category.id)} replace />;
  }

  if ((flatCategoryId || categoryId) && selection.missing) {
    return frame(
      <>
        <PublicMenuHeader
          cafe={cafe}
          slug={slug}
          backTo={isSectionMode ? paths.sections : paths.categories}
          backLabel={isSectionMode ? t('menu.backToSections') : t('menu.categories')}
        />
        <MenuStatus title={t('menu.categoryMissingTitle')} message={t('menu.categoryMissing')} />
      </>,
    );
  }

  const tabItems = isSectionMode ? section?.children || [] : getFlatCatalogCategories(menu.categories);
  const activeCategoryId = selection.category?.id;
  const products = selection.products || [];
  const backTo = isSectionMode
    ? activeSections.length > 1
      ? paths.sections
      : landingPath
    : landingPath;
  const backLabel = isSectionMode
    ? activeSections.length > 1
      ? t('menu.backToSections')
      : t('menu.home')
    : t('menu.home');

  const isRestaurantSection = isSectionMode && sectionKey === 'restaurant';

  return frame(
    <div className="min-h-screen overflow-x-hidden">
      <PublicMenuHeader cafe={cafe} slug={slug} backTo={backTo} backLabel={backLabel} />
      <CategoryTabs items={tabItems} activeId={activeCategoryId} onSelect={goToCategory} />
      <div className={contentClass}>
        <p
          className="mb-1 text-xs font-semibold tracking-[0.1em] text-on-surface-variant uppercase"
          style={{ textShadow: 'var(--menu-heading-shadow)' }}
        >
          {isSectionMode ? section?.name : t('menu.categories')}
        </p>
        <h1
          className="mb-5 break-words text-[1.35rem] font-semibold tracking-tight text-on-surface sm:mb-6 sm:text-2xl"
          style={{ textShadow: 'var(--menu-heading-shadow)' }}
        >
          {selection.category?.name}
        </h1>

        {products.length ? (
          <div className={isRestaurantSection ? productListClass : productGridClass}>
            {products.map((product) =>
              isRestaurantSection ? (
                <PublicProductListItem key={product.id} product={product} onSelect={openProduct} />
              ) : (
                <PublicProductCard key={product.id} product={product} onSelect={openProduct} />
              ),
            )}
          </div>
        ) : (
          <MenuStatus title={t('menu.emptyTitle')} message={t('menu.empty')} />
        )}
      </div>

      <PublicProductSheet
        product={selectedProduct}
        onClose={closeProduct}
        shareTitle={selectedProduct ? `${selectedProduct.name} · ${cafe.name}` : ''}
        shareText={
          selectedProduct ? `${selectedProduct.name} — ${formatPrice(selectedProduct.price, locale)}` : ''
        }
        shareUrl={
          selectedProduct && activeCategoryId
            ? buildShareUrl({
                slug,
                sectionKey: isSectionMode ? sectionKey : null,
                categoryId: activeCategoryId,
                productId: selectedProduct.id,
              })
            : ''
        }
      />
    </div>,
  );
}
