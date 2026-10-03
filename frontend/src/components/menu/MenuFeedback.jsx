import { useEffect, useRef, useState } from 'react';
import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { submitMenuFeedback } from '../../services/feedback.service.js';
import { getApiError } from '../../utils/apiError.js';
import {
  commentError,
  FEEDBACK_PROMPT_DELAY_MS,
  FEEDBACK_PROMPT_LIMIT,
  feedbackPromptDecision,
  feedbackView,
  shouldOpenGoogleReview,
} from '../../utils/feedback.js';

const STARS = [1, 2, 3, 4, 5];

function openGoogleReview(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function storageKey(slug) {
  return `scanosh-feedback:${slug}`;
}

function dismissKey(slug) {
  return `scanosh-feedback-dismiss:${slug}`;
}

function categoryKey(slug) {
  return `scanosh-feedback-category:${slug}`;
}

function hasSent(slug) {
  try {
    return sessionStorage.getItem(storageKey(slug)) === '1';
  } catch {
    return false;
  }
}

function markSent(slug) {
  try {
    sessionStorage.setItem(storageKey(slug), '1');
  } catch {
    // Private browsing can block storage. The server rate limit still applies.
  }
}

function readDismissals(slug) {
  try {
    const value = Number(sessionStorage.getItem(dismissKey(slug)) || 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeDismissals(slug, count) {
  try {
    sessionStorage.setItem(dismissKey(slug), String(count));
  } catch {
    // Ignore storage failures. The prompt simply will not persist.
  }
}

function FeedbackBody({
  idPrefix,
  tone = 'menu',
  phase,
  rating,
  view,
  comment,
  submitting,
  error,
  reviewUrl,
  onRate,
  onComment,
  onSubmitPrivate,
}) {
  const { t } = useLocale();
  const onCard = tone === 'card';
  const muted = onCard ? 'text-[#415a77]' : 'text-on-surface-variant';
  const strong = onCard ? 'text-[#0d1b2a]' : 'text-on-surface';
  const accent = onCard ? 'text-[#0d1b2a]' : 'text-primary';

  return (
    <>
      <p className={`text-xs font-semibold tracking-[0.12em] uppercase ${muted}`}>
        {t('menu.feedback.kicker')}
      </p>
      <h2 className={`mt-2 font-display text-lg font-semibold ${strong}`}>{t('menu.feedback.title')}</h2>

      {phase === 'done' ? (
        <p className={`mt-3 text-sm ${muted}`}>{t('menu.feedback.alreadySent')}</p>
      ) : null}

      {phase === 'idle' ? (
        <div className="mt-4 flex items-center justify-center gap-1" role="group" aria-label={t('menu.feedback.starsLabel')}>
          {STARS.map((value) => {
            const selected = rating >= value;
            return (
              <button
                key={value}
                type="button"
                disabled={submitting}
                aria-label={t('menu.feedback.star', { rating: value })}
                aria-pressed={selected}
                onClick={() => onRate(value)}
                className={`rounded-full p-1.5 transition-transform hover:scale-105 disabled:opacity-60 ${accent}`}
              >
                <MaterialIcon name={selected ? 'star' : 'star_border'} className="text-[32px]" />
              </button>
            );
          })}
        </div>
      ) : null}

      {phase === 'idle' && view === 'private' ? (
        <form onSubmit={onSubmitPrivate} className="mt-5 text-start">
          <p className={`text-center text-sm ${strong}`}>{t('menu.feedback.privateThanks')}</p>
          <label htmlFor={`${idPrefix}-comment`} className={`mt-3 block text-sm ${muted}`}>
            {t('menu.feedback.improve')}
          </label>
          <textarea
            id={`${idPrefix}-comment`}
            value={comment}
            onChange={(event) => onComment(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={t('menu.feedback.placeholder')}
            className={`mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none ring-1 focus:ring-2 ${
              onCard
                ? 'bg-[#f4f2ee] text-[#0d1b2a] ring-[#0d1b2a]/10 focus:ring-[#0d1b2a]'
                : 'bg-surface-container-low text-on-surface ring-outline-variant focus:ring-primary'
            }`}
          />
          <button
            type="submit"
            disabled={submitting}
            className={`mt-3 inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold transition-opacity disabled:opacity-60 ${
              onCard ? 'bg-[#0d1b2a] text-white' : 'bg-primary text-on-primary'
            }`}
          >
            {submitting ? t('menu.feedback.sending') : t('menu.feedback.send')}
          </button>
        </form>
      ) : null}

      {phase === 'positive' ? (
        <div className="mt-4">
          <p className={`text-sm ${strong}`}>{t('menu.feedback.positiveThanks')}</p>
          <p className={`mt-1 text-sm ${muted}`}>
            {reviewUrl ? t('menu.feedback.positiveGoogle') : t('menu.feedback.positiveHint')}
          </p>
          {reviewUrl ? (
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ${
                onCard ? 'bg-[#0d1b2a] text-white' : 'bg-primary text-on-primary'
              }`}
            >
              <MaterialIcon name="star" className="text-[18px]" />
              {t('menu.feedback.google')}
            </a>
          ) : null}
        </div>
      ) : null}

      {phase === 'private' ? (
        <p className={`mt-4 text-sm ${strong}`}>{t('menu.feedback.privateSent')}</p>
      ) : null}

      {submitting && view === 'positive' ? (
        <p className={`mt-3 text-sm ${muted}`}>{t('menu.feedback.sending')}</p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </>
  );
}

export default function MenuFeedback({ slug, googleReviewUrl = '', categoryId = '', productId = '' }) {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [phase, setPhase] = useState(() => (hasSent(slug) ? 'done' : 'idle'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reviewUrl, setReviewUrl] = useState(googleReviewUrl);

  useEffect(() => {
    if (googleReviewUrl) {
      setReviewUrl(googleReviewUrl);
    }
  }, [googleReviewUrl]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dismissals, setDismissals] = useState(() => readDismissals(slug));
  const [pending, setPending] = useState(false);
  const openedProduct = useRef(false);
  const view = feedbackView(rating);
  const finished = phase === 'done' || phase === 'positive' || phase === 'private' || hasSent(slug);
  const decision = feedbackPromptDecision({
    sent: finished,
    dismissals,
    pending,
    productOpen: Boolean(productId),
  });

  useEffect(() => {
    if (decision === 'show') {
      setSheetOpen(true);
      setPending(false);
    }
  }, [decision]);

  useEffect(() => {
    if (finished || dismissals >= FEEDBACK_PROMPT_LIMIT) {
      return undefined;
    }

    const timer = window.setTimeout(() => setPending(true), FEEDBACK_PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [finished, dismissals, slug]);

  useEffect(() => {
    const current = categoryId || '';
    if (!current) {
      return;
    }

    let previous = '';
    try {
      previous = sessionStorage.getItem(categoryKey(slug)) || '';
      sessionStorage.setItem(categoryKey(slug), current);
    } catch {
      previous = '';
    }

    if (previous && previous !== current) {
      setPending(true);
    }
  }, [categoryId, slug]);

  useEffect(() => {
    if (productId) {
      openedProduct.current = true;
      return;
    }

    if (openedProduct.current) {
      openedProduct.current = false;
      setPending(true);
    }
  }, [productId]);

  async function send(nextRating, nextComment) {
    setSubmitting(true);
    setError('');

    try {
      const result = await submitMenuFeedback(slug, {
        rating: nextRating,
        comment: nextComment,
      });
      markSent(slug);
      setReviewUrl(result.googleReviewUrl || '');
      setPhase(feedbackView(nextRating) === 'positive' ? 'positive' : 'private');
      setSheetOpen(true);
    } catch (err) {
      setError(getApiError(err, t, 'menu.feedback.error'));
    } finally {
      setSubmitting(false);
    }
  }

  function chooseRating(value) {
    if (submitting || finished) {
      return;
    }

    setRating(value);
    setError('');

    if (feedbackView(value) === 'positive') {
      const url = String(reviewUrl || googleReviewUrl || '').trim();

      if (shouldOpenGoogleReview(url, value)) {
        openGoogleReview(url);
      }

      send(value, '');
    }
  }

  function submitPrivate(event) {
    event.preventDefault();

    if (commentError(comment)) {
      setError(t('menu.feedback.tooLong'));
      return;
    }

    send(rating, comment);
  }

  function dismissSheet() {
    const next = dismissals + 1;
    writeDismissals(slug, next);
    setDismissals(next);
    setPending(false);
    setSheetOpen(false);
  }

  const bodyProps = {
    phase,
    rating,
    view,
    comment,
    submitting,
    error,
    reviewUrl,
    onRate: chooseRating,
    onComment: setComment,
    onSubmitPrivate: submitPrivate,
  };

  return (
    <>
      <section className="mx-auto mt-10 max-w-md border-t border-outline-variant/70 pt-8 text-center">
        <FeedbackBody idPrefix="menu-feedback" {...bodyProps} />
      </section>

      {sheetOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <section
            role="dialog"
            aria-label={t('menu.feedback.title')}
            className="mx-auto max-w-md rounded-t-3xl border border-[#0d1b2a]/10 bg-white px-5 pt-4 pb-5 text-center text-[#0d1b2a] shadow-[0_-12px_40px_rgba(13,27,42,0.28)]"
          >
            {finished ? (
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="mb-2 text-sm font-medium text-[#415a77]"
              >
                {t('menu.feedback.later')}
              </button>
            ) : (
              <button type="button" onClick={dismissSheet} className="mb-2 text-sm font-medium text-[#415a77]">
                {t('menu.feedback.later')}
              </button>
            )}
            <FeedbackBody idPrefix="sheet-feedback" tone="card" {...bodyProps} />
          </section>
        </div>
      ) : null}
    </>
  );
}
