import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LandingPage } from './site/LandingPage';
import './index.css';

// Entrypoint WEB: landing page com o app embutido em um DeviceFrame (PWA no mobile).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
);
