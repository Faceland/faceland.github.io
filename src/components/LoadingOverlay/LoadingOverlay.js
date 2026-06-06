import React, { useEffect, useState } from 'react';
import './loadingOverlay.scss';

/**
 * Full-area spinner. Render it as a child of a `position: relative` container
 * (it absolutely fills that container) while the real feature loads behind it.
 * Pass `background` to blend with the host page.
 */
export const LoadingOverlay = ({ label, background }) => (
  <div
    className="loadingOverlay"
    style={background ? { background } : undefined}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="loadingOverlay__spinner" />
    {label ? <div className="loadingOverlay__label">{label}</div> : null}
  </div>
);

/**
 * Keeps a feature hidden behind a spinner until BOTH:
 *   - the real content reports `ready`, and
 *   - a minimum spinner duration has elapsed (so it never flashes by).
 * `maxMs` is a safety cap that reveals the feature even if `ready` never fires.
 * Returns `showSpinner`.
 */
export const useLoadingGate = (ready, { minMs = 1000, maxMs = 12000 } = {}) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const minTimer = setTimeout(() => setMinElapsed(true), minMs);
    const maxTimer = setTimeout(() => setForced(true), maxMs);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [minMs, maxMs]);

  return !(forced || (ready && minElapsed));
};
