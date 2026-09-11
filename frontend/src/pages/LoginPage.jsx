import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import MarketingLink from '../components/common/MarketingLink.jsx';
import AuthBrandPanel from '../components/auth/AuthBrandPanel.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import BrandLogo from '../components/ui/BrandLogo.jsx';
import LanguageSwitcher from '../components/ui/LanguageSwitcher.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../hooks/useLocale.js';
import { useToast } from '../hooks/useToast.js';
import { resendVerificationRequest } from '../services/auth.service.js';
import { getApiError } from '../utils/apiError.js';
import { getDemoMenuUrl } from '../utils/demoMenu.js';
import { getHomePath } from '../utils/paths.js';

export default function LoginPage() {
  const { isAuthenticated, isReady, login, user } = useAuth();
  const { t, locale } = useLocale();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!location.state?.resetSuccess) {
      return;
    }

    toast.success(t('auth.resetSuccess'));
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, t, toast]);

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-pulse rounded-full bg-surface-container-high" />
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const nextUser = await login(email, password);
      navigate(getHomePath(nextUser), { replace: true });
    } catch (err) {
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        try {
          await resendVerificationRequest({ email, locale });
        } catch {
          // The verify screen still lets the user request a new code.
        }

        navigate('/register', { replace: true, state: { pendingEmail: email } });
        return;
      }

      setError(getApiError(err, t, 'auth.loginError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background text-on-surface lg:grid-cols-2">
      <AuthBrandPanel />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/8 blur-[90px] lg:hidden" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-tertiary/10 blur-[80px] lg:hidden" />

        <div className="absolute top-4 end-4 z-20 sm:top-6 sm:end-6">
          <LanguageSwitcher />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-start">
            <div className="mb-5 lg:hidden">
              <MarketingLink to="/" aria-label={t('landing.navHome')}>
                <BrandLogo />
              </MarketingLink>
            </div>
            <h2 className="font-display text-headline-lg font-semibold tracking-tight text-on-surface sm:text-4xl">
              {t('auth.loginTitle')}
            </h2>
            <p className="mt-2 text-on-surface-variant">{t('auth.loginSubtitle')}</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <AuthField
              id="email"
              label={t('auth.email')}
              type="email"
              icon="mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="contact@restaurant.com"
              autoComplete="email"
              invalid={Boolean(error)}
              errorId="login-error"
            />

            <AuthField
              id="password"
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              icon="lock"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              minLength={8}
              invalid={Boolean(error)}
              errorId="login-error"
            >
              <button
                type="button"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="me-2 rounded-lg p-2 text-on-surface-variant/50 transition-colors hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
              </button>
            </AuthField>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {error ? (
              <p
                id="login-error"
                role="alert"
                className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-label-lg font-semibold tracking-[0.05em] text-on-primary shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? t('auth.submitting') : t('auth.submit')}
              <MaterialIcon name="arrow_forward" className="text-[20px]" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-on-surface-variant lg:text-start">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              {t('auth.createCafe')}
            </Link>
            {' · '}
            <a href={getDemoMenuUrl()} className="font-semibold text-primary hover:underline">
              {t('auth.trialLink')}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
