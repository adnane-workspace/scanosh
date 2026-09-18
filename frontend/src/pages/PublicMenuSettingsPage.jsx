import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ImageLightbox from '../components/ui/ImageLightbox.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import MenuBackgroundEditor from '../components/settings/MenuBackgroundEditor.jsx';
import MenuCardEditor from '../components/settings/MenuCardEditor.jsx';
import { SettingsImagePicker } from '../components/settings/SettingsPanels.jsx';
import { SettingsToggle } from '../components/settings/SettingsToggle.jsx';
import { useLocale } from '../hooks/useLocale.js';
import { useToast } from '../hooks/useToast.js';
import { clearPublicMenuCache } from '../hooks/usePublicMenu.js';
import { getMyCafe, updateMyCafe, uploadCafeLogo } from '../services/cafe.service.js';
import { listCategoryOptions } from '../services/category.service.js';
import { getPublicMenuUrl } from '../utils/constants.js';
import { getApiError } from '../utils/apiError.js';
import {
  DEFAULT_MENU_BACKGROUND,
  DEFAULT_MENU_UI,
  finalizeMenuUi,
  getSectionCard,
  normalizeHexColor,
  normalizeMenuUi,
  withSectionCards,
} from '../utils/menuUi.js';
import { DEFAULT_SECTION_DEFS, sectionIcon } from '../utils/menuSections.js';

function draftSnapshot(logo, menuUi) {
  return JSON.stringify({
    logo: logo || '',
    menuUi: normalizeMenuUi(menuUi),
  });
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-48 rounded-[18px] bg-surface-container-low" />
      <div className="h-72 rounded-[18px] bg-surface-container-low" />
      <div className="h-36 rounded-[18px] bg-surface-container-low" />
    </div>
  );
}

