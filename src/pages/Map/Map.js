import React, { useState } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { SEO } from '../../components/SEO/SEO';
import {
  LoadingOverlay,
  useLoadingGate,
} from '../../components/LoadingOverlay/LoadingOverlay';
import './map.scss';

export const Map = () => {
  // The iframe loads in the background (opacity 0); the spinner stays up until
  // the iframe fires onLoad AND a minimum 1s has passed, so the map is only
  // revealed once it's actually ready.
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const showSpinner = useLoadingGate(iframeLoaded, { minMs: 1000 });

  return (
    <div className="App MapPage">
      <SEO
        title="World Map"
        description="Explore Faceland's live interactive world map! Discover quest zones, outposts, dungeons, and points of interest across our free-to-play Minecraft MMORPG."
      />
      <HeaderBar fancy={false} />
      <section className="mapSection">
        {showSpinner && (
          <LoadingOverlay label="Loading map…" background="#1f1f1f" />
        )}
        <iframe
          className="mapFrame"
          style={{ opacity: showSpinner ? 0 : 1 }}
          src="https://map.face.land/#quest_world:-132:0:1253:2692:0:0:0:0:perspective"
          title="Faceland Interactive World Map"
          allowFullScreen
          onLoad={() => setIframeLoaded(true)}
        />
      </section>
    </div>
  );
};
