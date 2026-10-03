import { assertCommentLength, sanitizeFeedbackComment } from '../../src/utils/feedbackText.js';

describe('feedback text', () => {
  test('strips tags and keeps the readable comment', () => {
    expect(sanitizeFeedbackComment('  <b>Le café</b> était bon  ')).toBe('Le café était bon');
    expect(sanitizeFeedbackComment('<script>alert(1)</script>attente')).toBe('alert(1)attente');
  });

  test('rejects comments over 1000 characters', () => {
    expect(assertCommentLength('a'.repeat(1000))).toBe(true);
    expect(assertCommentLength('a'.repeat(1001))).toBe(false);
  });
});
