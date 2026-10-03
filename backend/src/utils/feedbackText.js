const MAX_COMMENT_LENGTH = 1000;

export function sanitizeFeedbackComment(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

export function assertCommentLength(value) {
  return String(value || '').length <= MAX_COMMENT_LENGTH;
}

export { MAX_COMMENT_LENGTH };
