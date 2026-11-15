import { useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../hooks/useLocale.js';
import { createPlatformCafe } from '../services/platform.service.js';
import { getApiError, getApiFieldErrors } from '../utils/apiError.js';
import { getHomePath } from '../utils/paths.js';
import { isValidSlug, slugify } from '../utils/slug.js';
import Field from '../components/ui/Field.jsx';

const emptyForm = {
  ownerName: '',
  email: '',
  password: '',
  cafeName: '',
  slug: '',
};

export default function CreateCafePage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const { refreshPlatformOverview } = useOutletContext();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(false);

  if (user?.role !== 'superadmin') {
    return <Navigate to={getHomePath(user)} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFieldErrors((current) => (current[name] ? { ...current, [name]: '' } : current));

    if (name === 'slug') {
      setSlugTouched(true);
      setForm((current) => ({ ...current, slug: value }));
      return;
    }

    if (name === 'cafeName') {
      setForm((current) => ({
        ...current,
        cafeName: value,
        slug: slugTouched ? current.slug : slugify(value),
      }));
      if (!slugTouched) {
        setFieldErrors((current) => (current.slug ? { ...current, slug: '' } : current));
      }
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateForm() {
    const next = {};
    if (form.ownerName.trim().length < 2) next.ownerName = t('auth.fieldName');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t('auth.emailInvalid');
    if (form.password.length < 8) next.password = t('auth.fieldPassword');
    if (form.cafeName.trim().length < 2) next.cafeName = t('auth.fieldCafeName');
    const slug = form.slug.trim().toLowerCase();
    if (!slug) next.slug = t('auth.fieldSlugRequired');
    else if (!isValidSlug(slug)) next.slug = t('auth.fieldSlugInvalid');
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const nextFieldErrors = validateForm();
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      const cafe = await createPlatformCafe({
        ownerName: form.ownerName,
        email: form.email,
        password: form.password,
        cafeName: form.cafeName,
        slug: form.slug.trim().toLowerCase(),
      });
      await refreshPlatformOverview?.();
      navigate(`/platform/cafes/${cafe._id}`, { replace: true });
    } catch (err) {
      const nextErrors = getApiFieldErrors(err, t);
      if (Object.keys(nextErrors).length) {
        setFieldErrors(nextErrors);
      } else {
        setError(getApiError(err, t, 'platform.createError'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5">
      <Link to="/platform/cafes" className="text-sm font-semibold text-primary hover:underline">
        {t('platform.allCafes')}
      </Link>

      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-on-surface">{t('platform.createTitle')}</h1>
        <p className="mt-1 text-on-surface-variant">
          {t('platform.createHint')}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">{error}</p>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="grid gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20">
        <Field
          name="cafeName"
          label={t('platform.cafeName')}
          icon="storefront"
          value={form.cafeName}
          onChange={handleChange}
          error={fieldErrors.cafeName}
          required
        />
        <Field
          name="slug"
          label={t('platform.slug')}
          icon="link"
          value={form.slug}
          onChange={handleChange}
          placeholder={t('auth.slugPlaceholder')}
          hint={t('auth.slugHint')}
          error={fieldErrors.slug}
          required
        />
        <Field
          name="ownerName"
          label={t('platform.ownerName')}
          icon="badge"
          value={form.ownerName}
          onChange={handleChange}
          error={fieldErrors.ownerName}
          required
        />
        <Field
          name="email"
          type="email"
          label={t('platform.ownerEmail')}
          icon="mail"
          value={form.email}
          onChange={handleChange}
          autoComplete="off"
          error={fieldErrors.email}
          required
        />
        <Field
          name="password"
          type="password"
          label={t('platform.password')}
          icon="lock"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          autoComplete="new-password"
          error={fieldErrors.password}
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-6 py-3 text-label-lg font-semibold tracking-[0.05em] text-on-primary shadow-md disabled:opacity-60"
        >
          {saving ? t('platform.creating') : t('platform.create')}
        </button>
      </form>
    </section>
  );
}
