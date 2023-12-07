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
  傝: {
    // untradeable
    color: COLORS.white,
    content: 'Untradeable',
    className: 'untradeable',
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
    content: 'x',
    className: 'socketExtender',
  },
};
