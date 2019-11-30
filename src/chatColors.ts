enum ChatColors {
  AQUA = "AQUA",
  BLACK = "BLACK",
  BLUE = "BLUE",
  BOLD = "BOLD",
  DARK_AQUA = "DARK_AQUA",
  DARK_BLUE = "DARK_BLUE",
  DARK_GRAY = "DARK_GRAY",
  DARK_GREEN = "DARK_GREEN",
  DARK_PURPLE = "DARK_PURPLE",
  DARK_RED = "DARK_RED",
  GOLD = "GOLD",
  GRAY = "GRAY",
  GREEN = "GREEN",
  ITALIC = "ITALIC",
  LIGHT_PURPLE = "LIGHT_PURPLE",
  MAGIC = "MAGIC",
  RED = "RED",
  RESET = "RESET",
  STRIKETHROUGH = "STRIKETHROUGH",
  UNDERLINE = "UNDERLINE",
  WHITE = "WHITE",
  YELLOW = "YELLOW"
}
const keys = Object.keys(ChatColors).map(k => ChatColors[k as any]);
const values = Object.keys(ChatColors).map(k => ChatColors[k as any]);

export function toColorCode(chatColor: ChatColors): string {
  switch (chatColor) {
    case ChatColors.AQUA:
      return "&b";
    case ChatColors.BLACK:
      return "&0";
    case ChatColors.BLUE:
      return "&9";
    case ChatColors.BOLD:
      return "&l";
    case ChatColors.DARK_AQUA:
      return "&3";
    case ChatColors.DARK_BLUE:
      return "&1";
    case ChatColors.DARK_GRAY:
      return "&8";
    case ChatColors.DARK_GREEN:
      return "&2";
    case ChatColors.DARK_PURPLE:
      return "&5";
    case ChatColors.DARK_RED:
      return "&4";
    case ChatColors.GOLD:
      return "&6";
    case ChatColors.GRAY:
      return "&7";
    case ChatColors.GREEN:
      return "&a";
    case ChatColors.ITALIC:
      return "&o";
    case ChatColors.LIGHT_PURPLE:
      return "&d";
    case ChatColors.MAGIC:
      return "&k";
    case ChatColors.RED:
      return "&c";
    case ChatColors.RESET:
      return "&r";
    case ChatColors.STRIKETHROUGH:
      return "&m";
    case ChatColors.UNDERLINE:
      return "&n";
    case ChatColors.WHITE:
      return "&f";
    case ChatColors.YELLOW:
      return "&e";
  }
}

const chatColorReplacements: { [key: string]: string } = {};
values.forEach(chatColor => {
  chatColorReplacements[
    `<${chatColor.toString().toUpperCase()}>`
  ] = toColorCode(chatColor);
  chatColorReplacements[
    `<${chatColor
      .toString()
      .toUpperCase()
      .replace("_", " ")}>`
  ] = toColorCode(chatColor);
  chatColorReplacements[
    `<${chatColor.toString().toLowerCase()}>`
  ] = toColorCode(chatColor);
  chatColorReplacements[
    `<${chatColor
      .toString()
      .toLowerCase()
      .replace("_", " ")}>`
  ] = toColorCode(chatColor);
});

export function chatColorize(str: string): string {
  let toRet = str;
  Object.keys(chatColorReplacements).forEach(key => {
    toRet = toRet.replace(key, chatColorReplacements[key]);
  });
  return toRet;
}

export default ChatColors;
