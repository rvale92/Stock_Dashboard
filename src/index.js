import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/App.css';
import App from './App';
import { DarkModeProvider } from './contexts/DarkModeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </React.StrictMode>
);

// Hard-disable Service Workers & purge old caches at runtime
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Unregister any previously registered SW (old CRA builds)
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  }).catch(() => {});
  // Clear all named caches created by old SWs
  if (window.caches && caches.keys) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
  }
}
