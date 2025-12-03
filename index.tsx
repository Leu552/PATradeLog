import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error handler to catch and display startup errors (e.g., dependency issues)
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 24px; color: #ef4444; font-family: system-ui, sans-serif; text-align: center; margin-top: 50px;">
        <h2 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 12px;">应用启动失败</h2>
        <p style="color: #374151; margin-bottom: 12px;">App Failed to Load</p>
        <pre style="background: #fef2f2; padding: 12px; border-radius: 8px; font-size: 0.75rem; overflow-x: auto; text-align: left; border: 1px solid #fee2e2;">${message}</pre>
        <button onclick="window.location.reload(true)" style="margin-top: 24px; padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: bold;">
          点击刷新重试
        </button>
      </div>
    `;
  }
};

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  console.error("React Mount Error:", e);
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}