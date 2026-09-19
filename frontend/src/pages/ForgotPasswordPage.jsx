import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import MarketingLink from '../components/common/MarketingLink.jsx';
import AuthBrandPanel from '../components/auth/AuthBrandPanel.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import BrandLogo from '../components/ui/BrandLogo.jsx';
import LanguageSwitcher from '../components/ui/LanguageSwitcher.jsx';
import MaterialIcon from '../components/ui/MaterialIcon.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../hooks/useLocale.js';
import { requestPasswordReset, resetPasswordWithCode, verifyResetCode } from '../services/auth.service.js';
import { getApiError } from '../utils/apiError.js';
import { getHomePath } from '../utils/paths.js';

function AuthChrome({ title, subtitle, children, footer }) {
  const { t } = useLocale();

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
              {title}
            </h2>
            {subtitle ? <p className="mt-2 text-on-surface-variant">{subtitle}</p> : null}
          </div>
          {children}
          {footer}
        </div>
      </section>
    </main>
  );
}

export default function ForgotPasswordPage() {
  const { isAuthenticated, isReady, user } = useAuth();
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (retryAfter <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRetryAfter((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfter]);

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

  async function sendCode(event) {
    event?.preventDefault();
    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset({ email, locale });
      setRetryAfter(Number(result.retryAfter) || 60);
      setInfo(t('auth.resetCodeSent', { email }));
      setStep('code');
    } catch (err) {
      setError(getApiError(err, t, 'auth.resetSendError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await verifyResetCode({ email, code });
      setInfo('');
      setStep('password');
    } catch (err) {
      setError(getApiError(err, t, 'auth.resetCodeError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.resetMismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordWithCode({ email, code, newPassword: password });
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      setError(getApiError(err, t, 'auth.resetSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const footer = (
    <p className="mt-8 text-center text-sm text-on-surface-variant lg:text-start">
      <Link to="/login" className="font-semibold text-primary hover:underline">
        {t('auth.backToLogin')}
      </Link>
    </p>
  );

  if (step === 'code') {
    return (
      <AuthChrome title={t('auth.resetCodeTitle')} subtitle={t('auth.resetCodeSubtitle', { email })} footer={footer}>
        <form className="flex flex-col gap-4" onSubmit={handleVerify}>
          {info ? (
            <p className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-on-surface">
              {info}
            </p>
          ) : null}

          <AuthField
            id="code"
            label={t('auth.resetCode')}
            icon="pin"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoFocus
            invalid={Boolean(error)}
            errorId="reset-error"
          />

          {error ? (
            <p id="reset-error" role="alert" className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-label-lg font-semibold tracking-[0.05em] text-on-primary shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? t('auth.resetVerifying') : t('auth.resetVerify')}
            <MaterialIcon name="arrow_forward" className="text-[20px]" />
          </button>

          <button
            type="button"
            disabled={isSubmitting || retryAfter > 0}
            onClick={() => sendCode()}
            className="text-sm font-medium text-primary hover:underline disabled:text-on-surface-variant disabled:no-underline"
          >
            {retryAfter > 0 ? t('auth.resetResendWait', { seconds: retryAfter }) : t('auth.resetResend')}
          </button>
        </form>
      </AuthChrome>
    );
  }

  if (step === 'password') {
    return (
      <AuthChrome title={t('auth.resetNewTitle')} subtitle={t('auth.resetNewSubtitle')} footer={footer}>
        <form className="flex flex-col gap-4" onSubmit={handleReset}>
          <AuthField
            id="password"
            label={t('auth.resetNewPassword')}
            type={showPassword ? 'text' : 'password'}
            icon="lock"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            autoFocus
            invalid={Boolean(error)}
            errorId="reset-error"
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

          <AuthField
            id="confirmPassword"
            label={t('auth.resetConfirmPassword')}
            type={showPassword ? 'text' : 'password'}
            icon="lock"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            invalid={Boolean(error)}
            errorId="reset-error"
          />

          {error ? (
            <p id="reset-error" role="alert" className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-label-lg font-semibold tracking-[0.05em] text-on-primary shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? t('auth.resetSaving') : t('auth.resetSave')}
            <MaterialIcon name="arrow_forward" className="text-[20px]" />
          </button>
        </form>
      </AuthChrome>
    );
  }

  return (
    <AuthChrome title={t('auth.resetTitle')} footer={footer}>
      <form className="flex flex-col gap-4" onSubmit={sendCode}>
        <AuthField
          id="email"
          label={t('auth.email')}
          type="email"
          icon="mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="contact@restaurant.com"
          autoComplete="email"
          autoFocus
          invalid={Boolean(error)}
          errorId="reset-error"
        />

        {error ? (
          <p id="reset-error" role="alert" className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-error">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-label-lg font-semibold tracking-[0.05em] text-on-primary shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? t('auth.resetSending') : t('auth.resetSend')}
          <MaterialIcon name="arrow_forward" className="text-[20px]" />
        </button>
      </form>
    </AuthChrome>
  );
}
