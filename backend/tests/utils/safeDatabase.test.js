import { databaseNameFromUrl, isSafeTestDatabaseUrl } from '../safeDatabase.js';

describe('safeDatabase', () => {
  test('extracts the database name from a postgres URL', () => {
    expect(databaseNameFromUrl('postgresql://u:p@localhost:5432/scan_test')).toBe('scan_test');
    expect(databaseNameFromUrl('postgresql://u:p@host/neondb?sslmode=require')).toBe('neondb');
  });

  test('only names ending with _test (or exactly test) are safe to wipe', () => {
    expect(isSafeTestDatabaseUrl('postgresql://u:p@localhost:5432/scan_test')).toBe(true);
    expect(isSafeTestDatabaseUrl('postgresql://u:p@localhost:5432/test')).toBe(true);
    expect(isSafeTestDatabaseUrl('postgresql://u:p@localhost:5432/scanosh')).toBe(false);
    expect(isSafeTestDatabaseUrl('postgresql://u:p@ep-x.neon.tech/neondb')).toBe(false);
    expect(isSafeTestDatabaseUrl('')).toBe(false);
  });
});
