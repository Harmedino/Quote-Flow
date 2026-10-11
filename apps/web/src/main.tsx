// Self-hosted fonts, no third-party request. Archivo's `wdth` build carries both the width and the
// weight axis (the wide, heavy headings); IBM Plex Mono sets labels, numbers and amounts. Both have ₦.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { AppProviders } from './app/providers';
import { createAppRouter } from './app/router';
import { installSession } from './features/auth/session';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html');
}

installSession();
const router = createAppRouter();

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
