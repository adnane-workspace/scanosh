import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ImageLightbox from '../components/ui/ImageLightbox.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import MenuBackgroundEditor from '../components/settings/MenuBackgroundEditor.jsx';
import MenuCardEditor from '../components/settings/MenuCardEditor.jsx';
import { SettingsImagePicker, SettingsSectionCard } from '../components/settings/SettingsPanels.jsx';
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
      const savedUi = normalizeMenuUi(cafe.menuUi);

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

  return (
    <section className={`mx-auto w-full max-w-4xl space-y-6 ${isDirty ? 'pb-24 lg:pb-6' : ''}`}>
      <div className="flex flex-col gap-4 border-b border-outline-variant pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-[1.75rem]">
              {t('publicMenu.title')}
            </h1>
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t('publicMenu.unsavedShort')}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 max-w-xl text-sm text-on-surface-variant">{t('publicMenu.subtitle')}</p>
        </div>
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {publicUrl ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
            >
              <MaterialIcon name="open_in_new" className="text-[18px]" />
              {t('settings.viewMenu')}
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MaterialIcon name="save" className="text-[18px]" />
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">{error}</p>
      ) : null}

      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-5">
          <SettingsSectionCard icon="wallpaper" title={t('publicMenu.backgroundTitle')} subtitle={t('publicMenu.backgroundHint')}>
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
          </SettingsSectionCard>

          {menuSections.map((section) => (
            <SettingsSectionCard
              key={section.key}
              icon={sectionIcon(section.key)}
              title={t('publicMenu.cardsSectionTitle', { name: section.name })}
              subtitle={t('publicMenu.cardsSectionHint')}
            >
              <MenuCardEditor
                card={getSectionCard(menuUi, section.key)}
                backdrop={
                  menuUi.bgMode === 'color'
                    ? menuUi.backgroundColor || DEFAULT_MENU_BACKGROUND
                    : DEFAULT_MENU_BACKGROUND
                }
                t={t}
                onChange={(partial) => patchSectionCard(section.key, partial)}
              />
            </SettingsSectionCard>
          ))}

          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsSectionCard icon="storefront" title={t('settings.logo')} subtitle={t('settings.logoHint')}>
              <SettingsImagePicker
                preview={logo}
                emptyClass="h-28 w-28"
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
            </SettingsSectionCard>

            <SettingsSectionCard icon="visibility" title={t('settings.menuVisibility')} subtitle={t('publicMenu.visibilityHint')}>
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
            </SettingsSectionCard>
          </div>
        </div>
      )}

      {isDirty ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-background/95 px-4 py-3 backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-4xl gap-2">
            {publicUrl ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
                aria-label={t('settings.viewMenu')}
              >
                <MaterialIcon name="open_in_new" className="text-[20px]" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-on-primary disabled:opacity-50"
            >
              <MaterialIcon name="save" className="text-[20px]" />
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      ) : null}

      <ImageLightbox src={previewUrl} onClose={() => setPreviewUrl('')} />
    </section>
  );
}
