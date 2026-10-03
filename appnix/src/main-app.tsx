import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DeviceFrame } from './components/DeviceFrame';
import './index.css';

// Entrypoint exclusivo do APP (Capacitor/Android): sem landing page nem rotas de site.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceFrame isEmbedded={false} />
  </StrictMode>,
);
