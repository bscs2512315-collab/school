export type PresetAvatarId =
  | "male-1"
  | "male-2"
  | "male-3"
  | "male-islamic"
  | "female-1"
  | "female-2"
  | "female-3"
  | "female-hijab";

export type PresetAvatar = {
  id: PresetAvatarId;
  src: string;
  label: string;
};

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: "male-1", src: "/avatars/male-1.png", label: "Male avatar 1" },
  { id: "male-2", src: "/avatars/male-2.png", label: "Male avatar 2" },
  { id: "male-3", src: "/avatars/male-3.png", label: "Male avatar 3" },
  { id: "male-islamic", src: "/avatars/male-islamic.png", label: "Male avatar with kufi" },
  { id: "female-1", src: "/avatars/female-1.png", label: "Female avatar 1" },
  { id: "female-2", src: "/avatars/female-2.png", label: "Female avatar 2" },
  { id: "female-3", src: "/avatars/female-3.png", label: "Female avatar 3" },
  { id: "female-hijab", src: "/avatars/female-hijab.png", label: "Female avatar with hijab" },
];

export function isPresetAvatarSrc(src?: string | null): boolean {
  if (!src) return false;
  return PRESET_AVATARS.some((avatar) => avatar.src === src);
}
