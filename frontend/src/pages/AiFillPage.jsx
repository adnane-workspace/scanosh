import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import CloudinaryImage from '../components/ui/CloudinaryImage.jsx';
import { useLocale } from '../hooks/useLocale.js';
import { listCategoryOptions } from '../services/category.service.js';
import {
  createMenuImport,
  getMenuImportStatus,
  listMenuImports,
  publishMenuImport,
  updateMenuImportDraft,
} from '../services/menuImport.service.js';
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
  const [llmConfigured, setLlmConfigured] = useState(false);
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
  const [collapsed, setCollapsed] = useState({});

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
    for (const cat of draft.categories || []) {
      const all = cat.products || [];
      totalProducts += all.length;
      const selectedProducts = all.filter((p) => p.selected);
      if (cat.selected && selectedProducts.length) categories += 1;
      products += selectedProducts.length;
      review += all.filter((p) => p.needsReview && p.selected).length;
    }
    return { categories, products, review, totalProducts };
  }, [draft]);

  const step = !result ? 1 : result.status === 'published' ? 3 : 2;
  const isPublished = result?.status === 'published';
  const busy = running || saving || publishing;

  function applyImport(item) {
    setResult(item);
    setDraft(cloneDraft(item.draftMenu || emptyDraft()));
    setTab(item.draftMenu?.categories?.length ? 'review' : 'text');
    setSectionFilter('all');
    setPublishSummary(null);
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
      applyImport(item);
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
      applyImport(published.import);
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

  const steps = [
    { id: 1, label: t('aiFill.stepUpload'), icon: 'photo_camera' },
    { id: 2, label: t('aiFill.stepReview'), icon: 'fact_check' },
    { id: 3, label: t('aiFill.stepPublish'), icon: 'check_circle' },
  ];

  return (
    <div className="relative space-y-5 pb-28">
      {/* Hero */}
      <section className="overflow-hidden rounded-[22px] border border-outline-variant bg-surface-container-lowest shadow-[0_1px_2px_rgba(31,37,35,0.04)]">
        <div className="relative bg-gradient-to-br from-primary/12 via-surface-container-lowest to-surface-container px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">{t('aiFill.kicker')}</p>
              <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-on-surface sm:text-[2rem]">
                {t('aiFill.title')}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-[15px]">
                {t('aiFill.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${configured ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${configured ? 'bg-primary' : 'bg-error'}`} />
                {configured ? t('aiFill.statusReady') : t('aiFill.statusOffline')}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${llmConfigured ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                <MaterialIcon name="psychology" className="text-[15px]" />
                {llmConfigured ? t('aiFill.llmReadyShort') : t('aiFill.llmOfflineShort')}
              </span>
            </div>
          </div>

          <ol className="mt-6 grid gap-2 sm:grid-cols-3">
            {steps.map((item) => {
              const active = step === item.id;
              const done = step > item.id;
              return (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors ${
                    active
                      ? 'border-primary/30 bg-surface-container-lowest shadow-sm'
                      : done
                        ? 'border-primary/15 bg-primary/5'
                        : 'border-outline-variant/70 bg-surface-container/40'
                  }`}
                >
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      active || done ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <MaterialIcon name={done && !active ? 'check' : item.icon} className="text-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase">
                      {t('aiFill.stepLabel', { n: item.id })}
                    </p>
                    <p className={`truncate text-sm font-semibold ${active ? 'text-on-surface' : 'text-on-surface/80'}`}>
                      {item.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Upload */}
      <section className="rounded-[22px] border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-on-surface">{t('aiFill.uploadTitle')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t('aiFill.uploadHint')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            <MaterialIcon name="tune" className="text-[16px]" />
            {t('aiFill.advanced')}
            <MaterialIcon name={showAdvanced ? 'expand_less' : 'expand_more'} className="text-[16px]" />
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
          className={`relative flex min-h-[12rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border-2 border-dashed px-4 py-8 text-center transition-all ${
            dragOver
              ? 'border-primary bg-primary/8 scale-[1.01]'
              : previewUrl
                ? 'border-outline-variant bg-surface-container/30'
                : 'border-outline-variant bg-surface-container/40 hover:border-primary/40 hover:bg-surface-container'
          }`}
        >
          {previewUrl ? (
            <div className="flex w-full max-w-lg flex-col items-center gap-3">
              <img src={previewUrl} alt="" className="max-h-52 w-auto rounded-2xl object-contain shadow-sm" />
              <div>
                <p className="font-semibold text-on-surface">{file?.name}</p>
                <p className="mt-0.5 text-sm text-on-surface-variant">{t('aiFill.changeImage')}</p>
              </div>
            </div>
          ) : (
            <>
              <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MaterialIcon name="add_a_photo" className="text-[28px]" />
              </span>
              <p className="font-semibold text-on-surface">{t('aiFill.dropTitle')}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{t('aiFill.dropHint')}</p>
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

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-on-surface-variant">{t('aiFill.privacyNote')}</p>
          <button
            type="button"
            disabled={running || !configured || !file}
            onClick={handleRun}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-on-primary shadow-[0_10px_24px_rgba(13,27,42,0.16)] transition hover:brightness-105 disabled:opacity-50"
          >
            <MaterialIcon
              name={running ? 'progress_activity' : 'auto_awesome'}
              className={running ? 'animate-spin text-[20px]' : 'text-[20px]'}
            />
            {running ? t('aiFill.running') : t('aiFill.run')}
          </button>
        </div>

        {running ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            <MaterialIcon name="progress_activity" className="animate-spin text-[20px]" />
            <div>
              <p className="font-semibold">{t('aiFill.runningTitle')}</p>
              <p className="text-primary/80">{t('aiFill.runningHint')}</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">{success}</p>
        ) : null}

        {publishSummary ? (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-surface-container-lowest px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
                <MaterialIcon name="celebration" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-on-surface">{t('aiFill.publishSummaryTitle')}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {t('aiFill.publishSummaryBody', {
                    categories: publishSummary.categoriesCreated,
                    products: publishSummary.productsCreated,
                  })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/app/products" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-on-primary">
                    {t('aiFill.goProducts')}
                  </Link>
                  <Link to="/app/categories" className="inline-flex h-9 items-center rounded-full border border-outline-variant bg-surface-container-lowest px-4 text-xs font-semibold text-on-surface">
                    {t('aiFill.goCategories')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Review */}
      <section ref={reviewRef} className="rounded-[22px] border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-on-surface">{t('aiFill.reviewTitle')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t('aiFill.reviewHint')}</p>
          </div>
          {result ? (
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'review', label: t('aiFill.tabReview'), icon: 'fact_check' },
                { id: 'text', label: t('aiFill.tabText'), icon: 'notes' },
                { id: 'blocks', label: t('aiFill.tabBlocks'), icon: 'view_agenda' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tab === item.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <MaterialIcon name={item.icon} className="text-[15px]" />
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {!result ? (
          <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-outline-variant bg-surface-container/30 px-6 text-center">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
              <MaterialIcon name="restaurant_menu" className="text-[26px]" />
            </span>
            <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">{t('aiFill.emptyResult')}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-surface-container/50 px-3 py-2.5">
              {result.sourceImageUrl ? (
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
                  <CloudinaryImage src={result.sourceImageUrl} alt="" preset="productCard" className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface">
                  {selectedCounts.products}/{selectedCounts.totalProducts} {t('aiFill.selectedProducts')}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {selectedCounts.categories} {t('aiFill.categoriesSelected')}
                  {selectedCounts.review ? ` · ${selectedCounts.review} ${t('aiFill.toReview')}` : ''}
                  {draft.meta?.parser ? ` · ${draft.meta.parser}` : ''}
                </p>
              </div>
              {!isPublished && tab === 'review' ? (
                <div className="flex gap-1.5">
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
              <p className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
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
                  <p className="rounded-2xl bg-surface-container/40 px-4 py-6 text-center text-sm text-on-surface-variant">
                    {t('aiFill.noDraft')}
                  </p>
                ) : !visibleCategories.length ? (
                  <p className="rounded-2xl bg-surface-container/40 px-4 py-6 text-center text-sm text-on-surface-variant">
                    {t('aiFill.noSectionMatch')}
                  </p>
                ) : (
                  visibleCategories.map((cat) => {
                    const isCollapsed = Boolean(collapsed[cat.id]);
                    const productCount = cat.products?.length || 0;
                    const sectionKey = isMenuSectionKey(cat.sectionKey)
                      ? cat.sectionKey
                      : defaultSectionKey;
                    return (
                      <div
                        key={cat.id}
                        className={`overflow-hidden rounded-2xl border transition-opacity ${
                          cat.selected ? 'border-outline-variant bg-background' : 'border-dashed border-outline-variant opacity-55'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/70 bg-surface-container/40 px-3 py-2.5 sm:px-4">
                          <input
                            type="checkbox"
                            checked={Boolean(cat.selected)}
                            disabled={isPublished}
                            onChange={(event) => updateCategory(cat.id, { selected: event.target.checked })}
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
                            className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-on-surface outline-none focus:border-outline-variant focus:bg-surface-container-lowest disabled:opacity-70"
                          />
                          <select
                            value={sectionKey}
                            disabled={isPublished}
                            onChange={(event) =>
                              updateCategory(cat.id, { sectionKey: event.target.value })
                            }
                            aria-label={t('aiFill.sectionLabel')}
                            className="h-8 max-w-[10rem] rounded-full border border-outline-variant bg-surface-container-lowest px-2.5 text-[11px] font-semibold text-on-surface outline-none focus:border-primary disabled:opacity-70"
                          >
                            {sectionOptions.map((section) => (
                              <option key={section.key} value={section.key}>
                                {section.name}
                              </option>
                            ))}
                          </select>
                          <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                            {productCount} {t('aiFill.productsShort')}
                          </span>
                        </div>

                        {!isCollapsed ? (
                          <ul className="divide-y divide-outline-variant/60">
                            {(cat.products || []).map((prod) => (
                              <li
                                key={prod.id}
                                className={`px-3 py-3 sm:px-4 ${prod.needsReview ? 'bg-amber-500/[0.06]' : ''} ${prod.selected ? '' : 'opacity-45'}`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    className="mt-2.5 h-4 w-4 accent-[var(--color-primary,#0d1b2a)]"
                                    checked={Boolean(prod.selected)}
                                    disabled={isPublished || !cat.selected}
                                    onChange={(event) =>
                                      updateProduct(cat.id, prod.id, { selected: event.target.checked })
                                    }
                                  />
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
                                      <input
                                        value={prod.name}
                                        disabled={isPublished}
                                        onChange={(event) =>
                                          updateProduct(cat.id, prod.id, { name: event.target.value })
                                        }
                                        placeholder={t('aiFill.productName')}
                                        className="h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-70"
                                      />
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={prod.price}
                                          disabled={isPublished}
                                          onChange={(event) =>
                                            updateProduct(cat.id, prod.id, { price: event.target.value })
                                          }
                                          className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pe-10 ps-3 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-70"
                                        />
                                        <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-on-surface-variant">
                                          {t('aiFill.currency')}
                                        </span>
                                      </div>
                                    </div>
                                    <input
                                      value={prod.description || ''}
                                      disabled={isPublished}
                                      onChange={(event) =>
                                        updateProduct(cat.id, prod.id, { description: event.target.value })
                                      }
                                      placeholder={t('aiFill.productDescription')}
                                      className="h-9 w-full rounded-xl border border-outline-variant/80 bg-transparent px-3 text-xs text-on-surface-variant outline-none focus:border-primary disabled:opacity-70"
                                    />
                                    {prod.needsReview ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                        <MaterialIcon name="warning" className="text-[13px]" />
                                        {t('aiFill.needsReview')}
                                      </span>
                                    ) : null}
                                  </div>
                                  {!isPublished ? (
                                    <button
                                      type="button"
                                      onClick={() => removeProduct(cat.id, prod.id)}
                                      className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-error-container hover:text-error"
                                      aria-label={t('aiFill.removeProduct')}
                                    >
                                      <MaterialIcon name="delete" className="text-[18px]" />
                                    </button>
                                  ) : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  })
                )}

                {isPublished ? (
                  <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                    {t('aiFill.alreadyPublished')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {tab === 'text' ? (
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-surface-container/50 p-4 text-sm leading-relaxed text-on-surface">
                {result.rawText || t('aiFill.noText')}
              </pre>
            ) : null}

            {tab === 'blocks' ? (
              <ul className="max-h-[28rem] space-y-2 overflow-auto">
                {(result.rawBlocks || []).map((block, index) => (
                  <li
                    key={`${index}-${String(block?.text || '').slice(0, 12)}`}
                    className="rounded-xl border border-outline-variant bg-surface-container/40 px-3 py-2"
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
          </>
        )}
      </section>

      {/* History */}
      <section className="rounded-[22px] border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-on-surface">{t('aiFill.historyTitle')}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t('aiFill.historyHint')}</p>

        {historyLoading ? (
          <p className="mt-4 text-sm text-on-surface-variant">{t('common.loading')}</p>
        ) : history.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-outline-variant px-4 py-8 text-center text-sm text-on-surface-variant">
            {t('aiFill.historyEmpty')}
          </div>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {history.map((item) => {
              const meta = statusMeta(item.status, t);
              const active = result?._id === item._id;
              return (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => applyImport(item)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-start transition-colors ${
                      active
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-outline-variant bg-surface-container/30 hover:bg-surface-container'
                    }`}
                  >
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass(meta.tone)}`}>
                      <MaterialIcon name={meta.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-on-surface">
                        {item.draftMenu?.meta?.productCount
                          ? t('aiFill.historyProducts', { count: item.draftMenu.meta.productCount })
                          : item.rawText?.slice(0, 60) || item.errorMessage || t('aiFill.untitledImport')}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-on-surface-variant">
                        <span>{formatDate(item.createdAt, locale)}</span>
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${toneClass(meta.tone)}`}>{meta.label}</span>
                      </span>
                    </span>
                    <MaterialIcon name="chevron_right" className="text-on-surface-variant rtl:rotate-180" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Sticky actions */}
      {result && !isPublished && tab === 'review' ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest/95 p-3 shadow-[0_-8px_30px_rgba(13,27,42,0.12)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="px-1 text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">{selectedCounts.products}</span> {t('aiFill.readyToPublish')}
            </p>
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
              <button
                type="button"
                disabled={busy || !selectedCounts.products}
                onClick={handlePublish}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60 sm:flex-none"
              >
                <MaterialIcon
                  name={publishing ? 'progress_activity' : 'check_circle'}
                  className={publishing ? 'animate-spin text-[18px]' : 'text-[18px]'}
                />
                {publishing ? t('aiFill.publishing') : t('aiFill.confirmPublish')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