export default function PublicMenuSettingsPage() {
  const { t } = useLocale();
  const toast = useToast();
  const { refreshStats } = useOutletContext() || {};
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState('');
  const [menuUi, setMenuUi] = useState(DEFAULT_MENU_UI);
  const [colorDraft, setColorDraft] = useState(DEFAULT_MENU_UI.backgroundColor);
  const [savedSnapshotValue, setSavedSnapshotValue] = useState(() => draftSnapshot('', DEFAULT_MENU_UI));
  const [previewUrl, setPreviewUrl] = useState('');
  const [menuSections, setMenuSections] = useState(DEFAULT_SECTION_DEFS);
  const [studioTab, setStudioTab] = useState('look');
  const [activeSectionKey, setActiveSectionKey] = useState('restaurant');

  useEffect(() => {
    let cancelled = false;

    Promise.all([getMyCafe(), listCategoryOptions().catch(() => [])])
      .then(([cafe, categories]) => {
        if (cancelled) {
          return;
        }

        const nextLogo = cafe.logo || '';
        const sections = (categories || [])
          .filter((item) => item.sectionKey)
          .sort((a, b) => (a.order - b.order) || String(a.name).localeCompare(String(b.name)))
          .map((item) => ({ key: item.sectionKey, name: item.name }));
        const nextSections = sections.length ? sections : DEFAULT_SECTION_DEFS;
        const nextUi = withSectionCards(cafe.menuUi, nextSections.map((item) => item.key));

        setSlug(cafe.slug || '');
        setLogo(nextLogo);
        setMenuUi(nextUi);
        setColorDraft(nextUi.backgroundColor);
        setMenuSections(nextSections);
        setActiveSectionKey((current) =>
          nextSections.some((item) => item.key === current) ? current : nextSections[0]?.key || 'restaurant',
        );
        setSavedSnapshotValue(draftSnapshot(nextLogo, nextUi));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiError(err, t, 'settings.loadError'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const isDirty = useMemo(
    () => draftSnapshot(logo, menuUi) !== savedSnapshotValue,
    [logo, menuUi, savedSnapshotValue],
  );

  function patchMenuUi(partial) {
    setMenuUi((current) => {
      const next = normalizeMenuUi({ ...current, ...partial });

      if (next.bgMode === 'color') {
        setColorDraft(next.backgroundColor);
      }

      return next;
    });
  }

  function patchSectionCard(sectionKey, partial) {
    setMenuUi((current) => {
      const next = normalizeMenuUi(current);
      return {
        ...next,
        cardBySection: {
          ...next.cardBySection,
          [sectionKey]: {
            ...getSectionCard(next, sectionKey),
            ...partial,
          },
        },
      };
    });
  }

  function handleMenuBackgroundColor(value) {
    setColorDraft(value);
    const hex = normalizeHexColor(value);

    if (!hex) {
      return;
    }

    patchMenuUi({ bgMode: 'color', backgroundColor: hex });
  }

  async function handleSave() {
    const nextUi = finalizeMenuUi(withSectionCards(menuUi, menuSections.map((item) => item.key)));

    setSaving(true);
    setError('');

    try {
      const cafe = await updateMyCafe({ logo, menuUi: nextUi });
      const savedLogo = cafe.logo || '';
      const savedUi = withSectionCards(cafe.menuUi, menuSections.map((item) => item.key));

      setLogo(savedLogo);
      setMenuUi(savedUi);
      setColorDraft(savedUi.backgroundColor);
      setSavedSnapshotValue(draftSnapshot(savedLogo, savedUi));
      clearPublicMenuCache(cafe.slug || slug);
      toast.success(t('settings.menuUiSaved'));
      await refreshStats?.();
    } catch (err) {
      const message = getApiError(err, t, 'settings.saveError');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploading('logo');
    setError('');

    try {
      const url = await uploadCafeLogo(file, 'logo');
      setLogo(url);
    } catch (err) {
      setError(getApiError(err, t, 'settings.uploadError'));
    } finally {
      setUploading('');
    }
  }

  function handleLogoRemove() {
    setLogo('');
  }

  async function handleMenuBackgroundImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploading('menuBg');
    setError('');

    try {
      const url = await uploadCafeLogo(file, 'menuBg');
      patchMenuUi({ bgMode: 'image', backgroundImage: url });
    } catch (err) {
      setError(getApiError(err, t, 'settings.uploadError'));
    } finally {
      setUploading('');
    }
  }

  const publicUrl = getPublicMenuUrl(slug);
  const saveDisabled = !isDirty || saving || Boolean(uploading);
  const activeSection = menuSections.find((item) => item.key === activeSectionKey) || menuSections[0];

  return (
    <section className={`mx-auto w-full max-w-5xl space-y-5 sm:space-y-6 ${isDirty ? 'pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pb-28' : 'pb-8'}`}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 max-w-xl">
          <p className="hidden text-[11px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase sm:block">
            {t('publicMenu.kicker')}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:mt-1">
            <h1 className="hidden font-display text-[1.75rem] font-bold tracking-tight text-on-surface sm:block sm:text-[2rem]">
              {t('publicMenu.title')}
            </h1>
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t('publicMenu.unsavedShort')}
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-on-surface-variant sm:mt-2">{t('publicMenu.subtitle')}</p>
        </div>
        {publicUrl ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-black/8 bg-white px-4 text-sm font-semibold text-on-surface shadow-[0_8px_24px_rgba(13,27,42,0.04)] hover:bg-[#f7f8f9] sm:w-auto sm:rounded-xl"
          >
            <MaterialIcon name="open_in_new" className="text-[18px]" />
            {t('settings.viewMenu')}
          </a>
        ) : null}
      </header>

      <nav className="grid grid-cols-2 gap-1 rounded-2xl border border-black/6 bg-white p-1 shadow-[0_8px_28px_rgba(13,27,42,0.04)]">
        {[
          { id: 'look', icon: 'wallpaper', label: t('publicMenu.tabLook') },
          { id: 'cards', icon: 'style', label: t('publicMenu.tabCards') },
        ].map((item) => {
          const active = studioTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setStudioTab(item.id)}
              className={`inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold transition sm:gap-2 sm:px-3 sm:text-sm ${
                active ? 'bg-[#0d1b2a] text-white shadow-sm' : 'text-[#5c6570] hover:bg-[#f4f5f6]'
              }`}
            >
              <MaterialIcon name={item.icon} className="shrink-0 text-[18px]" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {error ? (
        <p className="rounded-2xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">{error}</p>
      ) : null}

      {loading ? (
        <PageSkeleton />
      ) : studioTab === 'look' ? (
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-black/6 bg-white p-4 shadow-[0_8px_28px_rgba(13,27,42,0.05)] sm:p-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-semibold text-on-surface">{t('publicMenu.backgroundTitle')}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{t('publicMenu.backgroundHint')}</p>
            </div>
            <MenuBackgroundEditor
              menuUi={menuUi}
              colorDraft={colorDraft}
              uploading={uploading === 'menuBg'}
              t={t}
              onModeChange={(bgMode) => patchMenuUi({ bgMode })}
              onColorChange={handleMenuBackgroundColor}
              onImageChange={handleMenuBackgroundImage}
              onImageRemove={() => patchMenuUi({ backgroundImage: '', bgMode: 'color' })}
              onImagePreview={() => setPreviewUrl(menuUi.backgroundImage)}
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="overflow-hidden rounded-3xl border border-black/6 bg-white p-4 shadow-[0_8px_28px_rgba(13,27,42,0.05)] sm:p-6">
              <h2 className="font-display text-lg font-semibold text-on-surface">{t('settings.logo')}</h2>
              <p className="mt-1 mb-4 text-sm text-on-surface-variant">{t('settings.logoHint')}</p>
              <SettingsImagePicker
                preview={logo}
                emptyClass="h-24 w-24"
                uploading={uploading === 'logo'}
                hasImage={Boolean(logo)}
                chooseLabel={t('settings.chooseLogo')}
                replaceLabel={t('settings.replaceLogo')}
                uploadingLabel={t('settings.uploading')}
                removeLabel={t('settings.removeLogo')}
                emptyHint={t('settings.logoHintEmpty')}
                viewLabel={t('settings.viewPhoto')}
                onChange={handleLogoChange}
                onRemove={handleLogoRemove}
                onPreview={() => setPreviewUrl(logo)}
                disabled={Boolean(uploading) || saving}
              />
            </section>

            <section className="overflow-hidden rounded-3xl border border-black/6 bg-white p-4 shadow-[0_8px_28px_rgba(13,27,42,0.05)] sm:p-6">
              <h2 className="font-display text-lg font-semibold text-on-surface">{t('settings.menuVisibility')}</h2>
              <p className="mt-1 mb-4 text-sm text-on-surface-variant">{t('publicMenu.visibilityHint')}</p>
              <div className="grid gap-3">
                <SettingsToggle
                  checked={Boolean(menuUi.showPhone)}
                  onChange={(value) => patchMenuUi({ showPhone: value })}
                  icon="call"
                  label={t('settings.menuShowPhone')}
                  hint={t('settings.menuShowPhoneHint')}
                />
                <SettingsToggle
                  checked={Boolean(menuUi.showAddress)}
                  onChange={(value) => patchMenuUi({ showAddress: value })}
                  icon="location_on"
                  label={t('settings.menuShowAddress')}
                  hint={t('settings.menuShowAddressHint')}
                />
              </div>
            </section>
          </div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-black/6 bg-white p-4 shadow-[0_8px_28px_rgba(13,27,42,0.05)] sm:p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-on-surface">{t('publicMenu.cardsTitle')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t('publicMenu.cardsHint')}</p>
          </div>

          {menuSections.length > 1 ? (
            <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {menuSections.map((section) => {
                const active = activeSection?.key === section.key;
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSectionKey(section.key)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                      active ? 'bg-[#0d1b2a] text-white' : 'bg-[#f4f5f6] text-[#5c6570] hover:bg-[#eceeef]'
                    }`}
                  >
                    <MaterialIcon name={sectionIcon(section.key)} className="text-[18px]" />
                    {section.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {activeSection ? (
            <MenuCardEditor
              card={getSectionCard(menuUi, activeSection.key)}
              backdrop={
                menuUi.bgMode === 'color'
                  ? menuUi.backgroundColor || DEFAULT_MENU_BACKGROUND
                  : DEFAULT_MENU_BACKGROUND
              }
              t={t}
              onChange={(partial) => patchSectionCard(activeSection.key, partial)}
            />
          ) : null}
        </section>
      )}

      {isDirty ? (
        <div className="sticky bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-5xl">
          <div className="flex flex-col gap-2 rounded-2xl border border-black/8 bg-white/95 p-2 shadow-[0_12px_40px_rgba(13,27,42,0.12)] backdrop-blur-md sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 px-3 pt-1 text-sm font-semibold leading-snug text-[#5c6570] sm:pt-0">
              {t('publicMenu.unsaved')}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0d1b2a] px-5 text-sm font-semibold text-white disabled:opacity-45 sm:w-auto sm:shrink-0"
            >
              <MaterialIcon name={saving ? 'progress_activity' : 'save'} className={saving ? 'animate-spin text-[18px]' : 'text-[18px]'} />
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      ) : null}

      <ImageLightbox src={previewUrl} onClose={() => setPreviewUrl('')} />
    </section>
  );
}
