import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import Field from '../components/ui/Field.jsx';
import PasswordField from '../components/ui/PasswordField.jsx';
import CloudinaryImage from '../components/ui/CloudinaryImage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../hooks/useLocale.js';
import { useToast } from '../hooks/useToast.js';
import { deletePlatformCafe, getPlatformCafe, populateCafeContent, resetPlatformCafePassword, resetTrialCafe, updatePlatformCafe, updatePlatformCafeOwnerEmail } from '../services/platform.service.js';
import { getApiError } from '../utils/apiError.js';
import { formatDate } from '../utils/format.js';
import { hasCoordinates, mapsHref } from '../utils/location.js';
import { getPublicMenuUrl } from '../utils/constants.js';
import { getHomePath } from '../utils/paths.js';

function DetailStat({ label, value }) {
  return (
    <div>
      <p className="text-label-md font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-on-surface">{value || '—'}</p>
    </div>
  );
}

export default function CafeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const toast = useToast();
  const { refreshPlatformOverview } = useOutletContext();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [trialBusy, setTrialBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    getPlatformCafe(id)
      .then((data) => {
        if (!cancelled) {
          setCafe(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiError(err, t, 'platform.notFound'));
          setCafe(null);
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
  }, [id, t]);

  useEffect(() => {
    if (cafe?.ownerEmail) {
      setOwnerEmail(cafe.ownerEmail);
    }
  }, [cafe?.ownerEmail]);

  if (user?.role !== 'superadmin') {
    return <Navigate to={getHomePath(user)} replace />;
  }

  async function handleToggle() {
    if (!cafe) {
      return;
    }

    setPending(true);
    setError('');

    try {
      const updated = await updatePlatformCafe(cafe._id, { isActive: !cafe.isActive });
      setCafe((current) => ({ ...current, ...updated }));
      await refreshPlatformOverview?.();
    } catch (err) {
      setError(getApiError(err, t, 'platform.updateError'));
    } finally {
      setPending(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    if (!cafe) {
      return;
    }

    if (password !== confirmPassword) {
      setError(t('platform.passwordMismatch'));
      return;
    }

    setResetting(true);
    setError('');

    try {
      const result = await resetPlatformCafePassword(cafe._id, password);
      setPassword('');
      setConfirmPassword('');
      setShowNew(false);
      setShowConfirm(false);
      setShowResetForm(false);
      toast.success(t('platform.passwordUpdated', { email: result.email }));
    } catch (err) {
      setError(getApiError(err, t, 'platform.resetError'));
    } finally {
      setResetting(false);
    }
  }

  async function handleUpdateEmail(event) {
    event.preventDefault();

    if (!cafe) {
      return;
    }

    const nextEmail = ownerEmail.trim().toLowerCase();

    if (!nextEmail || nextEmail === cafe.ownerEmail) {
      setShowEmailForm(false);
      return;
    }

    setEmailSaving(true);
    setError('');

    try {
      const result = await updatePlatformCafeOwnerEmail(cafe._id, nextEmail);
      const updated = await getPlatformCafe(cafe._id);
      setCafe(updated);
      setOwnerEmail(updated.ownerEmail || result.email);
      setShowEmailForm(false);
      toast.success(t('platform.emailUpdated', { email: result.email }));
      await refreshPlatformOverview?.();
    } catch (err) {
      setError(getApiError(err, t, 'platform.emailUpdateError'));
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleTrialRole(trialRole) {
    if (!cafe) {
      return;
    }

    setTrialBusy(true);
    setError('');

    try {
      const updated = await updatePlatformCafe(cafe._id, { trialRole });
      setCafe((current) => ({ ...current, ...updated }));
      toast.success(
        trialRole === 'playground'
          ? t('platform.trialSetPlayground')
          : trialRole === 'template'
            ? t('platform.trialSetTemplate')
            : t('platform.trialCleared'),
      );
      await refreshPlatformOverview?.();
    } catch (err) {
      setError(getApiError(err, t, 'platform.updateError'));
    } finally {
      setTrialBusy(false);
    }
  }

  async function handleResetTrial() {
    if (!cafe) {
      return;
    }

    setTrialBusy(true);
    setError('');

    try {
      const updated = await resetTrialCafe(cafe._id);
      setCafe(updated);
      toast.success(t('platform.trialResetDone'));
      await refreshPlatformOverview?.();
    } catch (err) {
      setError(getApiError(err, t, 'platform.trialResetError'));
    } finally {
      setTrialBusy(false);
    }
  }

  async function handlePopulate() {
    if (!cafe || !window.confirm(t('platform.populateConfirm'))) {
      return;
    }

    setTrialBusy(true);
    setError('');

    try {
      const updated = await populateCafeContent(cafe._id);
      setCafe(updated);
      toast.success(t('platform.populateSuccess'));
      await refreshPlatformOverview?.();
    } catch (err) {
      setError(getApiError(err, t, 'platform.populateError'));
    } finally {
      setTrialBusy(false);
    }
  }

  async function handleDelete() {
    if (!cafe) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deletePlatformCafe(cafe._id);
      await refreshPlatformOverview?.();
      navigate('/platform/cafes', { replace: true });
    } catch (err) {
      setError(getApiError(err, t, 'platform.deleteError'));
      setDeleting(false);
    }
  }

  function qrStatusLabel() {
    if (cafe?.qr?.generated) {
      return t('qr.statusGenerated');
    }

    return t('qr.statusNotGenerated');
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Link to="/platform/cafes" className="text-sm font-semibold text-primary hover:underline">
        {t('platform.backToCafes')}
      </Link>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-on-surface-variant">{t('common.loading')}</p>
      ) : cafe ? (
        <div className="space-y-5 rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {cafe.logo ? (
                <CloudinaryImage
                  src={cafe.logo}
                  alt=""
                  preset="logo"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
                  {cafe.name.slice(0, 1)}
                </div>
              )}
              <div>
                <h1 className="font-display text-3xl font-semibold text-on-surface">{cafe.name}</h1>
                <p className="text-on-surface-variant">/{cafe.slug}</p>
              </div>
            </div>
            <span className={cafe.isActive ? 'font-semibold text-primary' : 'font-semibold text-error'}>
              {cafe.isActive ? t('platform.statusActive') : t('platform.statusInactive')}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailStat label={t('platform.owner')} value={cafe.ownerName} />
            <DetailStat label={t('platform.email')} value={cafe.ownerEmail} />
            <DetailStat label={t('platform.phone')} value={cafe.phone} />
            <DetailStat
              label={t('platform.address')}
              value={
                cafe.address || hasCoordinates(cafe) ? (
                  <a href={mapsHref(cafe)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {cafe.address || t('platform.viewLocation')}
                  </a>
                ) : (
                  t('common.none')
                )
              }
            />
            <DetailStat label={t('platform.categories')} value={String(cafe.categoryCount)} />
            <DetailStat label={t('platform.products')} value={String(cafe.productCount)} />
            <DetailStat label={t('platform.created')} value={formatDate(cafe.createdAt, locale)} />
            <DetailStat label={t('platform.updated')} value={formatDate(cafe.updatedAt, locale)} />
          </div>

          {cafe.description ? <p className="text-on-surface-variant">{cafe.description}</p> : null}

          <div className="flex flex-wrap gap-3">
            <a
              href={getPublicMenuUrl(cafe.slug)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary"
            >
              {t('platform.viewMenu')}
            </a>
            <button
              type="button"
              disabled={pending}
              onClick={handleToggle}
              className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface disabled:opacity-60"
            >
              {cafe.isActive ? t('platform.deactivate') : t('platform.activate')}
            </button>
          </div>

          <div className="space-y-3 border-t border-outline-variant/30 pt-5">
            <h2 className="text-lg font-semibold text-on-surface">{t('qr.platformTitle')}</h2>
            <p className="text-sm text-on-surface-variant">{t('qr.platformHint')}</p>
            <p className="font-semibold text-on-surface">{qrStatusLabel()}</p>
          </div>

          <div className="space-y-3 border-t border-outline-variant/30 pt-5">
            <h2 className="text-lg font-semibold text-on-surface">{t('platform.trialTitle')}</h2>
            <p className="text-sm text-on-surface-variant">{t('platform.trialHint')}</p>
            <p className="font-semibold text-on-surface">
              {cafe.trialRole === 'playground'
                ? t('platform.trialRolePlayground')
                : cafe.trialRole === 'template'
                  ? t('platform.trialRoleTemplate')
                  : t('platform.trialRoleNone')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={trialBusy}
                onClick={() => handleTrialRole('playground')}
                className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface disabled:opacity-60"
              >
                {t('platform.trialMarkPlayground')}
              </button>
              <button
                type="button"
                disabled={trialBusy}
                onClick={() => handleTrialRole('template')}
                className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface disabled:opacity-60"
              >
                {t('platform.trialMarkTemplate')}
              </button>
              {cafe.trialRole !== 'none' ? (
                <button
                  type="button"
                  disabled={trialBusy}
                  onClick={() => handleTrialRole('none')}
                  className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface disabled:opacity-60"
                >
                  {t('platform.trialClearRole')}
                </button>
              ) : null}
              {cafe.trialRole === 'playground' ? (
                <button
                  type="button"
                  disabled={trialBusy}
                  onClick={handleResetTrial}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
                >
                  {trialBusy ? t('common.saving') : t('platform.trialReset')}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={trialBusy}
                  onClick={handlePopulate}
                  className="rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-60"
                >
                  {trialBusy ? t('common.saving') : t('platform.populateAction')}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t border-outline-variant/30 pt-5">
            <h2 className="text-lg font-semibold text-on-surface">{t('platform.emailTitle')}</h2>
            <p className="text-sm text-on-surface-variant">{t('platform.emailHint')}</p>
            {showEmailForm ? (
              <form onSubmit={handleUpdateEmail} className="grid gap-3">
                <Field
                  name="ownerEmail"
                  type="email"
                  label={t('platform.ownerEmail')}
                  icon="mail"
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={emailSaving}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
                  >
                    {emailSaving ? t('common.saving') : t('platform.saveEmail')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(false);
                      setOwnerEmail(cafe.ownerEmail || '');
                    }}
                    className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(true);
                  setOwnerEmail(cafe.ownerEmail || '');
                }}
                className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface"
              >
                {t('platform.changeEmail')}
              </button>
            )}
          </div>

          <div className="space-y-3 border-t border-outline-variant/30 pt-5">
            <h2 className="text-lg font-semibold text-on-surface">{t('platform.passwordTitle')}</h2>
            <p className="text-sm text-on-surface-variant">
              {t('platform.passwordHint', { email: cafe.ownerEmail || t('platform.owner') })}
            </p>
            {showResetForm ? (
              <form onSubmit={handleResetPassword} className="grid gap-3">
                <PasswordField
                  label={t('platform.newPassword')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  show={showNew}
                  onToggleShow={() => setShowNew((current) => !current)}
                  placeholder={t('settings.passwordPlaceholder')}
                  minLength={8}
                />
                <PasswordField
                  label={t('platform.confirmPassword')}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm((current) => !current)}
                  placeholder={t('settings.confirmPlaceholder')}
                  minLength={8}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={resetting}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
                  >
                    {resetting ? t('common.saving') : t('platform.reset')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetForm(false);
                      setPassword('');
                      setConfirmPassword('');
                      setShowNew(false);
                      setShowConfirm(false);
                    }}
                    className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(true);
                }}
                className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface"
              >
                {t('platform.changePassword')}
              </button>
            )}
          </div>

          <div className="space-y-3 border-t border-error/20 pt-5">
            <h2 className="text-lg font-semibold text-error">{t('platform.deleteTitle')}</h2>
            <p className="text-sm text-on-surface-variant">{t('platform.deleteHint')}</p>
            <Field
              invalid
              label={t('platform.deleteConfirm', { name: cafe.name })}
              value={deleteName}
              onChange={(event) => setDeleteName(event.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              disabled={deleting || deleteName.trim() !== cafe.name}
              onClick={handleDelete}
              className="rounded-xl bg-error px-5 py-2.5 text-sm font-semibold text-on-error disabled:opacity-60"
            >
              {deleting ? t('platform.deleting') : t('platform.delete')}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
