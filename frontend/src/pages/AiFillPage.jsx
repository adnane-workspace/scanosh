import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MediaImagePickerModal from '../components/dashboard/MediaImagePickerModal.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import CloudinaryImage from '../components/ui/CloudinaryImage.jsx';
import { useLocale } from '../hooks/useLocale.js';
import { listCategoryOptions } from '../services/category.service.js';
import {
  createMenuImport,
  getMenuImportStatus,
  listMenuImports,
  publishMenuImport,
  suggestMenuImportImages,
  updateMenuImportDraft,
} from '../services/menuImport.service.js';
import { uploadProductImage } from '../services/product.service.js';
import { getApiError } from '../utils/apiError.js';
import { formatDate } from '../utils/format.js';
import { DEFAULT_SECTION_DEFS, isMenuSectionKey } from '../utils/menuSections.js';

const MERGE_LEVELS = ['paragraph', 'sentence', 'word'];

function emptyDraft() {
  return { categories: [], meta: {} };
}

function cloneDraft(draft) {
  return JSON.parse(JSON.stringify(draft || emptyDraft()));
}

function statusMeta(status, t) {
  if (status === 'published') {
    return { label: t('aiFill.statusPublished'), tone: 'ok', icon: 'check_circle' };
  }
  if (status === 'failed') {
    return { label: t('aiFill.statusFailed'), tone: 'error', icon: 'error' };
  }
  if (status === 'reviewed') {
    return { label: t('aiFill.statusReviewed'), tone: 'warn', icon: 'edit_note' };
  }
  return { label: t('aiFill.statusPending'), tone: 'muted', icon: 'pending' };
}

function toneClass(tone) {
  if (tone === 'ok') return 'bg-primary/10 text-primary';
  if (tone === 'error') return 'bg-error-container text-error';
  if (tone === 'warn') return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  return 'bg-surface-container text-on-surface-variant';
}

