import React from 'react';
import { Outlet } from 'react-router-dom';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';
import { DiscordWidget } from '../../components/DiscordWidget/DiscordWidget';

// NOTE: SEO is intentionally NOT set here. The page title/description are set by
// the routed child (GuidesIndex for /guides, GuideContent for each /guides/<x>).
// A <SEO> here would run its effect AFTER the child's on mount and overwrite
// every guide's title with a generic "Guides", which is what react-snap captures.
export const GuidesLayout = () => {
  return (
    <div className="App">
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
