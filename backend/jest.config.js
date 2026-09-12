export default {
  testEnvironment: 'node',
  transform: {},
  verbose: true,
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      transform: {},
      testMatch: ['<rootDir>/tests/utils/**/*.test.js'],
    },
    {
      displayName: 'db',
      testEnvironment: 'node',
      transform: {},
      testMatch: [
        '<rootDir>/tests/models/**/*.test.js',
        '<rootDir>/tests/routes/**/*.test.js',
        '<rootDir>/tests/services/**/*.test.js',
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.db.js'],
    },
  ],
};
