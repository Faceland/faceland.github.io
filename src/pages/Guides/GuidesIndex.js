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
