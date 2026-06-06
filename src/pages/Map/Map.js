import React from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { SEO } from '../../components/SEO/SEO';
import './map.scss';

export const Map = () => {
  return (
    <div className="App MapPage">
      <SEO
        title="World Map"
        description="Explore Faceland's live interactive world map! Discover quest zones, outposts, dungeons, and points of interest across our free-to-play Minecraft MMORPG."
      />
      <HeaderBar fancy={false} />
      <section className="mapSection">
        <iframe
          className="mapFrame"
          src="https://map.face.land/#quest_world:-132:0:1253:2692:0:0:0:0:perspective"
          title="Faceland Interactive World Map"
          allowFullScreen
        />
      </section>
    </div>
  );
};
