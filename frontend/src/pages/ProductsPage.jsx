import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminProductCard from '../components/dashboard/AdminProductCard.jsx';
import MediaImagePickerModal from '../components/dashboard/MediaImagePickerModal.jsx';
import ProductFormModal from '../components/dashboard/ProductFormModal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Field from '../components/ui/Field.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useLocale } from '../hooks/useLocale.js';
import { listCategoryOptions } from '../services/category.service.js';
import {
  createProduct,
  deleteProduct,
  getProducts,
  suggestProductImagesBatch,
  suggestProductImage,
  updateProduct,
  uploadProductImage,
} from '../services/product.service.js';
import { getApiError } from '../utils/apiError.js';
import { categoryPathLabel, leafCategories, resolveCategorySectionKey, walkPreOrder } from '../utils/categoryTree.js';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  image: '',
  available: true,
  order: 0,
};

export default function ProductsPage() {
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const reviewMode = searchParams.get('review') === '1';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [pickerProduct, setPickerProduct] = useState(null);
  const [suggestingBatch, setSuggestingBatch] = useState(false);
  const [generatingId, setGeneratingId] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  const [search, setSearch] = useState(() => (searchParams.get('q') || '').trim());
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState(() => searchParams.get('availability') || 'all');
  const [missingOnly, setMissingOnly] = useState(() => searchParams.get('noimage') === '1');
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const loadRequestIdRef = useRef(0);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await listCategoryOptions());
    } catch (err) {
      setError(getApiError(err, t, 'products.loadError'));
    }
  }, [t]);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError('');

      try {
        const requestId = ++loadRequestIdRef.current;
        const params = { page, limit: reviewMode ? 50 : 20 };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (categoryFilter !== 'all') {
          params.categoryId = categoryFilter;
        }

        if (availabilityFilter !== 'all') {
          params.availability = availabilityFilter;
        }

        if (missingOnly) {
          params.missingImage = true;
        }

        const productResult = await getProducts(params);
        if (requestId !== loadRequestIdRef.current) {
          return;
        }
        setProducts(productResult.items || []);
        setPagination(productResult.pagination);
      } catch (err) {
        setError(getApiError(err, t, 'products.loadError'));
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [availabilityFilter, categoryFilter, missingOnly, page, reviewMode, search, t],
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      setSearch((current) => {
        if (current === next) {
          return current;
        }
        setPage(1);
        return next;
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const setOrDelete = (key, value, empty = '') => {
      if (!value || value === empty) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    };

    setOrDelete('q', search);
    setOrDelete('category', categoryFilter, 'all');
    setOrDelete('availability', availabilityFilter, 'all');
    setOrDelete('noimage', missingOnly ? '1' : '');
    setOrDelete('page', page > 1 ? String(page) : '');

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [availabilityFilter, categoryFilter, missingOnly, page, search, searchParams, setSearchParams]);

  const leafOptions = useMemo(
    () =>
      leafCategories(categories).map((category) => ({
        ...category,
        pathLabel: categoryPathLabel(categories, category._id),
        sectionKey: resolveCategorySectionKey(categories, category._id),
      })),
    [categories],
  );

  const categoryOptions = useMemo(() => walkPreOrder(categories), [categories]);
  const hasActiveFilters = Boolean(
    search || categoryFilter !== 'all' || availabilityFilter !== 'all' || missingOnly,
  );

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setCategoryFilter('all');
    setAvailabilityFilter('all');
    setMissingOnly(false);
    setPage(1);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : name === 'order' ? Number(value) : value,
    }));
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setError('');
    setIsFormOpen(true);
  }

  useEffect(() => {
    if (loading || searchParams.get('new') !== '1' || leafOptions.length === 0) {
      return;
    }

    openCreateForm();
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [leafOptions.length, loading, searchParams, setSearchParams]);

  function startEdit(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      categoryId: String(product.categoryId),
      image: product.image || '',
      available: product.available,
      order: product.order ?? 0,
    });
    setFormError('');
    setError('');
    setIsFormOpen(true);
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploading(true);
    setFormError('');

    try {
      const url = await uploadProductImage(file);
      setForm((current) => ({ ...current, image: url }));
    } catch (err) {
      setFormError(getApiError(err, t, 'validation.uploadImage'));
    } finally {
      setUploading(false);
    }
  }

  function validateForm() {
    if (!form.name.trim()) {
      return t('validation.nameRequired');
    }

    if (form.price === '' || Number.isNaN(Number(form.price))) {
      return t('validation.priceRequired');
    }

    if (Number(form.price) < 0) {
      return t('validation.priceNegative');
    }

    if (!form.categoryId) {
      return t('validation.categoryRequired');
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      categoryId: form.categoryId,
      image: form.image.trim(),
      available: form.available,
      order: Number.isNaN(form.order) ? 0 : form.order,
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }

      closeForm();
      await loadData(true);
    } catch (err) {
      setFormError(getApiError(err, t, 'validation.saveProduct'));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(product) {
    setPendingDelete(product);
  }

  async function confirmDelete() {
    const product = pendingDelete;
    if (!product || deleting) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteProduct(product._id);

      if (editingId === product._id) {
        closeForm();
      }

      setPendingDelete(null);
      await loadData(true);
    } catch (err) {
      setError(getApiError(err, t, 'products.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleAvailable(product) {
    setError('');
    setSuccess('');
    setTogglingId(product._id);

    try {
      await updateProduct(product._id, { available: !product.available });
      setProducts((current) =>
        current.map((item) =>
          item._id === product._id ? { ...item, available: !item.available } : item,
        ),
      );
    } catch (err) {
      setError(getApiError(err, t, 'dashboard.availabilityError'));
    } finally {
      setTogglingId(null);
    }
  }

  function handleSuggestImage(product) {
    setError('');
    setSuccess('');
    setPickerProduct(product);
  }

  async function handleGenerateImage(product) {
    setError('');
    setSuccess('');
    setGeneratingId(product._id);
    try {
      const result = await suggestProductImage(product._id, { overwrite: Boolean(product.image) });
      if (result?.product) {
        setProducts((current) =>
          current.map((item) => (item._id === result.product._id ? result.product : item)),
        );
      }
      if (result?.skipped) {
        setSuccess(t('products.suggestImageSkipped'));
      } else {
        setSuccess(t('products.generatePhotoSuccess', { name: product.name }));
      }
    } catch (err) {
      setError(getApiError(err, t, 'products.suggestImageError'));
      setPickerProduct(product);
    } finally {
      setGeneratingId('');
    }
  }

  function handlePickerApplied(updatedProduct) {
    if (updatedProduct?._id) {
      setProducts((current) =>
        current.map((item) => (item._id === updatedProduct._id ? updatedProduct : item)),
      );
    }
    setSuccess(t('products.pickImageApplied'));
  }

  async function handleSuggestMissingBatch() {
    setError('');
    setSuccess('');
    setSuggestingBatch(true);
    try {
      const missingIds = products.filter((item) => !item.image).map((item) => item._id);
      const library = await suggestProductImagesBatch({
        productIds: missingIds,
        onlyMissing: true,
        limit: 20,
        stage: 'library',
      });
      let updated = library?.summary?.updated ?? 0;
      let failed = library?.summary?.failed ?? 0;
      let fluxUpdated = 0;
      let safety = 0;
      do {
        const flux = await suggestProductImagesBatch({
          productIds: missingIds,
          onlyMissing: true,
          limit: 20,
          stage: 'flux',
        });
        fluxUpdated = flux?.summary?.updated ?? 0;
        updated += fluxUpdated;
        failed = flux?.summary?.failed ?? failed;
        safety += 1;
      } while (fluxUpdated > 0 && safety < 8);
      await loadData(true);
      setSuccess(
        t('products.suggestBatchSuccess', {
          updated,
          failed,
        }),
      );
    } catch (err) {
      setError(getApiError(err, t, 'products.suggestImageError'));
    } finally {
      setSuggestingBatch(false);
    }
  }

  const missingPhotos = useMemo(
    () => products.filter((item) => !item.image).length,
    [products],
  );

  function dismissReviewMode() {
    const next = new URLSearchParams(searchParams);
    next.delete('review');
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:mb-stack-lg sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="hidden font-display text-display-md font-bold text-on-surface sm:mb-1 sm:block">
            {reviewMode ? t('products.reviewTitle') : t('products.title')}
          </h1>
          <p className="mt-1 hidden max-w-2xl text-sm text-on-surface-variant sm:block">
            {reviewMode ? t('products.reviewSubtitle') : t('products.subtitle')}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {missingPhotos > 0 || reviewMode ? (
            <button
              type="button"
              disabled={suggestingBatch || loading}
              onClick={handleSuggestMissingBatch}
              className="inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-outline-variant bg-surface-container-lowest px-5 text-sm font-semibold tracking-[0.04em] text-on-surface shadow-sm transition hover:border-outline hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-50 sm:w-auto"
            >
              <MaterialIcon
                name={suggestingBatch ? 'progress_activity' : 'auto_awesome'}
                className={suggestingBatch ? 'animate-spin' : ''}
              />
              {suggestingBatch ? t('products.suggestingBatch') : t('products.suggestMissingPhotos')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 text-sm font-semibold tracking-[0.04em] text-on-primary shadow-md transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 sm:w-auto sm:px-6"
          >
            <MaterialIcon name="add" />
            {t('products.add')}
          </button>
        </div>
      </div>

      {reviewMode ? (
        <div className="mb-stack-lg flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-on-surface">{t('products.reviewBannerTitle')}</p>
            <p className="mt-0.5 text-xs text-on-surface-variant">{t('products.reviewBannerHint')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMissingOnly((value) => !value);
                setPage(1);
              }}
              aria-pressed={missingOnly}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                missingOnly
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <MaterialIcon name="hide_image" className="text-[16px]" />
              {t('products.filterMissingPhotos')}
            </button>
            <button
              type="button"
              onClick={dismissReviewMode}
              className="inline-flex h-9 items-center rounded-full border border-outline-variant bg-surface-container-lowest px-3.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              {t('products.reviewDone')}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mb-stack-lg rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-stack-lg rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {success}
        </p>
      ) : null}

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 sm:mb-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Field
            size="compact"
            icon="search"
            className="min-w-0"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('products.search')}
            aria-label={t('products.search')}
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
              className="absolute end-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
              aria-label={t('common.close')}
            >
              <MaterialIcon name="close" className="text-[16px]" />
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
          <Field
            as="select"
            size="compact"
            icon="category"
            className="min-w-0 sm:w-52"
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            aria-label={t('products.allCategories')}
          >
            <option value="all">{t('products.allCategories')}</option>
            {categoryOptions.map((category) => (
              <option key={category._id} value={category._id}>
                {`${'\u2014 '.repeat(category.depth)}${category.name}`}
              </option>
            ))}
          </Field>
          <Field
            as="select"
            size="compact"
            icon="inventory_2"
            className="min-w-0 sm:w-40"
            value={availabilityFilter}
            onChange={(event) => {
              setAvailabilityFilter(event.target.value);
              setPage(1);
            }}
            aria-label={t('dashboard.availability')}
          >
            <option value="all">{t('products.availabilityAll')}</option>
            <option value="available">{t('products.inStock')}</option>
            <option value="unavailable">{t('products.outOfStock')}</option>
          </Field>
          <button
            type="button"
            onClick={() => {
              setMissingOnly((value) => !value);
              setPage(1);
            }}
            aria-pressed={missingOnly}
            className={`col-span-2 inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 sm:col-span-1 sm:h-11 sm:text-sm ${
              missingOnly
                ? 'bg-primary text-on-primary shadow-sm'
                : 'border border-outline-variant/80 bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <MaterialIcon name="hide_image" className="text-[18px]" />
            {t('products.filterMissingPhotos')}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-on-surface-variant">
          {loading
            ? t('products.loading')
            : pagination.total === 1
              ? t('products.results', { count: pagination.total })
              : t('products.resultsPlural', { count: pagination.total })}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            <MaterialIcon name="filter_alt_off" className="text-[16px]" />
            {t('products.clearFilters')}
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">{t('products.loading')}</p>
      ) : products.length === 0 ? (
        <div className="rounded-xl bg-surface-container px-6 py-8 text-sm text-on-surface-variant">
          <p>{hasActiveFilters ? t('products.emptyFiltered') : t('products.empty')}</p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-on-primary"
            >
              {t('products.clearFilters')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <AdminProductCard
              key={product._id}
              product={product}
              toggling={togglingId === product._id}
              suggesting={false}
              generating={generatingId === product._id || suggestingBatch}
              onEdit={startEdit}
              onDelete={handleDelete}
              onToggleAvailable={handleToggleAvailable}
              onSuggestImage={handleSuggestImage}
              onGenerateImage={handleGenerateImage}
            />
          ))}
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={setPage}
        disabled={loading}
      />

      <MediaImagePickerModal
        open={Boolean(pickerProduct)}
        product={pickerProduct}
        onClose={() => setPickerProduct(null)}
        onApplied={handlePickerApplied}
      />

      <ProductFormModal
        open={isFormOpen}
        editing={Boolean(editingId)}
        form={form}
        categories={leafOptions}
        saving={saving}
        uploading={uploading}
        error={formError}
        onClose={closeForm}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onImageChange={handleImageChange}
        onClearImage={() => setForm((current) => ({ ...current, image: '' }))}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('products.deleteTitle')}
        description={pendingDelete ? t('products.deleteHint', { name: pendingDelete.name }) : ''}
        confirmLabel={t('common.delete')}
        confirmingLabel={t('common.deleting')}
        cancelLabel={t('common.cancel')}
        confirming={deleting}
        onCancel={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
