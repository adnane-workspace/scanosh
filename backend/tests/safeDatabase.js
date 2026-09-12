/**
 * Jest may only wipe a database whose name is clearly a test DB
 * (…_test) so a shared DATABASE_URL never loses café data again.
 */

export function databaseNameFromUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    return decodeURIComponent(parsed.pathname.replace(/^\//, '').split('/')[0] || '');
  } catch {
    const match = raw.match(/\/([^/?]+)(?:\?|$)/);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }
}

export function isSafeTestDatabaseUrl(url) {
  const name = databaseNameFromUrl(url).toLowerCase();
  if (!name) return false;
  return name === 'test' || name.endsWith('_test');
}

export function assertSafeTestDatabase(url) {
  if (isSafeTestDatabaseUrl(url)) {
    return databaseNameFromUrl(url);
  }

  const name = databaseNameFromUrl(url) || '(unknown)';
  throw new Error(
    [
      `Refusing to reset database "${name}".`,
      'Jest wipes tables and must not use your dev/prod DATABASE_URL.',
      'Create an empty Postgres database (e.g. scan_test), then set in backend/.env:',
      '  TEST_DATABASE_URL=postgresql://USER:PASS@localhost:5432/scan_test',
      'Run migrations on that URL once: $env:TEST_DATABASE_URL=...; npm run db:migrate -w backend',
    ].join('\n'),
  );
}
