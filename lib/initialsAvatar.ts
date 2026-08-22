const AVATAR_BACKGROUNDS = ["#241f1a", "#1a2420", "#201a24", "#24181a", "#1a1f24"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Deterministic, brand-colored initials avatar as an inline SVG data URI —
// used wherever a real photo isn't available yet, instead of one identical
// placeholder image standing in for every person.
export function initialsAvatar(name: string): string {
  const background = AVATAR_BACKGROUNDS[hashString(name) % AVATAR_BACKGROUNDS.length];
  const label = initialsFor(name);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<rect width="96" height="96" rx="48" fill="${background}"/>` +
    `<text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#D9B268">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
