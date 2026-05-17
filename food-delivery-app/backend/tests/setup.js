// Global test setup — runs before every test file

// Extend Jest timeout for integration-style tests
jest.setTimeout(15000);

// Silence verbose console output in tests unless explicitly needed
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    // Suppress AWS SDK retry warnings in test output
    if (args[0] && String(args[0]).includes('retry')) return;
    originalWarn(...args);
  };
  console.error = (...args) => {
    // Suppress expected error logs from error-handling tests
    if (args[0] && String(args[0]).startsWith('[AI ')) return;
    originalError(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
