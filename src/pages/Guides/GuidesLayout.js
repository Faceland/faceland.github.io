import React from 'react';
import { Outlet } from 'react-router-dom';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';
import { DiscordWidget } from '../../components/DiscordWidget/DiscordWidget';
import { SEO } from '../../components/SEO/SEO';

export const GuidesLayout = () => {
  return (
    <div className="App">
      <SEO
        title="Guides"
        description="Faceland guides for skills, stats, and more. Learn how to master the Minecraft MMORPG!"
      />
      <HeaderBar fancy={false} />
      <div
        className="basicPage pixelImage"
        style={{
          marginTop: '50px',
          backgroundImage: 'url(/assets/textures/blackstone.png)',
          backgroundSize: 64,
          minHeight: '76vh',
        }}
      >
        <Outlet />
      </div>
      <DiscordWidget />
      <Footer />
    </div>
  );
};
