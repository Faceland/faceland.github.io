// What an avatar can be made of: a face plus optional eyes and hat. The same
// lists as src/pages/DJ/avatarParts.js (which also has how each accessory
// is drawn); keep them in sync. Only these are accepted from clients.

// prettier-ignore
const FACES = [
  '😀', '😂', '🙂', '😉', '😊', '😋', '😜', '🤪', '🤩', '🤔', '😐', '🙄',
  '🥴', '😳', '🥺', '😭', '😡', '🤢', '😈', '💀', '💩', '🤡', '👹', '👻',
  '👽', '🤖', '🎃', '🌝', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉', '🐞', '🐌', '🌵', '👶',
  '👧', '👦', '🧑', '👩', '👨', '👱', '🧔', '🧛', '🧟', '🧝', '💁', '🤷',
];

const EYES = ['🕶️', '👓', '🥽', '👀', '❤️', '⭐', '💲', '🌀', '✖️', '🔥'];

// prettier-ignore
const HATS = ['🎩', '👒', '🧢', '🎓', '👑', '⛑️', '🎀', '🎧', '🌸', '🍄', '💡', '🐤'];

module.exports = { FACES, EYES, HATS };
