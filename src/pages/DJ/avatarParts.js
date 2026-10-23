// Everything an avatar can be made of: a face (picked, or random on a first
// visit) plus an optional pair of eyes and a hat drawn on top of it. Mostly
// faces with a clear head and eyes, facing forward on every system; a few
// favourites without (🐞, 🐌, 🌵) just wear things where they look best.
//
// Where and how big each accessory is drawn is per system, in
// avatarAnchors.js (generated: see scripts/dj-avatars/).
// dj-server/avatarParts.js has the same three emoji lists to validate
// choices against; keep them in sync.

// prettier-ignore
export const FACES = [
  '😀', '😂', '🙂', '😉', '😊', '😋', '😜', '🤪', '🤩', '🤔', '😐', '🙄',
  '🥴', '😳', '🥺', '😭', '😡', '🤢', '😈', '💀', '💩', '🤡', '👹', '👻',
  '👽', '🤖', '🎃', '🌝', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉', '🐞', '🐌', '🌵', '👶',
  '👧', '👦', '🧑', '👩', '👨', '👱', '🧔', '🧛', '🧟', '🧝', '💁', '🤷',
];

// 'glasses' go on once, over both eyes; a 'pair' is drawn over each eye.
export const EYES = [
  { emoji: '🕶️', name: 'Sunglasses', kind: 'glasses' },
  { emoji: '👓', name: 'Glasses', kind: 'glasses' },
  { emoji: '🥽', name: 'Goggles', kind: 'glasses' },
  { emoji: '👀', name: 'Googly eyes', kind: 'glasses' },
  { emoji: '❤️', name: 'Heart eyes', kind: 'pair' },
  { emoji: '⭐', name: 'Star eyes', kind: 'pair' },
  { emoji: '💲', name: 'Money eyes', kind: 'pair' },
  { emoji: '🌀', name: 'Dizzy eyes', kind: 'pair' },
  { emoji: '✖️', name: 'X eyes', kind: 'pair' },
  { emoji: '🔥', name: 'Fire eyes', kind: 'pair' },
];

export const HATS = [
  { emoji: '🎩', name: 'Top hat' },
  { emoji: '👒', name: 'Sun hat' },
  { emoji: '🧢', name: 'Cap' },
  { emoji: '🎓', name: 'Graduation cap' },
  { emoji: '👑', name: 'Crown' },
  { emoji: '⛑️', name: 'Helmet' },
  { emoji: '🎀', name: 'Bow' },
  { emoji: '🎧', name: 'Headphones' },
  { emoji: '🌸', name: 'Flower' },
  { emoji: '🍄', name: 'Mushroom' },
  { emoji: '💡', name: 'Bright idea' },
  { emoji: '🐤', name: 'Chick' },
];
