import { useLocale } from '../../hooks/useLocale.js';
import Field from '../ui/Field.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import AvailabilityToggle from './AvailabilityToggle.jsx';

export default function ProductFormModal({
  open,
  editing,
  form,
  categories,
  saving,
  uploading,
  error,
  onClose,
  onChange,
  onSubmit,
  onImageChange,
  onClearImage,
}) {
  const { t } = useLocale();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/40"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <section className="relative z-10 max-h-[min(92vh,100dvh)] w-full overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-2xl sm:rounded-2xl sm:p-6 sm:pb-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-headline-md font-semibold text-on-surface">
              {editing ? t('productForm.editTitle') : t('productForm.addTitle')}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {editing ? t('productForm.editHint') : t('productForm.addHint')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
            aria-label={t('common.close')}
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Field
            name="name"
            label={t('productForm.name')}
            icon="lunch_dining"
            value={form.name}
            onChange={onChange}
            placeholder="Espresso"
            required
          />
          <Field
            name="price"
            type="number"
            min="0"
            step="0.01"
            label={t('productForm.price')}
            icon="payments"
            value={form.price}
            onChange={onChange}
            placeholder="18"
            required
          />
          <Field as="select" name="categoryId" label={t('productForm.category')} icon="grid_view" value={form.categoryId} onChange={onChange} required>
            <option value="">{t('productForm.selectCategory')}</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.pathLabel || category.name}
              </option>
            ))}
          </Field>
          <Field name="order" type="number" label={t('productForm.order')} icon="sort" value={form.order} onChange={onChange} />
          {categories.find((category) => category._id === form.categoryId)?.sectionKey === 'cafe' ? null : (
          <Field
            as="textarea"
            name="description"
            label={t('productForm.description')}
            icon="notes"
            value={form.description}
            onChange={onChange}
            rows={4}
            maxLength={500}
            placeholder={t('productForm.descriptionPlaceholder')}
            className="md:col-span-2"
            hint={t('productForm.descriptionHint')}
          />
          )}
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-on-surface">{t('productForm.photo')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {form.image ? (
                <CloudinaryImage src={form.image} alt="Aperçu produit" preset="preview" className="h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant">
                  <MaterialIcon name="image" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center rounded-full bg-primary px-4 text-sm font-semibold tracking-[0.04em] text-on-primary shadow-sm transition hover:bg-primary/90">
                  {uploading ? t('settings.uploading') : t('productForm.choosePhoto')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageChange}
                    disabled={uploading}
                  />
                </label>
                {form.image ? (
                  <button
                    type="button"
                    onClick={onClearImage}
                    className="text-sm font-medium text-error hover:underline"
                  >
                    {t('productForm.removePhoto')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3 md:col-span-2">
            <span className="text-sm font-medium text-on-surface">{t('productForm.availability')}</span>
            <AvailabilityToggle
              checked={Boolean(form.available)}
              label={t('productForm.availableLabel')}
              onChange={() =>
                onChange({
                  target: { name: 'available', type: 'checkbox', checked: !form.available },
                })
              }
            />
          </div>
          <div className="mt-2 flex flex-col-reverse gap-2 md:col-span-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="submit"
              disabled={saving || uploading || categories.length === 0}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-label-lg font-semibold tracking-[0.05em] text-on-primary shadow-md transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-60"
            >
              {saving ? t('common.saving') : editing ? t('productForm.update') : t('productForm.create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-full bg-surface-container-high px-6 text-label-lg font-semibold tracking-[0.05em] text-on-surface transition hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              {t('common.cancel')}
            </button>
          </div>
          {categories.length === 0 ? (
            <p className="text-sm text-on-surface-variant md:col-span-2">
              {t('productForm.needCategory')}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
