export const AVATAR_PALETTE = [
  { bg: "#eef7ea", fg: "#1f6b25" },
  { bg: "#fdf1df", fg: "#8a5a12" },
  { bg: "#eef2fc", fg: "#33499e" },
  { bg: "#fdeef0", fg: "#a13a53" },
  { bg: "#f1f0fb", fg: "#5a4aa6" },
  { bg: "#e9f7f5", fg: "#187266" },
];

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarStyle(key: string) {
  return AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
