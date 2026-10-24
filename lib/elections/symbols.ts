export interface ElectionSymbolOption {
  name: string;
  emoji?: string;
  image?: string;
}

export const DEFAULT_ELECTION_SYMBOLS: ElectionSymbolOption[] = [
  { name: "Dumbbell", emoji: "🏋️" },
  { name: "Lily", emoji: "🌸" },
  { name: "Pen", emoji: "🖊️" },
  { name: "Eagle", emoji: "🦅" },
  { name: "Shield", emoji: "🛡️" },
  { name: "Spider", emoji: "🕷️" },
  { name: "Wolf", emoji: "🐺" },
  { name: "Lion", emoji: "🦁" },
  { name: "Black Cat", emoji: "🐈‍⬛" },
  { name: "Graduation Cap", emoji: "🎓" },
  { name: "Crown", emoji: "👑" },
  { name: "Irregular", emoji: "🌀" },
  { name: "Tulip", emoji: "🌷" },
  { name: "Hourglass", emoji: "⏳" },
  { name: "Clock", emoji: "🕐" },
  { name: "Rocket", emoji: "🚀" },
  { name: "Butterfly", emoji: "🦋" },
  { name: "Badge", emoji: "🏅" },
  { name: "BMW", image: "/symbols/bmw.svg" },
  { name: "Lock", emoji: "🔒" },
  { name: "Star", emoji: "⭐" },
  { name: "Headphones", emoji: "🎧" },
  { name: "Camera", emoji: "📷" },
  { name: "Mic", emoji: "🎤" },
  { name: "Mjolnir", image: "/symbols/mjolnir.webp" },
  { name: "Book", emoji: "📖" },
  { name: "Elite Athletes", emoji: "🏆" },
  { name: "Balancing Scale", emoji: "⚖️" },
  { name: "Gimbal", image: "/symbols/gimbal.png" },
];

export const SYMBOL_EMOJI_PREFIX = "emoji:";

export function isEmojiSymbol(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(SYMBOL_EMOJI_PREFIX));
}

export function isImageSymbol(value: string | null | undefined): boolean {
  return Boolean(value && !value.startsWith(SYMBOL_EMOJI_PREFIX));
}

export function toEmojiSymbol(emoji: string): string {
  return `${SYMBOL_EMOJI_PREFIX}${emoji}`;
}

export function emojiFromSymbol(value: string | null | undefined): string {
  if (!value) return "";
  return value.startsWith(SYMBOL_EMOJI_PREFIX)
    ? value.slice(SYMBOL_EMOJI_PREFIX.length)
    : "";
}