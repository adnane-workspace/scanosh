import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LocaleProvider } from './context/LocaleContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { primePublicMenuFromLocation } from './hooks/usePublicMenu.js';
import './index.css';

primePublicMenuFromLocation();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
