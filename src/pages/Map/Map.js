import React, { useEffect, useState } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { SEO } from '../../components/SEO/SEO';
import {
  LoadingOverlay,
  useLoadingGate,
} from '../../components/LoadingOverlay/LoadingOverlay';
import './map.scss';

export const Map = () => {
  // The map is a heavy BlueMap (WebGL) embed that never goes network-idle,
  // which stalls a renderer's view of this otherwise-trivial page. We still
  // auto-load it (no click required), but defer *mounting* the iframe until the
  // browser is idle after first paint, so the initial render is just the page
  // chrome + spinner and settles instantly. Real users get the map a beat later
  // with no interaction.
  const [mountFrame, setMountFrame] = useState(false);
  // Once mounted, the iframe loads behind the spinner (opacity 0); the spinner
  // stays up until it fires onLoad AND a minimum 1s has passed.
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const showSpinner = useLoadingGate(iframeLoaded, { minMs: 1000 });

  useEffect(() => {
    // Skip during the react-snap prerender so the baked-in HTML ships WITHOUT
    // the iframe. That's what makes a direct load of /map/ (how crawlers hit it)
    // paint a clean, instantly-settling page; the iframe is added on the client.
    if (navigator.userAgent.includes('ReactSnap')) return undefined;
    // requestIdleCallback runs after the browser finishes first-paint work; the
    // { timeout } guarantees it still fires if the page stays busy. Fall back to
    // a short timer where it's unsupported (older Safari).
    const schedule =
      window.requestIdleCallback || ((cb) => window.setTimeout(cb, 250));
    const cancel = window.cancelIdleCallback || window.clearTimeout;
    const handle = schedule(() => setMountFrame(true), { timeout: 2000 });
    return () => cancel(handle);
  }, []);

  return (
    <div className="App MapPage">
      <SEO
        title="World Map"
        description="Explore Faceland's live interactive world map! Discover quest zones, outposts, dungeons, and points of interest across our free-to-play Minecraft MMORPG."
      />
      <HeaderBar fancy={false} />
      {/* aria-label gives this a named "region" landmark; the iframe's own
          title is its accessible name. Both live here in the body on purpose —
          not as anything added to the document <head>. */}
      <section className="mapSection" aria-label="Interactive world map">
        {/* Visible poster + copy that sits behind the map. It's baked into the
            prerender, so /map/ ships real, indexable content and gives people a
            preview (and how-to hint) while BlueMap spins up. The iframe fades in
            on top of it once ready; the spinner is transparent so this stays
            visible during load rather than being hidden behind an overlay. */}
        <div className="mapPlaceholder">
          <img
            src="/assets/stupid_map.webp"
            alt="Preview of Faceland's live 3D world map"
            className="mapPlaceholder__img"
            width="980"
            height="629"
          />
          <div className="mapPlaceholder__caption">
            <p className="mapPlaceholder__hint">Scroll To Zoom!</p>
            <p className="mapPlaceholder__desc">
              Explore Faceland&apos;s world in a live, fully 3D map powered by
              BlueMap &mdash; pan and rotate the camera, zoom from a
              continent-wide view down to individual builds, and switch between
              3D perspective, flat top-down, and free-fly views. Track quest
              zones, towns, outposts, dungeons, and points of interest across the
              server.
            </p>
          </div>
        </div>
        {showSpinner && <LoadingOverlay background="transparent" />}
        {mountFrame && (
          <iframe
            className="mapFrame"
            style={{ opacity: showSpinner ? 0 : 1 }}
            src="https://map.face.land/#quest_world:-132:0:1253:2692:0:0:0:0:perspective"
            title="Faceland Interactive World Map"
            loading="lazy"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
          />
        )}
      </section>
    </div>
  );
};
