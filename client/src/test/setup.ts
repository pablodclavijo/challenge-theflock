import '@testing-library/jest-dom';

// Stub localStorage (jsdom provides it, but reset between tests)
beforeEach(() => {
  localStorage.clear();
});
