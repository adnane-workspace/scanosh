import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AiFillDraftCard from '../components/dashboard/AiFillDraftCard.jsx';
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
import { repairDraftMenu } from '../utils/draftMenuRepair.js';

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

function WizardFooter({
  backLabel,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryBusy,
  primaryIcon = 'arrow_forward',
  extra,
}) {
  return (
    <div className="sticky bottom-3 z-30 mx-auto mt-6 max-w-5xl">
      <div className="flex items-center gap-2 rounded-2xl border border-black/8 bg-white/90 p-2 shadow-[0_12px_40px_rgba(13,27,42,0.12)] backdrop-blur-md">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-semibold text-[#5c6570] hover:bg-[#f4f5f6]"
          >
            {backLabel}
          </button>
        ) : (
          <span />
        )}
        <div className="min-w-0 flex-1">{extra}</div>
        <button
          type="button"
          disabled={primaryDisabled}
          onClick={onPrimary}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#0d1b2a] px-5 text-sm font-semibold text-white disabled:opacity-45"
        >
          <MaterialIcon
            name={primaryBusy ? 'progress_activity' : primaryIcon}
            className={primaryBusy ? 'animate-spin text-[18px]' : 'text-[18px]'}
          />
          {primaryLabel}
        </button>
      </div>
    </div>
  );
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
  const [textLlm, setTextLlm] = useState({ configured: false, model: '' });
  const [imageLlm, setImageLlm] = useState({ configured: false, model: '' });
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [menuSections, setMenuSections] = useState(
    DEFAULT_SECTION_DEFS.map((item) => ({ key: item.key, name: item.name })),
  );
  const [publishSummary, setPublishSummary] = useState(null);
  const [suggestingPhotos, setSuggestingPhotos] = useState(false);
  const [photoSummary, setPhotoSummary] = useState(null);
  const [photoProgress, setPhotoProgress] = useState(null);
  const photosRef = useRef(null);
  const photosAutoStartedRef = useRef('');
  const productImageInputRef = useRef(null);
  const [imageTarget, setImageTarget] = useState(null);
  const [pickerProduct, setPickerProduct] = useState(null);
  const [uploadingImageId, setUploadingImageId] = useState('');
  const [generatingImageId, setGeneratingImageId] = useState('');

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
          setTextLlm({
            configured: Boolean(status?.textLlm?.configured ?? status?.llmConfigured),
            model: status?.textLlm?.model || '',
          });
          setImageLlm({
            configured: Boolean(status?.imageLlm?.configured ?? status?.fluxConfigured),
            model: status?.imageLlm?.model || '',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfigured(false);
          setTextLlm({ configured: false, model: '' });
          setImageLlm({ configured: false, model: '' });
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
    if (wizardStep !== 3 || !result?._id || result.status === 'published') return;
    if (photosAutoStartedRef.current === result._id) return;
    photosAutoStartedRef.current = result._id;
    void handleSuggestPhotos({ overwrite: false });
    // Auto-generate every missing product photo when entering the Photos step.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per import
  }, [wizardStep, result?._id]);

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
    const list = (draft.categories || []).filter((cat) => (cat.products || []).length > 0);
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
  const busy = running || saving || publishing || suggestingPhotos || Boolean(generatingImageId);

  const stepStates = useMemo(() => {
    const map = {
      1: wizardStep === 1 ? 'active' : 'done',
      2: !result ? 'todo' : wizardStep === 2 ? 'active' : wizardStep > 2 || isPublished ? 'done' : 'todo',
      3: !result ? 'todo' : wizardStep === 3 ? 'active' : wizardStep > 3 || isPublished ? 'done' : 'todo',
      4: !result ? 'todo' : wizardStep === 4 ? 'active' : isPublished ? 'done' : 'todo',
    };
    if (isPublished) {
      map[1] = 'done';
      map[2] = 'done';
      map[3] = 'done';
      map[4] = wizardStep === 4 ? 'active' : 'done';
    }
    return map;
  }, [result, isPublished, wizardStep]);

  function goToStep(id) {
    if (id === 1) {
      setWizardStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!result || id < 1 || id > 4) return;
    if (id === 2) photosAutoStartedRef.current = '';
    setWizardStep(id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function applyImport(item, { resetPhotos = true, step } = {}) {
    setResult(item);
    setDraft(repairDraftMenu(cloneDraft(item.draftMenu || emptyDraft())));
    setSectionFilter('all');
    setPublishSummary(null);
    if (resetPhotos) {
      setPhotoSummary(null);
      setPhotoProgress(null);
    }
    setSuccess('');
    setError('');
    if (item?.status === 'published') setWizardStep(4);
    else if (step) setWizardStep(step);
    else setWizardStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetUploadState() {
    setError('');
    setSuccess('');
    setResult(null);
    setDraft(emptyDraft());
    setPublishSummary(null);
    setWizardStep(1);
    setOcrOpen(false);
    photosAutoStartedRef.current = '';
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
      categories: (prev.categories || []).map((cat) => {
        if (cat.id !== catId) return cat;
        const next = { ...cat, ...patch };
        if (next.sectionKey === 'cafe') {
          next.products = (next.products || []).map((prod) => ({ ...prod, description: '' }));
        }
        return next;
      }),
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

  async function continueFromReview() {
    if (!selectedCounts.products) {
      setError(t('aiFill.selectProduct'));
      return;
    }
    setError('');
    if (result?._id && !isPublished) {
      setSaving(true);
      try {
        const item = await updateMenuImportDraft(result._id, draft);
        applyImport(item, { resetPhotos: false, step: 3 });
      } catch (err) {
        setError(getApiError(err, t, 'aiFill.saveError'));
      } finally {
        setSaving(false);
      }
      return;
    }
    goToStep(3);
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
      setWizardStep(4);
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
    setWizardStep(3);
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
      const missingIds = [];
      for (const cat of latestDraft.categories || []) {
        if (!cat.selected) continue;
        for (const prod of cat.products || []) {
          if (!prod.selected) continue;
          if (prod.image && !overwrite) continue;
          if (prod.id) missingIds.push(prod.id);
        }
      }

      const library = await suggestMenuImportImages(result._id, {
        draftMenu: latestDraft,
        stage: 'library',
        overwrite,
        productIds: missingIds,
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
        const fluxIds = [];
        for (const cat of latestDraft.categories || []) {
          if (!cat.selected) continue;
          for (const prod of cat.products || []) {
            if (prod.selected && !prod.image && prod.id) fluxIds.push(prod.id);
          }
        }
        if (!fluxIds.length) break;
        const flux = await suggestMenuImportImages(result._id, {
          draftMenu: latestDraft,
          stage: 'flux',
          overwrite: false,
          productIds: fluxIds,
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
      } while (fluxUpdated > 0 && safety < 12);

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

  async function handleGenerateOne(prodId, { overwrite = false } = {}) {
    if (!result?._id || isPublished || !prodId) return;
    setGeneratingImageId(prodId);
    setError('');
    try {
      const data = await suggestMenuImportImages(result._id, {
        draftMenu: draft,
        stage: overwrite ? 'flux' : 'auto',
        overwrite,
        productIds: [prodId],
      });
      setResult(data.import);
      setDraft(repairDraftMenu(cloneDraft(data.import?.draftMenu || draft)));
      if (!(data.summary?.updated > 0)) {
        setError(t('aiFill.generateOneFailed'));
      }
    } catch (err) {
      setError(getApiError(err, t, 'aiFill.suggestPhotosError'));
    } finally {
      setGeneratingImageId('');
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

  const selectedProductsList = useMemo(() => {
    const rows = [];
    for (const cat of draft.categories || []) {
      if (!cat.selected) continue;
      for (const prod of cat.products || []) {
        if (!prod.selected) continue;
        rows.push({ cat, prod, sectionKey: isMenuSectionKey(cat.sectionKey) ? cat.sectionKey : defaultSectionKey });
      }
    }
    return rows;
  }, [draft, defaultSectionKey]);

  return (
    <div className="relative mx-auto max-w-5xl space-y-6 pb-24">
      <header className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
              {t('aiFill.kicker')}
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] font-bold tracking-tight text-on-surface sm:text-[2rem]">
              {t('aiFill.title')}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-on-surface-variant">
              {t('aiFill.subtitleShort')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!configured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1.5 text-xs font-semibold text-error">
                <span className="h-1.5 w-1.5 rounded-full bg-error" />
                {t('aiFill.statusOffline')}
              </span>
            ) : null}
            {result ? (
              <button
                type="button"
                onClick={startNewImport}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3.5 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container"
              >
                <MaterialIcon name="add_a_photo" className="text-[16px]" />
                {t('aiFill.startOver')}
              </button>
            ) : null}
          </div>
        </div>

        <nav
          aria-label={t('aiFill.stepsNav')}
          className="rounded-2xl border border-black/6 bg-white px-2 py-3 shadow-[0_8px_28px_rgba(13,27,42,0.05)] sm:px-4"
        >
          <ol className="grid grid-cols-4">
            {steps.map((item, index) => {
              const state = stepStates[item.id];
              const active = state === 'active';
              const done = state === 'done';
              const locked = state === 'todo';
              return (
                <li key={item.id} className="relative flex flex-col items-center">
                  {index > 0 ? (
                    <span
                      aria-hidden
                      className={`absolute top-4 end-1/2 h-px w-full ${
                        done || active ? 'bg-[#0d1b2a]' : 'bg-black/10'
                      }`}
                    />
                  ) : null}
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => goToStep(item.id)}
                    title={locked ? t('aiFill.stepLocked') : item.label}
                    className={`relative z-[1] flex flex-col items-center gap-1.5 rounded-xl px-1 py-1 transition ${
                      locked ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90'
                    }`}
                  >
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        active
                          ? 'bg-[#0d1b2a] text-white shadow-[0_6px_16px_rgba(13,27,42,0.22)]'
                          : done
                            ? 'bg-[#0d1b2a] text-white'
                            : 'bg-[#f4f5f6] text-[#5c6570]'
                      }`}
                    >
                      {done && !active ? (
                        <MaterialIcon name="check" className="text-[16px]" />
                      ) : (
                        <span>{item.id}</span>
                      )}
                    </span>
                    <span
                      className={`hidden text-center text-[11px] font-semibold sm:block ${
                        active ? 'text-on-surface' : 'text-on-surface-variant'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
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

      {/* Stage 1 - Upload */}
      {wizardStep === 1 && !result ? (
        <section className="animate-[fadeIn_0.35s_ease] space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: 'photo_camera', title: t('aiFill.how1Title'), hint: t('aiFill.how1Hint') },
              { icon: 'edit_note', title: t('aiFill.how2Title'), hint: t('aiFill.how2Hint') },
              { icon: 'restaurant_menu', title: t('aiFill.how3Title'), hint: t('aiFill.how3Hint') },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-black/6 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(13,27,42,0.04)]"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d1b2a] text-white">
                  <MaterialIcon name={item.icon} className="text-[20px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-black/6 bg-white p-4 shadow-[0_8px_28px_rgba(13,27,42,0.05)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-on-surface">{t('aiFill.uploadTitle')}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{t('aiFill.uploadHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-on-surface-variant hover:bg-[#f4f5f6]"
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
              className={`relative flex min-h-[18rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-all duration-200 ${
                dragOver
                  ? 'scale-[1.01] border-[#0d1b2a] bg-[#0d1b2a]/6'
                  : previewUrl
                    ? 'border-black/10 bg-[#f7f8f9]'
                    : 'border-black/12 bg-[#f7f8f9] hover:border-[#0d1b2a]/40 hover:bg-[#0d1b2a]/[0.03]'
              }`}
            >
              {previewUrl ? (
                <div className="flex w-full max-w-md flex-col items-center gap-3">
                  <img
                    src={previewUrl}
                    alt=""
                    className="max-h-64 w-auto rounded-xl object-contain shadow-[0_16px_36px_rgba(13,27,42,0.16)]"
                  />
                  <div>
                    <p className="truncate text-sm font-semibold text-on-surface">{file?.name}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{t('aiFill.changeImage')}</p>
                  </div>
                </div>
              ) : (
                <>
                  <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0d1b2a] text-white shadow-sm">
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

            {running ? (
              <div className="mt-4 overflow-hidden rounded-2xl bg-[#0d1b2a] px-4 py-4 text-white">
                <div className="flex items-center gap-3 text-sm">
                  <MaterialIcon name="progress_activity" className="animate-spin text-[22px]" />
                  <div className="min-w-0">
                    <p className="font-semibold">{t('aiFill.processingTitle')}</p>
                    <p className="text-white/70">{t('aiFill.runningHint')}</p>
                  </div>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-white/80" />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-on-surface-variant">{t('aiFill.privacyNote')}</p>
            )}
          </div>

          <WizardFooter
            primaryLabel={running ? t('aiFill.running') : t('aiFill.run')}
            onPrimary={handleRun}
            primaryDisabled={running || !configured || !file}
            primaryBusy={running}
            primaryIcon="auto_awesome"
          />
        </section>
      ) : wizardStep === 1 && result ? (
        <section className="animate-[fadeIn_0.35s_ease] space-y-5">
          <div className="overflow-hidden rounded-3xl border border-black/6 bg-white shadow-[0_8px_28px_rgba(13,27,42,0.05)]">
            <div className="grid gap-0 sm:grid-cols-[minmax(0,14rem)_1fr]">
              {(previewUrl || result.sourceImageUrl) && (
                <div className="aspect-[4/3] bg-[#f4f5f6] sm:aspect-auto sm:min-h-[12rem]">
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
              <div className="flex flex-col justify-center px-5 py-5">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-on-surface-variant uppercase">
                  {t('aiFill.sourcePhoto')}
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-on-surface">
                  {file?.name || t('aiFill.sourcePhotoHint')}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {selectedCounts.products} {t('aiFill.productsShort')} · {selectedCounts.categories}{' '}
                  {t('aiFill.categoriesSelected')}
                </p>
              </div>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onPickFile}
          />
          <WizardFooter
            backLabel={t('aiFill.startOver')}
            onBack={startNewImport}
            primaryLabel={t('aiFill.continue')}
            onPrimary={() => goToStep(isPublished ? 4 : 2)}
            primaryIcon="arrow_forward"
          />
        </section>
      ) : null}

      <div className="flex flex-col gap-4">
      {/* Stage 3 - Photos */}
      {wizardStep === 3 && result ? (
        <section
          ref={photosRef}
          className="animate-[fadeIn_0.4s_ease] overflow-hidden rounded-3xl border border-black/6 bg-white shadow-[0_8px_28px_rgba(13,27,42,0.05)]"
        >
          <div className="px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <h2 className="font-display text-xl font-semibold text-on-surface">{t('aiFill.photosTitle')}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{t('aiFill.photosOptionalHint')}</p>
              </div>
              {!isPublished ? (
                <button
                  type="button"
                  disabled={suggestingPhotos || !selectedCounts.products}
                  onClick={() => handleSuggestPhotos({ overwrite: Boolean(photoSummary) })}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f4f5f6] px-4 text-sm font-semibold text-[#0d1b2a] disabled:opacity-50"
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
              ) : (
                <Link
                  to="/app/products?review=1"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0d1b2a] px-4 text-sm font-semibold text-white"
                >
                  {t('aiFill.goReviewAll')}
                </Link>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-on-surface">
                  {t('aiFill.photoCoverage', {
                    done: selectedCounts.withPhoto,
                    total: selectedCounts.products || 0,
                  })}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {photoSummary
                    ? t('aiFill.suggestPhotosSuccess', {
                        updated: photoSummary.updated,
                        failed: photoSummary.failed,
                      })
                    : suggestingPhotos
                      ? photoProgress?.stage === 'flux'
                        ? t('aiFill.photosStageFlux')
                        : t('aiFill.photosStageLibrary')
                      : t('aiFill.photosReadyHint', { count: selectedCounts.products || '0' })}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f4f5f6]">
                <div
                  className="h-full rounded-full bg-[#0d1b2a] transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((photoProgress
                          ? photoProgress.done / Math.max(photoProgress.total, 1)
                          : selectedCounts.products
                            ? selectedCounts.withPhoto / selectedCounts.products
                            : 0) *
                          100),
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Stage 2 - Review */}
      {(wizardStep === 2 || wizardStep === 3) && result ? (
        <section
          ref={reviewRef}
          className="animate-[fadeIn_0.35s_ease] space-y-8"
        >
          {wizardStep === 2 ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">
                {isPublished ? t('aiFill.reviewTitlePublished') : t('aiFill.reviewTitle')}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isPublished ? t('aiFill.reviewHintPublished') : t('aiFill.reviewHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOcrOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high"
            >
              <MaterialIcon name="notes" className="text-[15px]" />
              {t('aiFill.ocrDetails')}
            </button>
          </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-black/6 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(13,27,42,0.04)]">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-on-surface">
                {selectedCounts.products}/{selectedCounts.totalProducts} {t('aiFill.selectedProducts')}
              </p>
              <p className="text-xs text-on-surface-variant">
                {selectedCounts.categories} {t('aiFill.categoriesSelected')}
                {selectedCounts.review ? ` · ${selectedCounts.review} ${t('aiFill.toReview')}` : ''}
              </p>
            </div>
            {!isPublished && wizardStep === 2 ? (
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
                  const productCount = cat.products?.length || 0;
                  const selectedInCat = (cat.products || []).filter((p) => p.selected).length;
                  const sectionKey = isMenuSectionKey(cat.sectionKey)
                    ? cat.sectionKey
                    : defaultSectionKey;
                  const sectionName =
                    sectionOptions.find((item) => item.key === sectionKey)?.name || sectionKey;
                  return (
                    <section key={cat.id} className="space-y-4">
                      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-on-surface-variant uppercase">
                            {sectionName}
                          </p>
                          <input
                            value={cat.name}
                            disabled={isPublished}
                            onChange={(event) => updateCategory(cat.id, { name: event.target.value })}
                            className="mt-1 w-full min-w-[12rem] bg-transparent font-display text-2xl font-semibold tracking-tight text-on-surface outline-none disabled:opacity-70"
                          />
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {selectedInCat}/{productCount} {t('aiFill.productsShort')}
                          </p>
                        </div>
                        {!isPublished ? (
                          <select
                            value={sectionKey}
                            onChange={(event) =>
                              updateCategory(cat.id, { sectionKey: event.target.value })
                            }
                            aria-label={t('aiFill.sectionLabel')}
                            className="h-9 rounded-full bg-surface-container px-3 text-xs font-semibold text-on-surface outline-none"
                          >
                            {sectionOptions.map((section) => (
                              <option key={section.key} value={section.key}>
                                {section.name}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {(cat.products || []).map((prod) => (
                          <AiFillDraftCard
                            key={prod.id}
                            product={prod}
                            sectionKey={sectionKey}
                            mode={wizardStep === 3 ? 'photos' : 'review'}
                            isPublished={isPublished}
                            busy={busy}
                            uploading={uploadingImageId === prod.id}
                            generating={generatingImageId === prod.id}
                            suggestingPhotos={suggestingPhotos}
                            t={t}
                            onChange={(patch) => updateProduct(cat.id, prod.id, patch)}
                            onGenerate={() => handleGenerateOne(prod.id, { overwrite: Boolean(prod.image) })}
                            onUpload={() => openProductImageUpload(cat.id, prod.id)}
                            onPickLibrary={() =>
                              setPickerProduct({
                                ...prod,
                                catId: cat.id,
                                sectionKey,
                              })
                            }
                            onRemoveImage={() =>
                              updateProduct(cat.id, prod.id, { image: '', imageSource: '' })
                            }
                            onRemove={() => removeProduct(cat.id, prod.id)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })
              )}
            </div>

          {wizardStep === 2 && ocrOpen ? (
            <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-container/50 p-4 text-sm leading-relaxed text-on-surface">
              {result.rawText || t('aiFill.noText')}
            </pre>
          ) : null}

          {wizardStep === 2 && !isPublished ? (
            <WizardFooter
              backLabel={t('aiFill.back')}
              onBack={() => goToStep(1)}
              primaryLabel={t('aiFill.nextPhotos')}
              onPrimary={continueFromReview}
              primaryDisabled={busy || !selectedCounts.products}
              extra={
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSaveDraft}
                  className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#5c6570] hover:bg-[#f4f5f6] disabled:opacity-60 sm:inline-flex"
                >
                  <MaterialIcon name="save" className="text-[18px]" />
                  {saving ? t('aiFill.saving') : t('aiFill.stickySave')}
                </button>
              }
            />
          ) : null}

          {wizardStep === 3 && !isPublished ? (
            <WizardFooter
              backLabel={t('aiFill.back')}
              onBack={() => goToStep(2)}
              primaryLabel={t('aiFill.continuePublish')}
              onPrimary={() => goToStep(4)}
              primaryDisabled={busy || !selectedCounts.products}
              extra={
                <p className="truncate text-xs font-semibold text-on-surface-variant">
                  {t('aiFill.photoCoverage', {
                    done: selectedCounts.withPhoto,
                    total: selectedCounts.products || 0,
                  })}
                </p>
              }
            />
          ) : null}
        </section>
      ) : null}

      {wizardStep === 4 && result ? (
        <section className="animate-[fadeIn_0.35s_ease] space-y-5">
          <div className="rounded-3xl border border-black/6 bg-white p-4 shadow-[0_8px_28px_rgba(13,27,42,0.05)] sm:p-6">
            <h2 className="font-display text-xl font-semibold text-on-surface">{t('aiFill.publishTitle')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t('aiFill.publishHint')}</p>

            {publishSummary ? (
              <div className="mt-5 rounded-2xl bg-[#0d1b2a] px-5 py-5 text-white">
                <p className="font-semibold">{t('aiFill.publishSummaryTitle')}</p>
                <p className="mt-1 text-white/75">
                  {t('aiFill.publishSummaryBody', {
                    categories: publishSummary.categoriesCreated,
                    products: publishSummary.productsCreated,
                  })}
                </p>
                <Link
                  to="/app/products?review=1"
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#0d1b2a]"
                >
                  {t('aiFill.goReviewAll')}
                </Link>
              </div>
            ) : !selectedProductsList.length ? (
              <p className="mt-4 rounded-xl bg-[#f4f5f6] px-4 py-6 text-center text-sm text-on-surface-variant">
                {t('aiFill.recapEmpty')}
              </p>
            ) : (
              <>
                <p className="mt-5 text-sm font-semibold text-on-surface">
                  {t('aiFill.recapCount', { count: selectedProductsList.length })}
                  {' · '}
                  {selectedCounts.withPhoto}/{selectedCounts.products} {t('aiFill.stepPhotos')}
                </p>
                <ul className="mt-3 divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/8">
                  {selectedProductsList.map(({ cat, prod }) => (
                    <li key={prod.id} className="flex items-center gap-3 bg-white px-3 py-2.5">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f4f5f6]">
                        {prod.image ? (
                          <CloudinaryImage
                            src={prod.image}
                            alt=""
                            preset="productCard"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-on-surface-variant/50">
                            <MaterialIcon name="image" className="text-[20px]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-on-surface">{prod.name}</p>
                        <p className="truncate text-xs text-on-surface-variant">
                          {cat.name}
                          {prod.price ? ` · ${prod.price} ${t('aiFill.currency')}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {!isPublished ? (
            <WizardFooter
              backLabel={t('aiFill.back')}
              onBack={() => goToStep(3)}
              primaryLabel={publishing ? t('aiFill.publishing') : t('aiFill.confirmPublishAfterPhotos')}
              onPrimary={handlePublish}
              primaryDisabled={busy || !selectedCounts.products}
              primaryBusy={publishing}
              primaryIcon="check_circle"
            />
          ) : null}
        </section>
      ) : null}
      </div>

      {/* History */}
      {wizardStep === 1 ? (
      <section className="overflow-hidden rounded-3xl border border-black/6 bg-white shadow-[0_8px_28px_rgba(13,27,42,0.05)]">
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
