import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { flattenZodFieldErrors } from './zodErrors.js';

test('flattenZodFieldErrors maps nested body fields', () => {
  const schema = z.object({
    body: z.object({
      email: z.string().email(),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    }),
  });
  const result = schema.safeParse({ body: { email: 'nope', slug: 'Bad Slug' } });
  assert.equal(result.success, false);
  const details = flattenZodFieldErrors(result.error);
  assert.ok(details.fieldErrors.email?.length);
  assert.ok(details.fieldErrors.slug?.length);
});
