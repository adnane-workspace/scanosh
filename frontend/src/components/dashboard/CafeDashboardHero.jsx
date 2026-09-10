import { useState } from 'react';
import { useLocale } from '../../hooks/useLocale.js';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import MaterialIcon from '../ui/MaterialIcon.jsx';

export default function CafeDashboardHero({ cafe, greetingName, menuUrl, qr, onOpenQr }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const cafeName = cafe?.name || t('auth.digitalMenu');

  async function copyMenuUrl() {
    if (!menuUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const qrLabel = qr.generated ? t('dashboard.qrStatusReady') : t('dashboard.qrStatusMissing');

  return (
    <section className="overflow-hidden rounded-[18px] border border-outline-variant bg-surface-container-lowest shadow-[0_1px_2px_rgba(31,37,35,0.04)]">
      <div className="relative h-28 bg-surface-container sm:h-32">
        {cafe?.cover ? (
          <CloudinaryImage
            src={cafe.cover}
            alt=""
            preset="cover"
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/15 via-surface-container to-surface-container-high" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent" />
      </div>

      <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">
        <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface-container-lowest bg-surface-container shadow-sm sm:h-24 sm:w-24">
                {cafe?.logo ? (
                  <CloudinaryImage src={cafe.logo} alt="" preset="logoHero" className="h-full w-full object-cover" />
                ) : (
                  <MaterialIcon name="storefront" className="text-[32px] text-on-surface-variant" />
                )}
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                  {t('dashboard.roleAdmin')}
                </p>
                <h1 className="mt-0.5 truncate font-display text-[1.65rem] leading-tight font-semibold tracking-tight text-on-surface sm:text-[2rem]">
                  {cafeName}
                </h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {t('dashboard.helloShort', { name: greetingName })}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  qr.generated
                    ? 'bg-tertiary/15 text-tertiary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <MaterialIcon name="qr_code_2" className="text-[16px]" />
                {qrLabel}
              </span>
              {menuUrl ? (
                <button
                  type="button"
                  onClick={copyMenuUrl}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <MaterialIcon name="link" className="text-[16px]" />
                  <span className="truncate">{copied ? t('dashboard.linkCopied') : cafe?.slug}</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            {menuUrl ? (
              <a
                href={menuUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
              >
                <MaterialIcon name="open_in_new" className="text-[20px]" />
                {t('dashboard.openMenu')}
              </a>
            ) : null}
            <button
              type="button"
              disabled={!menuUrl}
              onClick={() => onOpenQr(qr.canGenerate ? 'issue' : 'view')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-primary"
            >
              <MaterialIcon name="qr_code_scanner" className="text-[20px]" />
              {qr.canGenerate ? t('dashboard.generateQr') : t('dashboard.viewQr')}
            </button>
          </div>
        </div>

        {qr.generated ? (
          <p className="mt-4 text-sm text-on-surface-variant">{t('dashboard.qrPermanentHint')}</p>
        ) : null}
      </div>
    </section>
  );
}
