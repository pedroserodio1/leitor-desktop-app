
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'
import React from 'react';
import { ReaderAdapterProvider } from './reader/ReaderAdapterProvider';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReaderAdapterProvider>
      <App />
    </ReaderAdapterProvider>
  </React.StrictMode>
);
