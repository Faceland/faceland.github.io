import React from 'react';
import { Link } from 'react-router-dom';
import './guides.scss';

const guides = [
  { name: 'Stats',       path: 'stats',       top: '#e05050', mid: '#c43838', bot: '#a82828', border: '#5a1a1a', accent: '#ff8866' },
  { name: 'Abilities',   path: 'abilities',   top: '#5080e0', mid: '#3868c4', bot: '#2850a8', border: '#1a2a5a', accent: '#66aaff' },
  { name: 'Equipment',   path: 'equipment',   top: '#e08840', mid: '#c47030', bot: '#a85820', border: '#5a3010', accent: '#ffaa66' },
  { name: 'Upgrades',    path: 'upgrades',    top: '#40c060', mid: '#30a848', bot: '#208838', border: '#104a1a', accent: '#66ff88' },
  { name: 'Mining',      path: 'mining',      top: '#a08040', mid: '#887030', bot: '#705820', border: '#3a2a10', accent: '#c0a060' },
  { name: 'Gathering',   path: 'gathering',   top: '#60a840', mid: '#488830', bot: '#387020', border: '#1a4010', accent: '#88cc66' },
  { name: 'Fishing',     path: 'fishing',     top: '#40b8d8', mid: '#30a0c0', bot: '#2088a8', border: '#104050', accent: '#66ddff' },
  { name: 'Crafting',    path: 'crafting',    top: '#d0a030', mid: '#b88820', bot: '#a07018', border: '#504010', accent: '#f0c060' },
  { name: 'Enchanting',  path: 'enchanting',  top: '#a050e0', mid: '#8838c4', bot: '#7028a8', border: '#381a5a', accent: '#cc88ff' },
  { name: 'Alchemy',     path: 'alchemy',     top: '#d050a0', mid: '#b83888', bot: '#a02870', border: '#501838', accent: '#ff88cc' },
  { name: 'Cooking',     path: 'cooking',     top: '#c86030', mid: '#b04820', bot: '#983818', border: '#482010', accent: '#e88860' },
  { name: 'Agility',     path: 'agility',     top: '#88c830', mid: '#70b020', bot: '#589818', border: '#2a4810', accent: '#aaee55' },
  { name: 'Loremaster',  path: 'loremaster',  top: '#30b0a8', mid: '#209888', bot: '#188070', border: '#104038', accent: '#66ddcc' },
  { name: 'Trading',     path: 'trading',     top: '#c8b030', mid: '#b09820', bot: '#988018', border: '#484010', accent: '#eedd55' },
  { name: 'Prayer',      path: 'prayer',      top: '#8898c0', mid: '#7080a8', bot: '#586890', border: '#303848', accent: '#aabbdd' },
  { name: 'Sneak',       path: 'sneak',       top: '#606878', mid: '#505868', bot: '#404850', border: '#282830', accent: '#8890a0' },
  { name: 'Questing',    path: 'questing',    top: '#d8c830', mid: '#c0b020', bot: '#a89818', border: '#504810', accent: '#fff066' },
  { name: 'Houses',      path: 'houses',      top: '#a88050', mid: '#907040', bot: '#786030', border: '#3a3018', accent: '#c8a870' },
  { name: 'Mounts',      path: 'mounts',      top: '#60a0d8', mid: '#4888c0', bot: '#3870a8', border: '#1a3850', accent: '#88ccff' },
  { name: 'Pets',        path: 'pets',        top: '#e06888', mid: '#c85070', bot: '#b03858', border: '#502030', accent: '#ff99bb' },
  { name: 'Guilds',      path: 'guilds',      top: '#5060c8', mid: '#3848b0', bot: '#283898', border: '#181a50', accent: '#8088ee' },
  { name: 'Outposts',    path: 'outposts',    top: '#708830', mid: '#607020', bot: '#506018', border: '#283010', accent: '#99aa55' },
  { name: 'Dungeons',    path: 'dungeons',    top: '#903030', mid: '#782828', bot: '#602020', border: '#301010', accent: '#bb5555' },
  { name: 'Arenas',      path: 'arenas',      top: '#d04830', mid: '#b83820', bot: '#a02818', border: '#501810', accent: '#ff7755' },
];

export const GuidesIndex = () => {
  return (
    <div className="guidesGrid">
      {guides.map((guide) => (
        <Link key={guide.name} to={guide.path} className="guidePanel">
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
  );
};
