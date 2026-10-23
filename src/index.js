import React, { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App, { preloadDJ } from './App';
import { ThemeProvider } from '@material-tailwind/react';

const rootElement = document.getElementById('root');

const app = (
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);

const start = () => {
  // If the page was pre-rendered by react-snap, hydrate instead of render
  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app);
  } else {
    createRoot(rootElement).render(app);
  }
};

// The DJ room's code is a separate download. A pre-rendered /dj keeps
// showing its static HTML until that code is in, then hydrates; starting
// sooner would swap the page for a loading placeholder first.
if (rootElement.hasChildNodes() && /^\/dj\/?$/.test(window.location.pathname)) {
  preloadDJ().then(start, start);
} else {
  start();
}
