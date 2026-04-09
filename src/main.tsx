import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress known lottie-web bug: destroy() called on elements that lack the method
// https://github.com/airbnb/lottie-web/issues/2198
function isLottieDestroyError(value: unknown): boolean {
  if (!value) return false;
  const msg = value instanceof Error ? value.message : String(value);
  return msg.includes('destroy is not a function');
}

const _consoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (args.some(isLottieDestroyError)) return;
  _consoleError(...args);
};

window.addEventListener('error', (e) => {
  if (isLottieDestroyError(e.message) || isLottieDestroyError(e.error)) {
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (isLottieDestroyError(e.reason)) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
