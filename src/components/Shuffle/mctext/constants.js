export const DEFAULT_STYLES = {
  color: '',
  fontStyle: '',
  textDecoration: '',
};

export const COLORS = {
  black: 'rgb(35, 20, 24)',
  blue: 'rgb(47, 136, 225)',
  brown: 'rgb(152, 79, 37)',
  chrom: 'rgb(0, 255, 255)',
  crimson: 'rgb(173, 30, 25)',
  cyan: 'rgb(77, 242, 255)',
  dblue: 'rgb(34, 94, 183)',
  dgray: 'rgb(86, 73, 78)',
  dorange: 'rgb(194, 106, 29)',
  gray: 'rgb(126, 110, 110)',
  green: 'rgb(57, 159, 13)',
  lavender: 'rgb(211,211,255)',
  lgray: 'rgb(173, 161, 156)',
  lgreen: 'rgb(76, 234, 25)',
  lime: 'rgb(138, 248, 40)',
  none: 'rgb(255, 255, 255)',
  pink: 'rgb(243, 109, 124)',
  purple: 'rgb(166, 63, 201)',
  orange: 'rgb(248, 132, 44)',
  rainbow: 'rgb(0, 251, 255)',
  red: 'rgb(252, 61, 56)',
  teal: 'rgb(22, 166, 162)',
  white: 'rgb(255, 251, 243)',
  yellow: 'rgb(255, 212, 66)',
};

export const FONT_STYLES = {
  b: 'bold',
  i: 'italic',
};

export const TEXT_DECORATIONS = {
  ul: 'underline',
};

export const CHINESE = {
  傜: {
    // enchantable
    color: COLORS.white,
    content: 'Enchantable',
    className: 'enchantable',
  },
  '哀': {
    // socket
    color: COLORS.orange,
    content: ' ',
    className: 'socket',
  },
  '品': {
    // socket extender
    color: COLORS.teal,
    content: ' ',
    className: 'socketExtender',
  },
  '丒': {
    // green text, "passive"
    color: COLORS.green,
    content: '[Passive]',
    className: 'passive',
  },
  '丝': {
    color: COLORS.cyan,
    content: '[On Air Jump]',
    className: 'on-air-jump',
  },
  '世': {
    color: COLORS.purple,
    content: '[On Death]',
    className: 'on-death',
  },
  '丐': {
    color: COLORS.red,
    content: '[On Hit]',
    className: 'on-hit',
  },
  '儔': {
    color: COLORS.red,
    content: ' Life ',
    className: 'life-icon',
  },
  '丙': {
    color: COLORS.blue,
    content: '[When Hit]',
    className: 'when-hit',
  },
  '峑': {
    color: COLORS.pink,
    content: ' Range',
    className: 'range-icon',
  },
  '儓': {
    color: COLORS.orange,
    content: ' Energy ',
    className: 'energy-icon',
  },
  '億': {
    color: COLORS.orange,
    content: ' Lightning Damage',
    className: 'physical-dmg-icon',
  },
  '丑': {
    color: COLORS.blue,
    content: '[When Hit]',
    className: 'when-hit',
  },
  '儃': {
    color: COLORS.cyan,
    content: ' Ice Damage',
    className: 'ice-dmg-icon',
  },
  '儡': {
    color: COLORS.white,
    content: 'Barrier Regen ',
    className: 'barrier-regen-icon',
  },
  '儠': {
    color: COLORS.red,
    content: ' Life Regen',
    className: 'life-regen-icon',
  },
  '丗': {
    color: COLORS.teal,
    content: '[Ability Mod]',
    className: 'ability-mod',
  },
  '东': {
    color: COLORS.crimson,
    content: '[On Kill]',
    className: 'on-kill',
  },
  '且': {
    color: COLORS.orange,
    content: '[Combat Start]',
    className: 'on-combat-start',
  },
  '慳': {
    color: COLORS.blue,
    content: '[On Cast]',
    className: 'on-cast',
  },
  '儗': {
    color: COLORS.white,
    content: 'Barrier',
    className: 'barrier-icon',
  },
  '儀': {
    color: COLORS.red,
    content: ' Physical Damage',
    className: 'physical-dmg-icon',
  }
};
