// Single source of truth for the guide pages.
//
// Consumed by:
//   - GuidesIndex.js  -> renders the guide grid
//   - GuideContent.js -> renders each guide's per-page SEO (title/description)
//
// Each guide's page title is derived as `${name} Guide`. Descriptions are unique
// per page so Google does not see them as duplicates.
//
// To add a guide: add an entry here, drop a matching `public/guides/<path>.txt`,
// add its <Route> in App.js, and add `/guides/<path>` to reactSnap.include in
// package.json (the sitemap is generated from that include list automatically).

export const GUIDES = [
  {
    name: 'Stats',
    path: 'stats',
    top: '#e05050', mid: '#c43838', bot: '#a82828', border: '#5a1a1a', accent: '#ff8866',
    description:
      'Master character stats in Faceland. Learn how Strength, Dexterity, Intelligence, Vitality, and Endurance shape your build in this Minecraft MMORPG.',
  },
  {
    name: 'Abilities',
    path: 'abilities',
    top: '#5080e0', mid: '#3868c4', bot: '#2850a8', border: '#1a2a5a', accent: '#66aaff',
    description:
      'Unleash powerful class abilities in Faceland. Learn how to unlock, upgrade, and customize your combat skills in this free Minecraft MMORPG.',
  },
  {
    name: 'Equipment',
    path: 'equipment',
    top: '#e08840', mid: '#c47030', bot: '#a85820', border: '#5a3010', accent: '#ffaa66',
    description:
      'Gear up in Faceland. Learn how equipment, rarities, and stat bonuses drive character progression and survivability in this Minecraft MMORPG.',
  },
  {
    name: 'Upgrades',
    path: 'upgrades',
    top: '#40c060', mid: '#30a848', bot: '#208838', border: '#104a1a', accent: '#66ff88',
    description:
      'Push your gear beyond its limits with Faceland’s upgrade system. Learn how to enhance and empower your equipment in this Minecraft MMORPG.',
  },
  {
    name: 'Mining',
    path: 'mining',
    top: '#a08040', mid: '#887030', bot: '#705820', border: '#3a2a10', accent: '#c0a060',
    description:
      'Dig deep and mine valuable ore in Faceland. Learn the mining profession, ore veins, and materials used for crafting in this Minecraft MMORPG.',
  },
  {
    name: 'Gathering',
    path: 'gathering',
    top: '#60a840', mid: '#488830', bot: '#387020', border: '#1a4010', accent: '#88cc66',
    description:
      'Forage herbs, flowers, and reagents in Faceland. Learn the gathering skill that fuels alchemy and cooking recipes in this Minecraft MMORPG.',
  },
  {
    name: 'Fishing',
    path: 'fishing',
    top: '#40b8d8', mid: '#30a0c0', bot: '#2088a8', border: '#104050', accent: '#66ddff',
    description:
      'Cast your line and reel in rare catches in Faceland. Learn the fishing profession for food buffs and profit in this free Minecraft MMORPG.',
  },
  {
    name: 'Crafting',
    path: 'crafting',
    top: '#d0a030', mid: '#b88820', bot: '#a07018', border: '#504010', accent: '#f0c060',
    description:
      'Turn gathered and mined materials into powerful gear in Faceland. Learn the crafting system that ties every profession together in this Minecraft MMORPG.',
  },
  {
    name: 'Enchanting',
    path: 'enchanting',
    top: '#a050e0', mid: '#8838c4', bot: '#7028a8', border: '#381a5a', accent: '#cc88ff',
    description:
      'Infuse your gear with arcane power in Faceland. Learn enchanting for bonus stats, special effects, and elemental damage in this Minecraft MMORPG.',
  },
  {
    name: 'Alchemy',
    path: 'alchemy',
    top: '#d050a0', mid: '#b83888', bot: '#a02870', border: '#501838', accent: '#ff88cc',
    description:
      'Brew powerful potions in Faceland. Learn alchemy to craft healing draughts and combat elixirs from gathered reagents in this Minecraft MMORPG.',
  },
  {
    name: 'Cooking',
    path: 'cooking',
    top: '#c86030', mid: '#b04820', bot: '#983818', border: '#482010', accent: '#e88860',
    description:
      'Cook hearty meals for lasting stat buffs in Faceland. Learn the cooking skill to fuel your dungeon runs and adventures in this Minecraft MMORPG.',
  },
  {
    name: 'Agility',
    path: 'agility',
    top: '#88c830', mid: '#70b020', bot: '#589818', border: '#2a4810', accent: '#aaee55',
    description:
      'Train agility through parkour and obstacle courses in Faceland. Earn permanent movement bonuses and unlock hidden shortcuts in this Minecraft MMORPG.',
  },
  {
    name: 'Loremaster',
    path: 'loremaster',
    top: '#30b0a8', mid: '#209888', bot: '#188070', border: '#104038', accent: '#66ddcc',
    description:
      'Become a Loremaster in Faceland. Uncover hidden history, creatures, and secrets for tangible rewards in this free-to-play Minecraft MMORPG.',
  },
  {
    name: 'Trading',
    path: 'trading',
    top: '#c8b030', mid: '#b09820', bot: '#988018', border: '#484010', accent: '#eedd55',
    description:
      'Master the marketplace in Faceland. Learn the trading system to sell loot and materials and build your fortune in this Minecraft MMORPG.',
  },
  {
    name: 'Prayer',
    path: 'prayer',
    top: '#8898c0', mid: '#7080a8', bot: '#586890', border: '#303848', accent: '#aabbdd',
    description:
      'Channel divine blessings with Prayer in Faceland. Learn to earn boons and protective effects at shrines in this free Minecraft MMORPG.',
  },
  {
    name: 'Sneak',
    path: 'sneak',
    top: '#606878', mid: '#505868', bot: '#404850', border: '#282830', accent: '#8890a0',
    description:
      'Move unseen with the Sneak skill in Faceland. Learn stealth to avoid detection and land devastating surprise attacks in this Minecraft MMORPG.',
  },
  {
    name: 'Questing',
    path: 'questing',
    top: '#d8c830', mid: '#c0b020', bot: '#a89818', border: '#504810', accent: '#fff066',
    description:
      'Embark on epic quests in Faceland. Explore the world, earn valuable rewards, and uncover the deep lore of this free-to-play Minecraft MMORPG.',
  },
  {
    name: 'Houses',
    path: 'houses',
    top: '#a88050', mid: '#907040', bot: '#786030', border: '#3a3018', accent: '#c8a870',
    description:
      'Build and customize player housing in Faceland. Learn to upgrade your home with crafting stations, storage, and decor in this Minecraft MMORPG.',
  },
  {
    name: 'Mounts',
    path: 'mounts',
    top: '#60a0d8', mid: '#4888c0', bot: '#3870a8', border: '#1a3850', accent: '#88ccff',
    description:
      'Ride mounts and travel at incredible speed in Faceland. Learn how to collect horses and exotic creatures in this free Minecraft MMORPG.',
  },
  {
    name: 'Pets',
    path: 'pets',
    top: '#e06888', mid: '#c85070', bot: '#b03858', border: '#502030', accent: '#ff99bb',
    description:
      'Adopt loyal pets that fight beside you in Faceland. Learn to collect and raise companions for combat help and bonuses in this Minecraft MMORPG.',
  },
  {
    name: 'Guilds',
    path: 'guilds',
    top: '#5060c8', mid: '#3848b0', bot: '#283898', border: '#181a50', accent: '#8088ee',
    description:
      'Join or build a guild in Faceland. Learn how guilds unlock shared resources, group content, and outpost warfare in this Minecraft MMORPG.',
  },
  {
    name: 'Outposts',
    path: 'outposts',
    top: '#708830', mid: '#607020', bot: '#506018', border: '#283010', accent: '#99aa55',
    description:
      'Capture and defend outposts in Faceland. Learn how guilds fight for territory, resource bonuses, and bragging rights in this Minecraft MMORPG.',
  },
  {
    name: 'Dungeons',
    path: 'dungeons',
    top: '#903030', mid: '#782828', bot: '#602020', border: '#301010', accent: '#bb5555',
    description:
      'Conquer instanced dungeons in Faceland. Learn how to beat traps, bosses, and earn elite PvE loot with your group in this Minecraft MMORPG.',
  },
  {
    name: 'Arenas',
    path: 'arenas',
    top: '#d04830', mid: '#b83820', bot: '#a02818', border: '#501810', accent: '#ff7755',
    description:
      'Battle other players in Faceland’s PvP arenas. Learn how duels, team fights, and ranked rewards work in this free Minecraft MMORPG.',
  },
];