export default function AiFillPage() {
  const { t, locale } = useLocale();
  const inputRef = useRef(null);
  const reviewRef = useRef(null);
  const [configured, setConfigured] = useState(true);
  const [, setLlmConfigured] = useState(false);
  const [mergeLevel, setMergeLevel] = useState('paragraph');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [tab, setTab] = useState('review');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [menuSections, setMenuSections] = useState(
    DEFAULT_SECTION_DEFS.map((item) => ({ key: item.key, name: item.name })),
  );
  const [publishSummary, setPublishSummary] = useState(null);
  const [suggestingPhotos, setSuggestingPhotos] = useState(false);
  const [photoSummary, setPhotoSummary] = useState(null);
  const [photoProgress, setPhotoProgress] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const photosRef = useRef(null);
  const productImageInputRef = useRef(null);
  const [imageTarget, setImageTarget] = useState(null);
  const [pickerProduct, setPickerProduct] = useState(null);
  const [uploadingImageId, setUploadingImageId] = useState('');

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { items } = await listMenuImports({ page: 1, limit: 8 });
      setHistory(items);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMenuImportStatus()
      .then((status) => {
        if (!cancelled) {
          setConfigured(Boolean(status?.configured));
          setLlmConfigured(Boolean(status?.llmConfigured));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfigured(false);
          setLlmConfigured(false);
        }
      });
    listCategoryOptions()
      .then((categories) => {
        if (cancelled) return;
        const sections = (categories || [])
          .filter((item) => item.sectionKey)
          .sort((a, b) => (a.order - b.order) || String(a.name).localeCompare(String(b.name)))
          .map((item) => ({ key: item.sectionKey, name: item.name }));
        if (sections.length) setMenuSections(sections);
      })
      .catch(() => {});
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [loadHistory]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const sectionOptions = useMemo(() => {
    const byKey = new Map(menuSections.map((item) => [item.key, item]));
    for (const cat of draft.categories || []) {
      const key = String(cat.sectionKey || '').toLowerCase();
      if (isMenuSectionKey(key) && !byKey.has(key)) {
        byKey.set(key, { key, name: key });
      }
    }
    return [...byKey.values()];
  }, [menuSections, draft.categories]);

  const defaultSectionKey = sectionOptions[0]?.key || 'restaurant';

  const sectionCounts = useMemo(() => {
    const counts = { all: (draft.categories || []).length };
    for (const section of sectionOptions) counts[section.key] = 0;
    for (const cat of draft.categories || []) {
      const key = isMenuSectionKey(cat.sectionKey) ? cat.sectionKey : defaultSectionKey;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [draft.categories, sectionOptions, defaultSectionKey]);

  const visibleCategories = useMemo(() => {
    const list = draft.categories || [];
    if (sectionFilter === 'all') return list;
    return list.filter((c) => {
      const key = isMenuSectionKey(c.sectionKey) ? c.sectionKey : defaultSectionKey;
      return key === sectionFilter;
    });
  }, [draft.categories, sectionFilter, defaultSectionKey]);

  const selectedCounts = useMemo(() => {
    let categories = 0;
    let products = 0;
    let review = 0;
    let totalProducts = 0;
    let withPhoto = 0;
    for (const cat of draft.categories || []) {
      const all = cat.products || [];
      totalProducts += all.length;
      const selectedProducts = all.filter((p) => p.selected);
      if (cat.selected && selectedProducts.length) categories += 1;
      products += selectedProducts.length;
      withPhoto += selectedProducts.filter((p) => p.image).length;
      review += all.filter((p) => p.needsReview && p.selected).length;
    }
    return { categories, products, review, totalProducts, withPhoto };
  }, [draft]);

  const isPublished = result?.status === 'published';
  const busy = running || saving || publishing || suggestingPhotos;

  const stepStates = useMemo(() => {
    const map = {
      1: !result ? 'active' : 'done',
      2: !result ? 'todo' : isPublished ? 'done' : suggestingPhotos ? 'done' : 'active',
      3: !result ? 'todo' : isPublished ? 'done' : suggestingPhotos || photoSummary ? 'active' : 'todo',
      4: !result ? 'todo' : isPublished ? 'done' : photoSummary ? 'todo' : 'todo',
    };
    if (suggestingPhotos) {
      map[2] = 'done';
      map[3] = 'active';
      map[4] = 'todo';
    }
    if (publishing) {
      map[2] = 'done';
      map[3] = 'done';
      map[4] = 'active';
    }
    if (photoSummary && !isPublished && !suggestingPhotos) {
      map[3] = 'done';
      map[4] = 'active';
    }
    return map;
  }, [result, isPublished, photoSummary, suggestingPhotos, publishing]);

  function applyImport(item, { resetPhotos = true } = {}) {
    setResult(item);
    setDraft(cloneDraft(item.draftMenu || emptyDraft()));
    setTab(item.draftMenu?.categories?.length ? 'review' : 'text');
    setSectionFilter('all');
    setPublishSummary(null);
    if (resetPhotos) {
      setPhotoSummary(null);
      setPhotoProgress(null);
    }
    setSuccess('');
    setError('');
    setCollapsed({});
    window.setTimeout(() => {
      reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function resetUploadState() {
    setError('');
    setSuccess('');
    setResult(null);
    setDraft(emptyDraft());
    setPublishSummary(null);
    setCollapsed({});
  }

  function onPickFile(event) {
    const next = event.target.files?.[0] || null;
    setFile(next);
    resetUploadState();
  }

  function onDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const next = event.dataTransfer.files?.[0] || null;
    if (!next) return;
    if (!next.type.startsWith('image/')) {
      setError(t('aiFill.invalidImage'));
      return;
    }
    setFile(next);
    resetUploadState();
  }

  async function handleRun() {
    if (!file) {
      setError(t('aiFill.pickImage'));
      return;
    }

    setRunning(true);
    setError('');
    setSuccess('');
    setPublishSummary(null);
    try {
      const item = await createMenuImport(file, { mergeLevel });
      applyImport(item);
      await loadHistory();
    } catch (err) {
      setError(getApiError(err, t, 'aiFill.runError'));
    } finally {
      setRunning(false);
    }
  }

  function updateCategory(catId, patch) {
    setDraft((prev) => ({
      ...prev,
      categories: (prev.categories || []).map((cat) =>
        cat.id === catId ? { ...cat, ...patch } : cat,
      ),
    }));
  }

  function updateProduct(catId, prodId, patch) {
    setDraft((prev) => ({
      ...prev,
      categories: (prev.categories || []).map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          products: (cat.products || []).map((prod) =>
            prod.id === prodId ? { ...prod, ...patch, needsReview: false } : prod,
          ),
        };
      }),
    }));
  }

  function openProductImageUpload(catId, prodId) {
    if (isPublished) return;
    setImageTarget({ catId, prodId });
    window.setTimeout(() => productImageInputRef.current?.click(), 0);
  }

  async function handleProductImageFile(event) {
    const fileNext = event.target.files?.[0];
    event.target.value = '';
    if (!fileNext || !imageTarget) return;
    if (!fileNext.type.startsWith('image/')) {
      setError(t('aiFill.invalidImage'));
      return;
    }

    setUploadingImageId(imageTarget.prodId);
    setError('');
    try {
      const url = await uploadProductImage(fileNext);
      updateProduct(imageTarget.catId, imageTarget.prodId, {
        image: url,
        imageSource: 'upload',
      });
    } catch (err) {
      setError(getApiError(err, t, 'products.suggestImageError'));
    } finally {
      setUploadingImageId('');
      setImageTarget(null);
    }
  }

  function removeProduct(catId, prodId) {
    setDraft((prev) => ({
      ...prev,
      categories: (prev.categories || []).map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          products: (cat.products || []).filter((prod) => prod.id !== prodId),
        };
      }),
    }));
  }

  function setAllSelected(selected) {
    setDraft((prev) => ({
      ...prev,
      categories: (prev.categories || []).map((cat) => ({
        ...cat,
        selected,
        products: (cat.products || []).map((prod) => ({ ...prod, selected })),
      })),
    }));
  }

  function toggleCollapsed(catId) {
    setCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  async function handleSaveDraft() {
    if (!result?._id || isPublished) return;
    setSaving(true);
    setError('');
    try {
      const item = await updateMenuImportDraft(result._id, draft);
      applyImport(item, { resetPhotos: false });
      setSuccess(t('aiFill.draftSaved'));
      await loadHistory();
    } catch (err) {
      setError(getApiError(err, t, 'aiFill.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!result?._id || isPublished) return;
    if (!selectedCounts.products) {
      setError(t('aiFill.selectProduct'));
      return;
    }

    setPublishing(true);
    setError('');
    setSuccess('');
    try {
      const published = await publishMenuImport(result._id, draft);
      setResult(published.import);
      setDraft(cloneDraft(published.import?.draftMenu || draft));
      setPublishSummary(published.summary);
      setSuccess(
        published.summary?.alreadyPublished
          ? t('aiFill.alreadyPublished')
          : t('aiFill.publishSuccess'),
      );
      await loadHistory();
    } catch (err) {
      setError(getApiError(err, t, 'aiFill.publishError'));
    } finally {
      setPublishing(false);
    }
  }

  async function handleSuggestPhotos({ overwrite = false } = {}) {
    if (!result?._id || isPublished) return;
    if (!selectedCounts.products) {
      setError(t('aiFill.suggestPhotosEmpty'));
      return;
    }

    setSuggestingPhotos(true);
    setError('');
    setSuccess('');

    const total = selectedCounts.products;
    setPhotoProgress({ done: 0, total, stage: 'library' });
    window.setTimeout(() => {
      photosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    let updated = 0;
    let failed = 0;
    let skipped = 0;
    let fromLibrary = 0;
    let fromFlux = 0;
    let latestDraft = draft;

    try {
      const library = await suggestMenuImportImages(result._id, {
        draftMenu: latestDraft,
        stage: 'library',
        overwrite,
      });
      latestDraft = cloneDraft(library.import?.draftMenu || latestDraft);
      setResult(library.import);
      setDraft(latestDraft);
      updated += library.summary?.updated ?? 0;
      skipped += library.summary?.skipped ?? 0;
      fromLibrary += library.summary?.fromLibrary ?? 0;
      setPhotoProgress({
        done: fromLibrary,
        total,
        stage: 'flux',
      });

      let safety = 0;
      let fluxUpdated = 0;
      do {
        const flux = await suggestMenuImportImages(result._id, {
          draftMenu: latestDraft,
          stage: 'flux',
          overwrite: false,
        });
        latestDraft = cloneDraft(flux.import?.draftMenu || latestDraft);
        setResult(flux.import);
        setDraft(latestDraft);
        fluxUpdated = flux.summary?.updated ?? 0;
        updated += fluxUpdated;
        failed += flux.summary?.failed ?? 0;
        fromFlux += flux.summary?.fromFlux ?? 0;
        safety += 1;
        setPhotoProgress({
          done: Math.min(total, fromLibrary + fromFlux),
          total,
          stage: 'flux',
        });
      } while (fluxUpdated > 0 && safety < 6);

      const stillMissing = Math.max(0, total - fromLibrary - fromFlux - skipped);
      const photoResult = {
        updated,
        failed: failed || stillMissing,
        skipped,
        fromLibrary,
        fromFlux,
        total,
      };
      setPhotoSummary(photoResult);
      setSuccess(
        t('aiFill.suggestPhotosSuccess', {
          updated: fromLibrary + fromFlux,
          failed: photoResult.failed,
        }),
      );
    } catch (err) {
      setError(getApiError(err, t, 'aiFill.suggestPhotosError'));
    } finally {
      setSuggestingPhotos(false);
      setPhotoProgress(null);
    }
  }

  const steps = [
    { id: 1, label: t('aiFill.stepUpload'), icon: 'photo_camera' },
    { id: 2, label: t('aiFill.stepReview'), icon: 'fact_check' },
    { id: 3, label: t('aiFill.stepPhotos'), icon: 'image' },
    { id: 4, label: t('aiFill.stepPublish'), icon: 'check_circle' },
  ];

  function startNewImport() {
    setFile(null);
    resetUploadState();
    setPhotoSummary(null);
    setPhotoProgress(null);
    setPublishSummary(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className={`relative mx-auto max-w-5xl space-y-4 ${result && !isPublished ? 'pb-56' : 'pb-10'}`}>
      {/* Compact header + stepper */}
      <header className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest">
        <div className="relative px-4 py-5 sm:px-6 sm:py-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in srgb, var(--color-primary, #0d1b2a) 14%, transparent), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, color-mix(in srgb, var(--color-primary, #0d1b2a) 8%, transparent), transparent 50%)',
            }}
            aria-hidden
          />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-xl">
              <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface sm:text-[1.85rem]">
                {t('aiFill.title')}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
                {t('aiFill.subtitleShort')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!configured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-2.5 py-1 text-[11px] font-semibold text-error">
                  <span className="h-1.5 w-1.5 rounded-full bg-error" />
                  {t('aiFill.statusOffline')}
                </span>
              ) : null}
              {result ? (
                <button
                  type="button"
                  onClick={startNewImport}
                  className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container"
                >
                  <MaterialIcon name="add_a_photo" className="text-[16px]" />
                  {t('aiFill.startOver')}
                </button>
              ) : null}
            </div>
          </div>

          <nav aria-label={t('aiFill.stepsNav')} className="relative mt-5">
            <ol className="grid grid-cols-4 gap-2">
              {steps.map((item) => {
                const state = stepStates[item.id];
                const active = state === 'active';
                const done = state === 'done';
                return (
                  <li
                    key={item.id}
                    className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-all duration-300 ${
                      active ? 'bg-primary/8' : ''
                    } ${state === 'todo' ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                        active
                          ? 'scale-105 bg-primary text-on-primary shadow-[0_6px_16px_rgba(13,27,42,0.22)]'
                          : done
                            ? 'bg-primary/15 text-primary'
                            : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <MaterialIcon
                        name={done && !active ? 'check' : item.icon}
                        className="text-[18px]"
                      />
                    </span>
                    <span
                      className={`text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                        active ? 'text-on-surface' : 'text-on-surface-variant'
                      }`}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </header>

      {(error || success) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            error
              ? 'border-error/20 bg-error-container text-error'
              : 'border-primary/20 bg-primary/10 text-primary'
          }`}
        >
          <MaterialIcon name={error ? 'error' : 'check_circle'} className="mt-0.5 shrink-0 text-[20px]" />
          <p className="min-w-0 flex-1 leading-relaxed">{error || success}</p>
          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
            }}
            className="shrink-0 rounded-full p-1 opacity-70 hover:opacity-100"
            aria-label={t('common.close')}
          >
            <MaterialIcon name="close" className="text-[18px]" />
          </button>
        </div>
      )}

      {/* Stage 1 — Upload (full when no result, compact when reviewing) */}
      {!result ? (
        <section className="animate-[fadeIn_0.35s_ease] rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">{t('aiFill.uploadTitle')}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{t('aiFill.uploadHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              <MaterialIcon name="tune" className="text-[15px]" />
              {t('aiFill.advanced')}
            </button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex min-h-[15rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-all duration-200 ${
              dragOver
                ? 'scale-[1.01] border-primary bg-primary/8'
                : previewUrl
                  ? 'border-outline-variant bg-surface-container/25'
                  : 'border-outline-variant bg-surface-container/30 hover:border-primary/45 hover:bg-primary/[0.04]'
            }`}
          >
            {previewUrl ? (
              <div className="flex w-full max-w-md flex-col items-center gap-3">
                <img
                  src={previewUrl}
                  alt=""
                  className="max-h-56 w-auto rounded-xl object-contain shadow-[0_12px_28px_rgba(13,27,42,0.12)]"
                />
                <div>
                  <p className="truncate text-sm font-semibold text-on-surface">{file?.name}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">{t('aiFill.changeImage')}</p>
                </div>
              </div>
            ) : (
              <>
                <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <MaterialIcon name="add_a_photo" className="text-[32px]" />
                </span>
                <p className="text-base font-semibold text-on-surface">{t('aiFill.dropTitle')}</p>
                <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">{t('aiFill.dropHint')}</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onPickFile}
            />
          </div>

          {showAdvanced ? (
            <label className="mt-4 block max-w-xs text-sm">
              <span className="mb-1.5 block font-medium text-on-surface">{t('aiFill.mergeLevel')}</span>
              <select
                value={mergeLevel}
                onChange={(event) => setMergeLevel(event.target.value)}
                className="h-11 w-full rounded-xl border border-outline-variant bg-background px-3 text-on-surface outline-none focus:border-primary"
              >
                {MERGE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`aiFill.merge.${level}`)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-on-surface-variant">{t('aiFill.privacyNote')}</p>
            <button
              type="button"
              disabled={running || !configured || !file}
              onClick={handleRun}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-on-primary shadow-[0_10px_24px_rgba(13,27,42,0.18)] transition hover:brightness-105 disabled:opacity-45"
            >
              <MaterialIcon
                name={running ? 'progress_activity' : 'auto_awesome'}
                className={running ? 'animate-spin text-[20px]' : 'text-[20px]'}
              />
              {running ? t('aiFill.running') : t('aiFill.run')}
            </button>
          </div>

          {running ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-primary">
                <MaterialIcon name="progress_activity" className="animate-spin text-[20px]" />
                <div className="min-w-0">
                  <p className="font-semibold">{t('aiFill.runningTitle')}</p>
                  <p className="text-primary/75">{t('aiFill.runningHint')}</p>
                </div>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-primary/15">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/60" />
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container/40 px-3 py-2.5 sm:px-4">
          {(previewUrl || result.sourceImageUrl) && (
            <div className="h-12 w-12 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <CloudinaryImage
                  src={result.sourceImageUrl}
                  alt=""
                  preset="productCard"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-on-surface">{t('aiFill.sourcePhoto')}</p>
            <p className="truncate text-xs text-on-surface-variant">
              {file?.name || t('aiFill.sourcePhotoHint')}
            </p>
          </div>
          {!isPublished ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              {t('aiFill.changeImageShort')}
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onPickFile}
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
      {/* Stage 3 — Photos (before publish, visually after review) */}
      {result ? (
        <section
          ref={photosRef}
          className="order-2 animate-[fadeIn_0.4s_ease] overflow-hidden rounded-2xl border border-primary/20 bg-surface-container-lowest"
        >
          <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
                  {t('aiFill.stepLabel', { n: 3 })}
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-on-surface">
                  {t('aiFill.photosTitle')}
                </h2>
                <p className="mt-1.5 text-sm text-on-surface-variant">{t('aiFill.photosHint')}</p>
              </div>
              {publishSummary ? (
                <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest/80 px-3 py-2 text-xs text-on-surface-variant">
                  <p className="font-semibold text-on-surface">{t('aiFill.publishSummaryTitle')}</p>
                  <p className="mt-0.5">
                    {t('aiFill.publishSummaryBody', {
                      categories: publishSummary.categoriesCreated,
                      products: publishSummary.productsCreated,
                    })}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest/90 px-4 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MaterialIcon
                    name={
                      suggestingPhotos
                        ? 'progress_activity'
                        : photoSummary
                          ? 'verified'
                          : 'auto_awesome'
                    }
                    className={suggestingPhotos ? 'animate-spin text-[24px]' : 'text-[24px]'}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface">
                    {photoSummary
                      ? t('aiFill.photosDoneTitle')
                      : suggestingPhotos
                        ? photoProgress?.stage === 'flux'
                          ? t('aiFill.photosStageFlux')
                          : t('aiFill.photosStageLibrary')
                        : t('aiFill.photosReadyTitle')}
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {photoSummary
                      ? t('aiFill.suggestPhotosSuccess', {
                          updated: photoSummary.updated,
                          failed: photoSummary.failed,
                        })
                      : photoProgress
                        ? t('aiFill.photosProgress', {
                            done: photoProgress.done,
                            total: photoProgress.total,
                          })
                        : t('aiFill.photosReadyHint', {
                            count: selectedCounts.products || '—',
                          })}
                  </p>
                </div>
              </div>

              {photoProgress ? (
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((photoProgress.done / Math.max(photoProgress.total, 1)) * 100),
                      )}%`,
                    }}
                  />
                </div>
              ) : null}

              {photoSummary ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-primary/8 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-primary">{photoSummary.fromLibrary ?? 0}</p>
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase">
                      {t('aiFill.statLibrary')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/8 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-primary">{photoSummary.fromFlux ?? 0}</p>
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase">
                      {t('aiFill.statFlux')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-on-surface">{photoSummary.failed}</p>
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase">
                      {t('aiFill.statMissing')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-on-surface">{photoSummary.skipped || 0}</p>
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase">
                      {t('aiFill.statSkipped')}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {!isPublished ? (
                  <>
                    <button
                      type="button"
                      disabled={suggestingPhotos || !selectedCounts.products}
                      onClick={() => handleSuggestPhotos({ overwrite: Boolean(photoSummary) })}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50"
                    >
                      <MaterialIcon
                        name={suggestingPhotos ? 'progress_activity' : 'auto_awesome'}
                        className={suggestingPhotos ? 'animate-spin text-[18px]' : 'text-[18px]'}
                      />
                      {suggestingPhotos
                        ? t('aiFill.suggestingPhotos')
                        : photoSummary
                          ? t('aiFill.generatePhotosAgain')
                          : t('aiFill.generatePhotos')}
                    </button>
                    {photoSummary ? (
                      <button
                        type="button"
                        disabled={busy || !selectedCounts.products}
                        onClick={handlePublish}
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-outline-variant px-5 text-sm font-semibold text-on-surface disabled:opacity-50"
                      >
                        <MaterialIcon name="check_circle" className="text-[18px]" />
                        {t('aiFill.confirmPublishAfterPhotos')}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <Link
                    to="/app/products?review=1"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary"
                  >
                    <MaterialIcon name="edit_note" className="text-[18px]" />
                    {t('aiFill.goReviewAll')}
                  </Link>
                )}
              </div>
              {photoSummary && !isPublished ? (
                <p className="mt-3 text-xs text-on-surface-variant">{t('aiFill.photosPublishHint')}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Stage 2 — Review */}
      {result ? (
        <section
          ref={reviewRef}
          className="order-1 animate-[fadeIn_0.35s_ease] rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">
                {isPublished ? t('aiFill.reviewTitlePublished') : t('aiFill.reviewTitle')}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isPublished ? t('aiFill.reviewHintPublished') : t('aiFill.reviewHint')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-surface-container p-1">
              {[
                { id: 'review', label: t('aiFill.tabReview'), icon: 'fact_check' },
                { id: 'text', label: t('aiFill.tabText'), icon: 'notes' },
                { id: 'blocks', label: t('aiFill.tabBlocks'), icon: 'view_agenda' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tab === item.id
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <MaterialIcon name={item.icon} className="text-[15px]" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-surface-container/60 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-on-surface">
                {selectedCounts.products}/{selectedCounts.totalProducts} {t('aiFill.selectedProducts')}
              </p>
              <p className="text-xs text-on-surface-variant">
                {selectedCounts.categories} {t('aiFill.categoriesSelected')}
                {selectedCounts.review ? ` · ${selectedCounts.review} ${t('aiFill.toReview')}` : ''}
              </p>
            </div>
            {!isPublished && tab === 'review' ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setAllSelected(true)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  {t('aiFill.selectAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setAllSelected(false)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high"
                >
                  {t('aiFill.deselectAll')}
                </button>
              </div>
            ) : null}
          </div>

          {String(draft.meta?.parser || '').includes('llm-fallback') || draft.meta?.llmError ? (
            <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              {t('aiFill.llmFallbackWarning')}
              {draft.meta?.llmError ? ` (${draft.meta.llmError})` : ''}
            </p>
          ) : null}

          {tab === 'review' ? (
            <div className="space-y-3">
              {draft.categories?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: t('aiFill.sectionAll'), count: sectionCounts.all },
                    ...sectionOptions.map((section) => ({
                      id: section.key,
                      label: section.name,
                      count: sectionCounts[section.key] || 0,
                    })),
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSectionFilter(item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        sectionFilter === item.id
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {item.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          sectionFilter === item.id ? 'bg-white/20' : 'bg-surface-container-lowest'
                        }`}
                      >
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {!draft.categories?.length ? (
                <p className="rounded-xl bg-surface-container/40 px-4 py-8 text-center text-sm text-on-surface-variant">
                  {t('aiFill.noDraft')}
                </p>
              ) : !visibleCategories.length ? (
                <p className="rounded-xl bg-surface-container/40 px-4 py-8 text-center text-sm text-on-surface-variant">
                  {t('aiFill.noSectionMatch')}
                </p>
              ) : (
                visibleCategories.map((cat) => {
                  const isCollapsed = Boolean(collapsed[cat.id]);
                  const productCount = cat.products?.length || 0;
                  const selectedInCat = (cat.products || []).filter((p) => p.selected).length;
                  const sectionKey = isMenuSectionKey(cat.sectionKey)
                    ? cat.sectionKey
                    : defaultSectionKey;
                  return (
                    <div
                      key={cat.id}
                      className={`overflow-hidden rounded-xl border transition-opacity ${
                        cat.selected
                          ? 'border-outline-variant/80 bg-background'
                          : 'border-dashed border-outline-variant opacity-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 bg-surface-container/50 px-3 py-2 sm:px-3.5">
                        <input
                          type="checkbox"
                          checked={Boolean(cat.selected)}
                          disabled={isPublished}
                          onChange={(event) =>
                            updateCategory(cat.id, { selected: event.target.checked })
                          }
                          className="h-4 w-4 accent-[var(--color-primary,#0d1b2a)]"
                        />
                        <button
                          type="button"
                          onClick={() => toggleCollapsed(cat.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
                          aria-label={t('aiFill.toggleCategory')}
                        >
                          <MaterialIcon name={isCollapsed ? 'expand_more' : 'expand_less'} />
                        </button>
                        <input
                          value={cat.name}
                          disabled={isPublished}
                          onChange={(event) => updateCategory(cat.id, { name: event.target.value })}
                          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-on-surface outline-none focus:border-outline-variant focus:bg-surface-container-lowest disabled:opacity-70"
                        />
                        <select
                          value={sectionKey}
                          disabled={isPublished}
                          onChange={(event) =>
                            updateCategory(cat.id, { sectionKey: event.target.value })
                          }
                          aria-label={t('aiFill.sectionLabel')}
                          className="h-8 max-w-[9.5rem] rounded-full border border-outline-variant bg-surface-container-lowest px-2.5 text-[11px] font-semibold text-on-surface outline-none focus:border-primary disabled:opacity-70"
                        >
                          {sectionOptions.map((section) => (
                            <option key={section.key} value={section.key}>
                              {section.name}
                            </option>
                          ))}
                        </select>
                        <span className="rounded-full bg-surface-container-lowest px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
                          {selectedInCat}/{productCount}
                        </span>
                      </div>

                      {!isCollapsed ? (
                        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
                          {(cat.products || []).map((prod) => {
                            const uploading = uploadingImageId === prod.id;
                            return (
                              <article
                                key={prod.id}
                                className={`flex flex-col overflow-hidden rounded-2xl border bg-surface-container-lowest shadow-sm ${
                                  prod.selected
                                    ? 'border-outline-variant/80'
                                    : 'border-dashed border-outline-variant opacity-55'
                                } ${prod.needsReview ? 'ring-1 ring-amber-400/40' : ''}`}
                              >
                                <div className="relative aspect-[4/3] bg-surface-container">
                                  {prod.image ? (
                                    <CloudinaryImage
                                      src={prod.image}
                                      alt=""
                                      preset="productCard"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-on-surface-variant/50">
                                      <MaterialIcon name="image" className="text-[32px]" />
                                      <span className="text-[11px] font-medium">{t('aiFill.changePhoto')}</span>
                                    </div>
                                  )}
                                  {uploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-surface/70 text-sm font-semibold text-on-surface">
                                      <MaterialIcon name="progress_activity" className="me-2 animate-spin" />
                                      {t('aiFill.photoUploading')}
                                    </div>
                                  ) : null}
                                  {!isPublished ? (
                                    <div className="absolute inset-x-2 bottom-2 flex flex-wrap gap-1">
                                      <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => openProductImageUpload(cat.id, prod.id)}
                                        className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
                                      >
                                        <MaterialIcon name="upload" className="text-[14px]" />
                                        {t('aiFill.uploadPhoto')}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() =>
                                          setPickerProduct({
                                            ...prod,
                                            catId: cat.id,
                                            sectionKey,
                                          })
                                        }
                                        className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
                                      >
                                        <MaterialIcon name="photo_library" className="text-[14px]" />
                                        {t('aiFill.chooseLibrary')}
                                      </button>
                                      {prod.image ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateProduct(cat.id, prod.id, {
                                              image: '',
                                              imageSource: '',
                                            })
                                          }
                                          className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
                                          aria-label={t('aiFill.removePhoto')}
                                        >
                                          <MaterialIcon name="hide_image" className="text-[14px]" />
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  <label className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-on-surface shadow-sm">
                                    <input
                                      type="checkbox"
                                      className="h-3.5 w-3.5 accent-[var(--color-primary,#0d1b2a)]"
                                      checked={Boolean(prod.selected)}
                                      disabled={isPublished || !cat.selected}
                                      onChange={(event) =>
                                        updateProduct(cat.id, prod.id, {
                                          selected: event.target.checked,
                                        })
                                      }
                                    />
                                  </label>
                                </div>

                                <div className="flex flex-1 flex-col gap-2 p-3">
                                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5.75rem]">
                                    <input
                                      value={prod.name}
                                      disabled={isPublished}
                                      onChange={(event) =>
                                        updateProduct(cat.id, prod.id, {
                                          name: event.target.value,
                                        })
                                      }
                                      placeholder={t('aiFill.productName')}
                                      className="h-10 rounded-xl border border-outline-variant/80 bg-background px-3 text-sm font-semibold text-on-surface outline-none focus:border-primary disabled:opacity-70"
                                    />
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={prod.price}
                                        disabled={isPublished}
                                        onChange={(event) =>
                                          updateProduct(cat.id, prod.id, {
                                            price: event.target.value,
                                          })
                                        }
                                        className="h-10 w-full rounded-xl border border-outline-variant/80 bg-background pe-9 ps-2.5 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-70"
                                      />
                                      <span className="pointer-events-none absolute inset-e-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-on-surface-variant">
                                        {t('aiFill.currency')}
                                      </span>
                                    </div>
                                  </div>
                                  <textarea
                                    value={prod.description || ''}
                                    disabled={isPublished}
                                    onChange={(event) =>
                                      updateProduct(cat.id, prod.id, {
                                        description: event.target.value,
                                      })
                                    }
                                    rows={3}
                                    maxLength={500}
                                    placeholder={t('aiFill.productDescription')}
                                    className="min-h-[4.5rem] w-full flex-1 resize-y rounded-xl border border-outline-variant/80 bg-background px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-primary disabled:opacity-70"
                                  />
                                  <div className="flex items-center justify-between gap-2">
                                    {prod.needsReview ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                        <MaterialIcon name="warning" className="text-[12px]" />
                                        {t('aiFill.needsReview')}
                                      </span>
                                    ) : (
                                      <span />
                                    )}
                                    {!isPublished ? (
                                      <button
                                        type="button"
                                        onClick={() => removeProduct(cat.id, prod.id)}
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-on-surface-variant hover:bg-error-container hover:text-error"
                                      >
                                        <MaterialIcon name="delete" className="text-[15px]" />
                                        {t('aiFill.removeProduct')}
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          ) : null}

          {tab === 'text' ? (
            <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl bg-surface-container/50 p-4 text-sm leading-relaxed text-on-surface">
              {result.rawText || t('aiFill.noText')}
            </pre>
          ) : null}

          {tab === 'blocks' ? (
            <ul className="max-h-[28rem] space-y-2 overflow-auto">
              {(result.rawBlocks || []).map((block, index) => (
                <li
                  key={`${index}-${String(block?.text || '').slice(0, 12)}`}
                  className="rounded-xl border border-outline-variant/70 bg-surface-container/30 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-on-surface">{block?.text || '—'}</p>
                    {typeof block?.confidence === 'number' ? (
                      <span className="shrink-0 text-xs font-medium text-on-surface-variant">
                        {Math.round(block.confidence * 100)}%
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
              {!result.rawBlocks?.length ? (
                <li className="text-sm text-on-surface-variant">{t('aiFill.noBlocks')}</li>
              ) : null}
            </ul>
          ) : null}
        </section>
      ) : null}
      </div>

      {/* History — collapsed by default after first use */}
      <section className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest">
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start sm:px-5"
        >
          <div>
            <h2 className="font-display text-base font-semibold text-on-surface">
              {t('aiFill.historyTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {historyLoading
                ? t('common.loading')
                : t('aiFill.historyCount', { count: history.length })}
            </p>
          </div>
          <MaterialIcon
            name={historyOpen ? 'expand_less' : 'expand_more'}
            className="text-on-surface-variant"
          />
        </button>

        {historyOpen ? (
          <div className="border-t border-outline-variant/50 px-4 pb-4 sm:px-5">
            {history.length === 0 ? (
              <p className="py-6 text-center text-sm text-on-surface-variant">{t('aiFill.historyEmpty')}</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {history.map((item) => {
                  const meta = statusMeta(item.status, t);
                  const active = result?._id === item._id;
                  return (
                    <li key={item._id}>
                      <button
                        type="button"
                        onClick={() => applyImport(item)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors ${
                          active
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-outline-variant/70 bg-surface-container/20 hover:bg-surface-container/60'
                        }`}
                      >
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass(meta.tone)}`}
                        >
                          <MaterialIcon name={meta.icon} className="text-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-on-surface">
                            {item.draftMenu?.meta?.productCount
                              ? t('aiFill.historyProducts', {
                                  count: item.draftMenu.meta.productCount,
                                })
                              : item.rawText?.slice(0, 48) ||
                                item.errorMessage ||
                                t('aiFill.untitledImport')}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-on-surface-variant">
                            <span>{formatDate(item.createdAt, locale)}</span>
                            <span className={`rounded-full px-1.5 py-0.5 font-semibold ${toneClass(meta.tone)}`}>
                              {meta.label}
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      {/* Sticky publish bar */}
      {result && !isPublished && tab === 'review' ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-2.5 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest/95 p-3 shadow-[0_-12px_40px_rgba(13,27,42,0.14)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3 px-1">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                {selectedCounts.products}
              </span>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {photoSummary ? t('aiFill.readyToPublish') : t('aiFill.readyForPhotos')}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {selectedCounts.withPhoto}/{selectedCounts.products} {t('aiFill.stepPhotos')}
                  {selectedCounts.review
                    ? ` · ${selectedCounts.review} ${t('aiFill.toReview')}`
                    : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleSaveDraft}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-outline-variant px-4 text-sm font-semibold text-on-surface disabled:opacity-60 sm:flex-none"
              >
                <MaterialIcon name="save" className="text-[18px]" />
                {saving ? t('aiFill.saving') : t('aiFill.saveDraft')}
              </button>
              {!photoSummary ? (
                <button
                  type="button"
                  disabled={busy || !selectedCounts.products}
                  onClick={() => handleSuggestPhotos()}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary shadow-[0_8px_20px_rgba(13,27,42,0.2)] disabled:opacity-60 sm:flex-none"
                >
                  <MaterialIcon
                    name={suggestingPhotos ? 'progress_activity' : 'auto_awesome'}
                    className={suggestingPhotos ? 'animate-spin text-[18px]' : 'text-[18px]'}
                  />
                  {suggestingPhotos ? t('aiFill.suggestingPhotos') : t('aiFill.generatePhotos')}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || !selectedCounts.products}
                  onClick={handlePublish}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary shadow-[0_8px_20px_rgba(13,27,42,0.2)] disabled:opacity-60 sm:flex-none"
                >
                  <MaterialIcon
                    name={publishing ? 'progress_activity' : 'check_circle'}
                    className={publishing ? 'animate-spin text-[18px]' : 'text-[18px]'}
                  />
                  {publishing ? t('aiFill.publishing') : t('aiFill.confirmPublishAfterPhotos')}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={productImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleProductImageFile}
      />

      <MediaImagePickerModal
        open={Boolean(pickerProduct)}
        product={pickerProduct}
        onClose={() => setPickerProduct(null)}
        onApplied={(_saved, item) => {
          if (!pickerProduct || !item?.image) return;
          updateProduct(pickerProduct.catId, pickerProduct.id, {
            image: item.image,
            imageSource: 'menu-media-pick',
          });
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
