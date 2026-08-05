import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { GUIDES } from './guidesData';
import './guides.scss';

export const GuidesIndex = () => {
  return (
    <>
      <SEO
        title="Guides"
        description="Browse Faceland's complete guide library — stats, skills, professions, dungeons, guilds, and more for our free-to-play Minecraft MMORPG."
      />
      <div className="guidesIntro">
        <nav className="guideBreadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="guideBreadcrumbSep">/</span>
          <span className="guideBreadcrumbCurrent">Guides</span>
        </nav>
        <h1 className="guidesHeading">Faceland Guides</h1>
        <p className="guidesIntroText">
          Everything you need to master Faceland, the free-to-play Minecraft
          MMORPG. These in-depth guides cover character stats, combat abilities,
          equipment and upgrades, gathering and crafting professions, dungeons,
          guild warfare, PvP arenas, and much more. Whether you're a brand-new
          adventurer or a seasoned veteran min-maxing your build, pick a guide
          below and start your adventure.
        </p>
      </div>
      <div className="guidesGrid">
        {GUIDES.map((guide) => (
          <Link key={guide.name} to={`/guides/${guide.path}/`} className="guidePanel">
            <div
              className="guidePanelSquare"
              style={{
                '--panel-border': guide.border,
                '--panel-accent': guide.accent,
                background: `linear-gradient(180deg, ${guide.top} 0%, ${guide.mid} 50%, ${guide.bot} 100%)`,
              }}
            />
            <span className="guidePanelLabel">{guide.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
};
