import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  commentError,
  deltaTone,
  distributionPercents,
  feedbackPromptDecision,
  feedbackView,
  satisfactionDelta,
  shouldOpenGoogleReview,
  satisfactionRate,
} from './feedback.js';

test('feedbackView opens Google for 4–5 and a private form for 1–3', () => {
  assert.equal(feedbackView(5), 'positive');
  assert.equal(feedbackView(4), 'positive');
  assert.equal(feedbackView(3), 'private');
  assert.equal(feedbackView(2), 'private');
  assert.equal(feedbackView(1), 'private');
  assert.equal(feedbackView(0), 'idle');
  assert.equal(feedbackView(null), 'idle');
});

test('shouldOpenGoogleReview only for a saved Google link and a 4–5 rating', () => {
  assert.equal(shouldOpenGoogleReview('https://g.page/r/abc/review', 5), true);
  assert.equal(shouldOpenGoogleReview('https://g.page/r/abc/review', 4), true);
  assert.equal(shouldOpenGoogleReview('https://g.page/r/abc/review', 3), false);
  assert.equal(shouldOpenGoogleReview('', 5), false);
  assert.equal(shouldOpenGoogleReview('   ', 5), false);
});

test('commentError rejects comments longer than 1000 characters', () => {
  assert.equal(commentError('Service un peu lent'), '');
  assert.equal(commentError(''), '');
  assert.equal(commentError('a'.repeat(1001)), 'too_long');
});

test('satisfactionRate and delta match the dashboard formula', () => {
  assert.equal(satisfactionRate(82, 100), 82);
  assert.equal(satisfactionRate(0, 0), 0);
  assert.equal(satisfactionDelta(94, 87.8), 6.2);
  assert.equal(deltaTone(6.2), 'up');
  assert.equal(deltaTone(-1), 'down');
  assert.equal(deltaTone(0), 'flat');
});

test('feedbackPromptDecision waits for a real visit and allows one reminder', () => {
  assert.equal(feedbackPromptDecision({ sent: false, dismissals: 0, pending: false, productOpen: false }), 'wait');
  assert.equal(feedbackPromptDecision({ sent: false, dismissals: 0, pending: true, productOpen: true }), 'hold');
  assert.equal(feedbackPromptDecision({ sent: false, dismissals: 0, pending: true, productOpen: false }), 'show');
  assert.equal(feedbackPromptDecision({ sent: false, dismissals: 1, pending: true, productOpen: false }), 'show');
  assert.equal(feedbackPromptDecision({ sent: false, dismissals: 2, pending: true, productOpen: false }), 'wait');
  assert.equal(feedbackPromptDecision({ sent: true, dismissals: 0, pending: true, productOpen: false }), 'wait');
});

test('distributionPercents turns rating counts into bar widths', () => {
  assert.deepEqual(distributionPercents([82, 12, 4, 1, 1]), [82, 12, 4, 1, 1]);
  assert.deepEqual(distributionPercents([0, 0, 0, 0, 0]), [0, 0, 0, 0, 0]);
});