// Related-guide cross-links. Each guide points to a few thematically related
// guides, rendered as contextual internal links at the bottom of its page. This
// is the internal-linking layer that ties the guide cluster together for SEO and
// keeps players moving between related topics. Keyed by `path`.
export const RELATED = {
  stats: ['abilities', 'equipment', 'upgrades'],
  abilities: ['stats', 'equipment', 'dungeons'],
  equipment: ['upgrades', 'enchanting', 'crafting'],
  upgrades: ['equipment', 'enchanting', 'crafting'],
  mining: ['crafting', 'gathering', 'trading'],
  gathering: ['alchemy', 'cooking', 'mining'],
  fishing: ['cooking', 'gathering', 'trading'],
  crafting: ['mining', 'equipment', 'trading'],
  enchanting: ['equipment', 'upgrades', 'alchemy'],
  alchemy: ['gathering', 'cooking', 'enchanting'],
  cooking: ['fishing', 'gathering', 'alchemy'],
  agility: ['sneak', 'questing', 'mounts'],
  loremaster: ['questing', 'prayer', 'dungeons'],
  trading: ['crafting', 'mining', 'fishing'],
  prayer: ['loremaster', 'dungeons', 'abilities'],
  sneak: ['agility', 'abilities', 'arenas'],
  questing: ['loremaster', 'dungeons', 'agility'],
  houses: ['mounts', 'pets', 'trading'],
  mounts: ['houses', 'pets', 'agility'],
  pets: ['mounts', 'houses', 'abilities'],
  guilds: ['outposts', 'arenas', 'dungeons'],
  outposts: ['guilds', 'arenas', 'dungeons'],
  dungeons: ['arenas', 'abilities', 'equipment'],
  arenas: ['dungeons', 'guilds', 'abilities'],
};
