import '@testing-library/jest-dom';

// Mock environment variables
const mockEnv = {
  VITE_STORE_ID: '1',
  VITE_LOGO_URL: 'https://placeholder.com/logo.png',
  VITE_API_URL: 'https://api.example.com'
};

// Set up global import.meta.env for testing
// @ts-ignore - we're intentionally mocking this for tests
globalThis.import = {
  meta: {
    env: mockEnv
  }
};