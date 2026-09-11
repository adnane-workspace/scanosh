import {
  createCategory,
  deleteCategory,
  listCategoryOptions,
  updateCategory,
  uploadCategoryImage,
} from '../services/category.service.js';
import { getApiError } from '../utils/apiError.js';
import {
  siblingCategories,
} from '../utils/categoryTree.js';
import { categoryIcon } from '../utils/format.js';
import { normalizeMenuUi, normalizeSectionVisibility } from '../utils/menuUi.js';
import { MAX_MENU_SECTIONS, sectionIcon, slugifySectionKey } from '../utils/menuSections.js';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import CloudinaryImage from '../components/ui/CloudinaryImage.jsx';
import CategoryFormModal from '../components/dashboard/CategoryFormModal.jsx';
import { clearPublicMenuCache } from '../hooks/usePublicMenu.js';
import { useLocale } from '../hooks/useLocale.js';
import { getMyCafe, updateMyCafe } from '../services/cafe.service.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const emptyForm = {
  name: '',
  description: '',
  image: '',
  order: 0,
  parentId: '',
};

function CategoryIdentity({ category, parentName, t }) {
  const isChild = category.depth > 0;
  const isSection = Boolean(category.sectionKey);

  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-surface-container text-primary ${
          isChild ? 'h-10 w-10 rounded-lg' : 'h-12 w-12 rounded-xl shadow-sm'
        }`}
      >
        {category.image ? (
          <CloudinaryImage src={category.image} alt="" preset="thumb" className="h-full w-full object-cover" />
        ) : (
          <MaterialIcon
            name={isSection ? sectionIcon(category.sectionKey) : categoryIcon(category.name)}
            className={isChild ? 'text-[20px]' : 'text-[24px]'}
          />
        )}
      </div>
      <div className="min-w-0">
        {isSection ? (
          <p className="mb-0.5 text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
            {t('categories.sectionLabel')}
          </p>
        ) : isChild ? (
          <p className="mb-0.5 text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
            {t('categories.subcategory')}
            {parentName ? ` · ${t('categories.inside', { name: parentName })}` : ''}
          </p>
        ) : (
          <p className="mb-0.5 text-[11px] font-semibold tracking-[0.08em] text-on-surface-variant uppercase">
            {t('categories.rootLabel')}
          </p>
        )}
        <h3 className={`truncate font-semibold tracking-tight text-on-surface ${isChild ? 'text-base' : 'text-lg'}`}>
          {category.name}
        </h3>
        <p className="mt-0.5 truncate text-sm text-on-surface-variant">
          {category.description || t('categories.noDescription')}
        </p>
      </div>
    </div>
  );
}

function CategoryActions({ category, canAddChild, onEdit, onDelete, onAddChild, hideAddChild = false, t }) {
  return (
    <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
      {canAddChild && !hideAddChild ? (
        <button
          type="button"
          title={t('categories.addChild', { name: category.name })}
          onClick={() => onAddChild(category)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
        >
          <MaterialIcon name="subdirectory_arrow_right" className="text-[20px]" />
        </button>
      ) : null}
      <button
        type="button"
        title={t('common.edit')}
        onClick={() => onEdit(category)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
      >
        <MaterialIcon name="edit" className="text-[20px]" />
      </button>
      <button
        type="button"
        title={t('common.delete')}
        onClick={() => onDelete(category)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
      >
        <MaterialIcon name="delete" className="text-[20px]" />
      </button>
    </div>
  );
}

export default function CategoriesPage() {
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cafe, setCafe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingSectionKey, setEditingSectionKey] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionError, setSectionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const [categoryOptions, cafeData] = await Promise.all([listCategoryOptions(), getMyCafe()]);
      setCategories(categoryOptions);
      setCafe(cafeData);
    } catch (err) {
      setError(getApiError(err, t, 'categories.loadError'));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sectionVisibility = normalizeSectionVisibility(cafe?.menuUi?.sectionVisibility);
  const sectionRoots = useMemo(
    () =>
      categories
        .filter((category) => category.sectionKey)
        .sort((left, right) => (left.order - right.order) || left.name.localeCompare(right.name)),
    [categories],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category._id, category])),
    [categories],
  );

  function nextSiblingOrder(parentId) {
    const siblings = siblingCategories(categories, parentId || null);
    return siblings.reduce((max, category) => Math.max(max, Number(category.order) || 0), 0) + 1;
  }

  function canAddChild(category) {
    return category.childCount > 0 || !category.productCount;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'order' ? Number(value) : value,
    }));
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setEditingSectionKey(null);
    setForm(emptyForm);
    setFormError('');
  }

  function openCreateForm(parentId = '') {
    setEditingId(null);
    setEditingSectionKey(null);
    setForm({ ...emptyForm, parentId: parentId || '', order: nextSiblingOrder(parentId || null) });
    setFormError('');
    setError('');
    setIsFormOpen(true);
  }

  useEffect(() => {
    if (loading || searchParams.get('new') !== '1' || sectionRoots.length === 0) {
      return;
    }

    openCreateForm(sectionRoots[0]._id);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [loading, searchParams, setSearchParams, sectionRoots]);

  function startEdit(category) {
    setEditingId(category._id);
    setEditingSectionKey(category.sectionKey || null);
    setForm({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      order: category.order ?? 0,
      parentId: category.parentId || '',
    });
    setFormError('');
    setError('');
    setIsFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError(t('validation.nameRequired'));
      return;
    }

    if (!editingSectionKey && !form.parentId) {
      setFormError(t('categoryForm.selectSection'));
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      order: Number.isNaN(form.order) ? 0 : form.order,
    };

    if (!editingSectionKey) {
      payload.parentId = form.parentId || null;
    }

    try {
      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }

      closeForm();
      clearPublicMenuCache();
      await loadData(true);
    } catch (err) {
      setFormError(getApiError(err, t, 'validation.saveCategory'));
    } finally {
      setSaving(false);
    }
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
      const url = await uploadCategoryImage(file);
      setForm((current) => ({ ...current, image: url }));
    } catch (err) {
      setFormError(getApiError(err, t, 'validation.uploadImage'));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(t('categories.deleteConfirm', { name: category.name }));

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteCategory(category._id);
      clearPublicMenuCache();

      if (editingId === category._id) {
        closeForm();
      }

      await loadData(true);
    } catch (err) {
      setError(getApiError(err, t, 'categories.deleteError'));
    }
  }

  async function persistSiblingOrder(parentId, nextSiblings) {
    const updates = nextSiblings
      .map((category, index) => ({ category, order: index + 1 }))
      .filter(({ category, order }) => category.order !== order);

    if (updates.length === 0) {
      return;
    }

    setReordering(true);
    setError('');

    try {
      await Promise.all(updates.map(({ category, order }) => updateCategory(category._id, { order })));
      const ordered = new Map(nextSiblings.map((category, index) => [category._id, index + 1]));
      setCategories((current) =>
        current.map((category) =>
          ordered.has(category._id) ? { ...category, order: ordered.get(category._id) } : category,
        ),
      );
    } catch (err) {
      setError(getApiError(err, t, 'categories.reorderError'));
      await loadData(true);
    } finally {
      setReordering(false);
    }
  }

  function handleDragStart(event, category) {
    if (reordering || event.target.closest('button')) {
      event.preventDefault();
      return;
    }

    setDragId(category._id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', category._id);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(event, dropCategory) {
    event.preventDefault();
    const fromId = dragId || event.dataTransfer.getData('text/plain');
    setDragId(null);

    const fromCategory = categories.find((category) => category._id === fromId);

    if (!fromCategory || fromCategory._id === dropCategory._id) {
      return;
    }

    if ((fromCategory.parentId || null) !== (dropCategory.parentId || null)) {
      return;
    }

    const siblings = siblingCategories(categories, fromCategory.parentId);
    const fromIndex = siblings.findIndex((category) => category._id === fromId);
    const dropIndex = siblings.findIndex((category) => category._id === dropCategory._id);

    if (fromIndex < 0 || dropIndex < 0) {
      return;
    }

    const next = [...siblings];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(dropIndex, 0, moved);
    await persistSiblingOrder(fromCategory.parentId, next);
  }

  function handleDragEnd() {
    setDragId(null);
  }

  async function moveCategory(category, delta) {
    const siblings = siblingCategories(categories, category.parentId);
    const index = siblings.findIndex((item) => item._id === category._id);
    const nextIndex = index + delta;

    if (reordering || index < 0 || nextIndex < 0 || nextIndex >= siblings.length) {
      return;
    }

    const next = [...siblings];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    await persistSiblingOrder(category.parentId, next);
  }

  async function handleToggleSectionVisibility(sectionKey, visible) {
    const nextVisibility = {
      ...sectionVisibility,
      [sectionKey]: visible,
    };
    const visibleCount = sectionRoots.filter((section) => nextVisibility[section.sectionKey] !== false).length;

    if (visibleCount === 0) {
      setError(t('categories.sectionKeepOneVisible'));
      return;
    }

    setError('');

    try {
      const updated = await updateMyCafe({
        menuUi: {
          ...normalizeMenuUi(cafe?.menuUi),
          sectionsEnabled: true,
          sectionVisibility: nextVisibility,
        },
      });
      setCafe(updated);
      clearPublicMenuCache();
    } catch (err) {
      setError(getApiError(err, t, 'categories.sectionsToggleError'));
    }
  }

  function openSectionForm() {
    setSectionName('');
    setSectionError('');
    setIsSectionFormOpen(true);
  }

  function closeSectionForm() {
    setIsSectionFormOpen(false);
    setSectionName('');
    setSectionError('');
  }

  async function handleCreateSection(event) {
    event.preventDefault();
    const name = sectionName.trim();

    if (!name) {
      setSectionError(t('validation.nameRequired'));
      return;
    }

    if (sectionRoots.length >= MAX_MENU_SECTIONS) {
      setSectionError(t('categories.sectionMax', { max: MAX_MENU_SECTIONS }));
      return;
    }

    const sectionKey = slugifySectionKey(name);

    if (!sectionKey) {
      setSectionError(t('categories.sectionKeyInvalid'));
      return;
    }

    if (sectionRoots.some((section) => section.sectionKey === sectionKey)) {
      setSectionError(t('categories.sectionKeyDuplicate'));
      return;
    }

    setSectionSaving(true);
    setSectionError('');

    try {
      await createCategory({
        name,
        sectionKey,
        order: sectionRoots.length + 1,
      });
      closeSectionForm();
      clearPublicMenuCache();
      await loadData(true);
    } catch (err) {
      setSectionError(getApiError(err, t, 'categories.sectionCreateError'));
    } finally {
      setSectionSaving(false);
    }
  }

  function renderCategoryRow(category, { hideAddChild = false } = {}) {
    const count = category.productCount || 0;
    const childCount = category.childCount || 0;
    const siblings = siblingCategories(categories, category.parentId);
    const siblingIndex = siblings.findIndex((item) => item._id === category._id);
    const isChild = category.depth > 0 || Boolean(category.parentId);
    const parentName = category.parentId ? categoryById.get(category.parentId)?.name : '';

    return (
      <li
        key={category._id}
        draggable={!reordering && !category.sectionKey}
        onDragStart={(event) => handleDragStart(event, category)}
        onDragOver={handleDragOver}
        onDrop={(event) => handleDrop(event, category)}
        onDragEnd={handleDragEnd}
        style={undefined}
        className={`group rounded-2xl border transition-colors duration-200 ${
          isChild
            ? 'border-primary/20 bg-surface-container-low/70'
            : 'border-outline-variant bg-surface-container-lowest'
        } ${dragId === category._id ? 'opacity-50 shadow-lg' : 'hover:border-outline'}`}
      >
        <div
          className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
          role="button"
          tabIndex={0}
          onClick={() => startEdit(category)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              startEdit(category);
            }
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className="hidden cursor-grab text-on-surface-variant md:inline-flex active:cursor-grabbing"
              onClick={(event) => event.stopPropagation()}
            >
              <MaterialIcon name="drag_handle" className="text-[20px]" />
            </span>
            {isChild && !category.sectionKey ? (
              <MaterialIcon name="subdirectory_arrow_right" className="hidden shrink-0 text-primary sm:inline-flex" />
            ) : null}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                isChild ? 'bg-primary/12 text-primary' : 'bg-surface-container-high text-on-surface'
              }`}
            >
              {siblingIndex + 1}
            </span>
            <CategoryIdentity category={category} parentName={parentName} t={t} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-3">
            <div className="flex flex-wrap gap-2">
              {childCount > 0 ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {childCount === 1
                    ? t('categories.childrenOne')
                    : t('categories.children', { count: childCount })}
                </span>
              ) : null}
              {!category.sectionKey ? (
                <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface">
                  {count > 1 ? t('categories.itemsPlural', { count }) : t('categories.items', { count })}
                </span>
              ) : null}
            </div>
            <div className="flex items-center" onClick={(event) => event.stopPropagation()}>
              <div className="flex md:hidden">
                <button
                  type="button"
                  aria-label={t('categories.moveUp', { name: category.name })}
                  disabled={reordering || siblingIndex === 0}
                  onClick={() => moveCategory(category, -1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant disabled:opacity-30"
                >
                  <MaterialIcon name="keyboard_arrow_up" />
                </button>
                <button
                  type="button"
                  aria-label={t('categories.moveDown', { name: category.name })}
                  disabled={reordering || siblingIndex === siblings.length - 1}
                  onClick={() => moveCategory(category, 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant disabled:opacity-30"
                >
                  <MaterialIcon name="keyboard_arrow_down" />
                </button>
              </div>
              <CategoryActions
                category={category}
                canAddChild={canAddChild(category)}
                hideAddChild={hideAddChild || Boolean(category.sectionKey)}
                onEdit={startEdit}
                onDelete={handleDelete}
                onAddChild={(item) => openCreateForm(item._id)}
                t={t}
              />
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className="relative flex w-full flex-col">
      <div className="relative z-10 mb-stack-lg flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 font-display text-display-md font-bold tracking-tight text-on-surface lg:text-display-lg">
            {t('categories.title')}
          </h1>
          <p className="max-w-2xl text-on-surface-variant">{t('categories.subtitleSections')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openSectionForm}
            disabled={sectionRoots.length >= MAX_MENU_SECTIONS}
            className="group inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-3 text-on-surface transition-all duration-300 hover:bg-surface-container-high disabled:opacity-50"
          >
            <MaterialIcon name="add" className="text-[20px]" />
            <span className="text-label-lg font-semibold tracking-[0.05em]">{t('categories.addSection')}</span>
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-stack-lg rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="relative">
          {loading ? (
            <p className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-6 py-8 text-sm text-on-surface-variant">
              {t('categories.loading')}
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {sectionRoots.map((section) => {
                const sectionKey = section.sectionKey;
                const children = siblingCategories(categories, section._id);
                const sectionVisible = sectionVisibility[sectionKey] !== false;

                return (
                  <section
                    key={section._id}
                    className={`rounded-[18px] border bg-surface-container-lowest p-4 sm:p-5 ${
                      sectionVisible ? 'border-outline-variant' : 'border-dashed border-outline-variant/80 opacity-75'
                    }`}
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
                          {t('categories.sectionLabel')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-on-surface">{section.name}</h2>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              sectionVisible
                                ? 'bg-tertiary/15 text-tertiary'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {sectionVisible ? t('categories.sectionVisible') : t('categories.sectionHidden')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-on-surface-variant">{t('categories.sectionVisibleHint')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={sectionVisible}
                          aria-label={t('categories.sectionVisible')}
                          onClick={() => handleToggleSectionVisibility(sectionKey, !sectionVisible)}
                          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                            sectionVisible ? 'bg-primary' : 'bg-outline-variant'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${
                              sectionVisible ? 'translate-x-6' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(section)}
                          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface"
                        >
                          <MaterialIcon name="edit" className="text-[18px]" />
                          {t('categories.editSection')}
                        </button>
                        {sectionRoots.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(section)}
                            className="inline-flex items-center gap-2 rounded-xl border border-error/30 px-4 py-2 text-sm font-semibold text-error"
                          >
                            <MaterialIcon name="delete" className="text-[18px]" />
                            {t('common.delete')}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openCreateForm(section._id)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
                        >
                          <MaterialIcon name="add" className="text-[18px]" />
                          {t('categories.addInSection')}
                        </button>
                      </div>
                    </div>
                    {children.length ? (
                      <ul className="flex flex-col gap-2">{children.map((category) => renderCategoryRow(category, { hideAddChild: true }))}</ul>
                    ) : (
                      <p className="rounded-2xl border border-dashed border-outline-variant px-4 py-6 text-sm text-on-surface-variant">
                        {t('categories.sectionEmpty')}
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          )}
      </div>

      <CategoryFormModal
        open={isFormOpen}
        editing={Boolean(editingId)}
        form={form}
        parentOptions={sectionRoots.map((section) => ({
          _id: section._id,
          name: section.name,
          depth: 0,
        }))}
        showParentSelect={!editingSectionKey}
        parentLabel={t('categoryForm.section')}
        parentPlaceholder={t('categoryForm.selectSection')}
        sectionLabel={
          editingSectionKey
            ? t('categories.sectionFixedLabel', {
                name: categoryById.get(editingId)?.name || editingSectionKey,
              })
            : ''
        }
        saving={saving}
        uploading={uploading}
        error={formError}
        onClose={closeForm}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onImageChange={handleImageChange}
        onClearImage={() => setForm((current) => ({ ...current, image: '' }))}
      />

      {isSectionFormOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <button type="button" className="absolute inset-0 bg-on-surface/40" aria-label={t('common.close')} onClick={closeSectionForm} />
          <form
            onSubmit={handleCreateSection}
            className="relative z-10 w-full rounded-t-2xl bg-surface-container-lowest p-6 shadow-xl sm:max-w-md sm:rounded-2xl"
          >
            <h2 className="font-display text-headline-md font-semibold text-on-surface">{t('categories.addSection')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t('categories.addSectionHint')}</p>
            {sectionError ? (
              <p className="mt-4 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
                {sectionError}
              </p>
            ) : null}
            <label className="mt-5 grid gap-2">
              <span className="text-sm font-medium text-on-surface">{t('categories.sectionName')}</span>
              <input
                type="text"
                value={sectionName}
                onChange={(event) => setSectionName(event.target.value)}
                maxLength={80}
                placeholder={t('categories.sectionNamePlaceholder')}
                className="rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface"
                autoFocus
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeSectionForm}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={sectionSaving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
              >
                {sectionSaving ? t('common.saving') : t('categories.addSection')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
