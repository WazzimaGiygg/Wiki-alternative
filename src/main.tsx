import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import { ExtensionManager } from './core/ExtensionManager';
import './index.css';
import './print.css';

// Inicializa o carregamento dinâmico das extensões do WikiZero
ExtensionManager.getInstance().loadExtensionsFromGlob().catch((err) => {
  console.error('[WikiZero] Falha ao carregar extensões:', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
