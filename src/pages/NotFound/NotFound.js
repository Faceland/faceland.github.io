import React from 'react';
import { Link } from 'react-router-dom';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';
import { SEO } from '../../components/SEO/SEO';
import './notFound.scss';

// Rendered by the catch-all `*` route. react-snap pre-renders this into the
// build's 404.html, which GitHub Pages serves (with a real 404 status) for any
// unknown URL. It is marked noindex so search engines don't index "not found"
// responses as thin/duplicate pages.
export const NotFound = () => {
  return (
    <div className="App">
      <SEO
        title="Page Not Found"
        description="The page you were looking for could not be found on Faceland, the free-to-play Minecraft MMORPG."
        noindex
      />
      <HeaderBar fancy={false} />
      <div
        className="notFoundPage pixelImage"
        style={{
          backgroundImage: 'url(/assets/textures/blackstone.png)',
          backgroundSize: 64,
        }}
      >
        <div className="notFoundInner">
          <h1 className="notFoundCode">404</h1>
          <p className="notFoundText">This page wandered off the map.</p>
          <Link to="/" className="notFoundButton">
            Return Home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};
