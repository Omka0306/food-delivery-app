module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/seed/**',
    '!src/scripts/**',
    '!src/app.js',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThresholds: {
    global: {
      lines: 50,
      statements: 50,
      functions: 45,
      branches: 40,
    },
  },
  testTimeout: 15000,
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js'],
  forceExit: true,
};
