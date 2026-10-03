export const FEEDBACK_PERIODS = ['today', '7d', '30d', '90d'];
export const MAX_FEEDBACK_COMMENT = 1000;
export const FEEDBACK_PROMPT_DELAY_MS = 20000;
export const FEEDBACK_PROMPT_LIMIT = 2;

export function feedbackPromptDecision({ sent, dismissals, pending, productOpen }) {
  if (sent || Number(dismissals) >= FEEDBACK_PROMPT_LIMIT || !pending) {
    return 'wait';
  }

  if (productOpen) {
    return 'hold';
  }

  return 'show';
}

export function shouldOpenGoogleReview(url, rating) {
  return feedbackView(rating) === 'positive' && Boolean(String(url || '').trim());
}

export function feedbackView(rating) {
  const value = Number(rating);

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return 'idle';
  }

  if (value >= 4) {
    return 'positive';
  }

  return 'private';
}

export function commentError(comment) {
  if (String(comment || '').length > MAX_FEEDBACK_COMMENT) {
    return 'too_long';
  }

  return '';
}

export function satisfactionRate(positive, total) {
  const safeTotal = Number(total) || 0;

  if (safeTotal <= 0) {
    return 0;
  }

  return Math.round((Number(positive) / safeTotal) * 1000) / 10;
}

export function satisfactionDelta(current, previous) {
  return Math.round((Number(current) - Number(previous)) * 10) / 10;
}

export function deltaTone(delta) {
  if (delta > 0) {
    return 'up';
  }

  if (delta < 0) {
    return 'down';
  }

  return 'flat';
}

export function distributionPercents(counts) {
  const values = Array.isArray(counts) ? counts.map((count) => Number(count) || 0) : [];
  const total = values.reduce((sum, count) => sum + count, 0);

  return values.map((count) => (total ? Math.round((count / total) * 100) : 0));
}
