import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminProductCard from '../components/dashboard/AdminProductCard.jsx';
import MediaImagePickerModal from '../components/dashboard/MediaImagePickerModal.jsx';
import ProductFormModal from '../components/dashboard/ProductFormModal.jsx';
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
  updateProduct,
  uploadProductImage,
} from '../services/product.service.js';
import { getApiError } from '../utils/apiError.js';
import { categoryPathLabel, leafCategories } from '../utils/categoryTree.js';

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
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [missingOnly, setMissingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const skipFilterDebounceRef = useRef(true);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError('');

      try {
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

        const [productResult, categoryItems] = await Promise.all([
          getProducts(params),
          listCategoryOptions(),
        ]);
        let items = productResult.items || [];
        if (missingOnly) {
          items = items.filter((item) => !item.image);
        }
        setProducts(items);
        setPagination(productResult.pagination);
        setCategories(categoryItems);
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
    setPage(1);
  }, [search, categoryFilter, availabilityFilter, missingOnly]);

  useEffect(() => {
    if (skipFilterDebounceRef.current) {
      skipFilterDebounceRef.current = false;
      loadData();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      loadData();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const leafOptions = useMemo(
    () =>
      leafCategories(categories).map((category) => ({
        ...category,
        pathLabel: categoryPathLabel(categories, category._id),
      })),
    [categories],
  );

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

  async function handleDelete(product) {
    const confirmed = window.confirm(t('products.deleteConfirm', { name: product.name }));

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteProduct(product._id);

      if (editingId === product._id) {
        closeForm();
      }

      await loadData(true);
    } catch (err) {
      setError(getApiError(err, t, 'products.deleteError'));
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
      const result = await suggestProductImagesBatch({
        onlyMissing: true,
        limit: 20,
      });
      await loadData(true);
      setSuccess(
        t('products.suggestBatchSuccess', {
          updated: result?.summary?.updated ?? 0,
          failed: result?.summary?.failed ?? 0,
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
      <div className="mb-stack-lg flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-display-md font-bold text-on-surface">
            {reviewMode ? t('products.reviewTitle') : t('products.title')}
          </h1>
          <p className="mt-1 text-on-surface-variant">
            {reviewMode ? t('products.reviewSubtitle') : t('products.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {missingPhotos > 0 || reviewMode ? (
            <button
              type="button"
              disabled={suggestingBatch || loading}
              onClick={handleSuggestMissingBatch}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-3 text-label-lg font-semibold tracking-[0.05em] text-on-surface transition hover:bg-surface-container disabled:opacity-50"
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
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-label-lg font-semibold tracking-[0.05em] text-on-primary shadow-md transition-all hover:bg-primary/90"
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
              onClick={() => setMissingOnly((value) => !value)}
              className={`inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold ${
                missingOnly
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant bg-surface-container-lowest text-on-surface'
              }`}
            >
              {t('products.filterMissingPhotos')}
            </button>
            <button
              type="button"
              onClick={dismissReviewMode}
              className="inline-flex h-9 items-center rounded-full border border-outline-variant bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface"
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

      <div className="mb-stack-lg flex flex-col items-stretch gap-gutter rounded-xl bg-surface-container-low p-stack-md shadow-sm sm:flex-row sm:items-end">
        <Field
          size="compact"
          icon="search"
          className="w-full sm:w-96"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('products.search')}
        />
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Field
            as="select"
            size="compact"
            className="w-full sm:min-w-48"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">{t('products.allCategories')}</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {categoryPathLabel(categories, category._id)}
              </option>
            ))}
          </Field>
          <Field
            as="select"
            size="compact"
            className="w-full sm:min-w-44"
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value)}
          >
            <option value="all">{t('products.availabilityAll')}</option>
            <option value="available">{t('products.inStock')}</option>
            <option value="unavailable">{t('products.outOfStock')}</option>
          </Field>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">{t('products.loading')}</p>
      ) : products.length === 0 ? (
        <p className="rounded-xl bg-surface-container px-6 py-8 text-sm text-on-surface-variant">
          {t('products.empty')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <AdminProductCard
              key={product._id}
              product={product}
              toggling={togglingId === product._id}
              suggesting={false}
              onEdit={startEdit}
              onDelete={handleDelete}
              onToggleAvailable={handleToggleAvailable}
              onSuggestImage={handleSuggestImage}
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
    </div>
  );
}
