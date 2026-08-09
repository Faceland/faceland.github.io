import gems from './data/gems.json';
import tomes from './data/tomes.json';
import uniques from './data/uniques.json';
import scrolls from './data/scrolls.json';
import fish from './data/fish.json';
import materials from './data/materials.json';

export const getCardItems = () => {
  const newItems = [];
  for (const [key, value] of Object.entries(gems)) {
    const item = value;
    item.type = 'gem';
    item.background = '#10c810';
    item.gradient = `bg-gradient-to-bl from-gordons-green to-gordons-green-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(tomes)) {
    const item = value;
    item.type = 'tome';
    item.background = '#2869f4';
    item.gradient = `bg-gradient-to-bl from-murder-brown to-murder-brown-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(uniques)) {
    const item = value;
    item.type = 'unique';
    item.background = '#d97612';
    item.gradient = `bg-gradient-to-bl from-kilamanjaro to-kilamanjaro-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(scrolls)) {
    const item = value;
    item.type = 'scroll';
    item.background = '#34981a';
    item.gradient = `bg-gradient-to-bl from-black-forest to-black-forest-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(fish)) {
    const item = value;
    item.type = 'fish';
    item.background = '#4bdffa';
    item.gradient = `bg-gradient-to-bl from-deep-sea to-deep-sea-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(materials)) {
    const item = value;
    item.type = 'material';
    item.background = '#ffc23f';
    item.gradient = `bg-gradient-to-bl from-gold-dust to-gold-dust-end`;
    newItems.push(item);
  }

  newItems.forEach((item) => {
    item.groupNames = [...new Set(item.groupNames)];
    item.groupNames = item.groupNames.map(name => {
      name = name.replace('Any ', '');
      name = name.replace(' Weapons', '');
      return name
    });
  })

  return newItems;
};

export const getCardId = (item) => {
  if (item.type === 'unique') {
    return `${item.strippedName}+${item.tier}+${item.dropBase}`;
  }
  return `${item.name}-${item.type}`;
};

// Card ids carry colour codes and spaces, which turn a shared link into a wall
// of percent-escapes. Tokens say the same thing in url-safe characters —
// `transmute.gem`, `sad-connection.platelegs.52` — and are exactly as
// discriminating as the ids they stand in for.
const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/\|[a-z]*\|/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getCardToken = (item) =>
  item.type === 'unique'
    ? `${slugify(item.strippedName)}.${slugify(item.tier)}.${item.dropBase}`
    : `${slugify(item.strippedName)}.${item.type}`;

// Matches the separator facepals already uses for its `?data=` layers.
const SELECTION_SEPARATOR = '~';

export const buildSelectionCodec = (items) => {
  const idToToken = new Map();
  const tokenToId = new Map();
  items.forEach((item) => {
    const id = getCardId(item);
    const token = getCardToken(item);
    if (!idToToken.has(id)) idToToken.set(id, token);
    if (!tokenToId.has(token)) tokenToId.set(token, id);
  });
  return { idToToken, tokenToId };
};

export const encodeSelection = (selectedCardIds, codec) =>
  Array.from(selectedCardIds)
    .map((id) => codec.idToToken.get(id))
    .filter(Boolean)
    .join(SELECTION_SEPARATOR);

// Tokens that no longer match an item are dropped, so a link shared before an
// item was renamed still opens with whatever else it pointed at.
export const decodeSelection = (param, codec) => {
  const ids = new Set();
  if (!param) return ids;
  param.split(SELECTION_SEPARATOR).forEach((token) => {
    const id = codec.tokenToId.get(token.trim().toLowerCase());
    if (id) ids.add(id);
  });
  return ids;
};
