// Everything an avatar can be made of: a face (picked, or random on a first
// visit) plus an optional pair of eyes and a hat drawn on top of it. Only
// faces with a clear head and eyes, facing forward on every system, so
// there's always somewhere for the accessories to go.
//
// dj-server/avatarParts.js has the same three emoji lists to validate
// choices against; keep them in sync. Adding an emoji also needs its
// per-system anchor points in avatarAnchors.js: see scripts/dj-avatars/.

// prettier-ignore
export const FACES = [
  '😀', '😂', '🙂', '😉', '😊', '😋', '😜', '🤪', '🤩', '🤔', '😐', '🙄',
  '🥴', '😳', '🥺', '😭', '😡', '🤢', '😈', '💀', '💩', '🤡', '👹', '👻',
  '👽', '🤖', '🎃', '🌝', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉', '👶', '👧', '👦', '🧑',
  '👩', '👨', '👱', '🧔', '🧛', '🧟', '🧝', '💁', '🤷',
];

// 'glasses' line their two lenses up with the face's eyes (`fit` scales the
// lens spacing against the eye spacing); a 'pair' is drawn once over each
// eye, `size` times the eye spacing across.
export const EYES = [
  { emoji: '🕶️', name: 'Sunglasses', kind: 'glasses', fit: 1 },
  { emoji: '👓', name: 'Glasses', kind: 'glasses', fit: 1 },
  { emoji: '🥽', name: 'Goggles', kind: 'glasses', fit: 0.85 },
  { emoji: '👀', name: 'Googly eyes', kind: 'glasses', fit: 1 },
  { emoji: '❤️', name: 'Heart eyes', kind: 'pair', size: 0.7 },
  { emoji: '⭐', name: 'Star eyes', kind: 'pair', size: 0.75 },
  { emoji: '💲', name: 'Money eyes', kind: 'pair', size: 0.6 },
  { emoji: '🌀', name: 'Dizzy eyes', kind: 'pair', size: 0.7 },
  { emoji: '✖️', name: 'X eyes', kind: 'pair', size: 0.55 },
  { emoji: '🔥', name: 'Fire eyes', kind: 'pair', size: 0.7 },
];

// A hat's anchor (its bottom middle, unless avatarAnchors.js says otherwise)
// sits on the top of the head: `fit` is its width against the head's,
// `sink` how far it goes down over the head (in head widths; negative
// floats above it), `dx` slides it sideways, `tilt` rotates it (degrees)
// and `behind` draws it behind the face.
export const HATS = [
  { emoji: '🎩', name: 'Top hat', fit: 0.8, sink: 0.1 },
  { emoji: '👒', name: 'Sun hat', fit: 1.05, sink: 0.15 },
  { emoji: '🧢', name: 'Cap', fit: 0.95, sink: 0.2 },
  { emoji: '🎓', name: 'Graduation cap', fit: 1, sink: 0.15 },
  { emoji: '👑', name: 'Crown', fit: 0.7, sink: 0.08 },
  { emoji: '⛑️', name: 'Helmet', fit: 1, sink: 0.25 },
  { emoji: '🎀', name: 'Bow', fit: 0.45, sink: 0.12, dx: 0.28, tilt: 20 },
  { emoji: '🎧', name: 'Headphones', fit: 1.3, sink: 0.8, behind: true },
  { emoji: '🌸', name: 'Flower', fit: 0.35, sink: 0.1, dx: -0.3, tilt: -15 },
  { emoji: '🍄', name: 'Mushroom', fit: 0.5, sink: 0.05 },
  { emoji: '💡', name: 'Bright idea', fit: 0.35, sink: -0.1 },
  { emoji: '🐤', name: 'Chick', fit: 0.45, sink: 0.05 },
];
