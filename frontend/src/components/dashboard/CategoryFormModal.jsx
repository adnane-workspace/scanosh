import { useLocale } from '../../hooks/useLocale.js';
import Field from '../ui/Field.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';

export default function CategoryFormModal({
  open,
  editing,
  form,
  parentOptions = [],
  showParentSelect = true,
  parentLabel = '',
  parentPlaceholder = '',
  sectionLabel = '',
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
      <button type="button" className="absolute inset-0 bg-on-surface/40" aria-label={t('common.close')} onClick={onClose} />
      <section className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-6 shadow-xl sm:max-w-xl sm:rounded-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-headline-md font-semibold text-on-surface">
              {editing ? t('categoryForm.editTitle') : t('categoryForm.addTitle')}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {editing ? t('categoryForm.editHint') : t('categoryForm.addHint')}
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

        <form onSubmit={onSubmit} className="grid gap-4">
          <Field name="name" label={t('categoryForm.name')} icon="label" value={form.name} onChange={onChange} placeholder="Cafés" required />
          {sectionLabel ? (
            <p className="rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
              {sectionLabel}
            </p>
          ) : null}
          {showParentSelect ? (
            <Field
              as="select"
              name="parentId"
              label={parentLabel || t('categoryForm.parent')}
              icon="account_tree"
              value={form.parentId || ''}
              onChange={onChange}
              required
            >
              <option value="">{parentPlaceholder || t('categoryForm.selectSection')}</option>
              {parentOptions.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Field>
          ) : null}
          <Field name="order" type="number" label={t('categoryForm.order')} icon="sort" value={form.order} onChange={onChange} />
          <Field
            as="textarea"
            name="description"
            label={t('categoryForm.description')}
            value={form.description}
            onChange={onChange}
            rows={3}
            placeholder="Servi de 7h à 11h"
          />
          <div>
            <p className="text-sm font-medium text-on-surface">{t('categoryForm.image')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {form.image ? (
                <CloudinaryImage src={form.image} alt="Aperçu catégorie" preset="preview" className="h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant">
                  <MaterialIcon name="image" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer rounded-xl bg-primary px-4 py-2 text-label-lg font-semibold tracking-[0.05em] text-on-primary">
                  {uploading ? t('settings.uploading') : t('categoryForm.chooseImage')}
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
                    {t('categoryForm.removeImage')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-xl bg-primary px-6 py-3 text-label-lg font-semibold tracking-[0.05em] text-on-primary shadow-md disabled:opacity-60"
            >
              {saving ? t('common.saving') : editing ? t('categoryForm.update') : t('categoryForm.create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-surface-container-high px-6 py-3 text-label-lg font-semibold tracking-[0.05em] text-on-surface"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
