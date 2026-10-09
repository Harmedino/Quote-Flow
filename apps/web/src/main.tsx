// Self-hosted variable fonts: no third-party request.
import '@fontsource-variable/geist';
import '@fontsource-variable/bricolage-grotesque';
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
