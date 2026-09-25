import { GURGAON_ANCHORS } from "@/lib/intelligence/listingContext";

// A generated position tile (developer-page brief §3, image option b): the
// project's sector-level coordinate plotted against fixed Gurgaon anchors.
// Drawn here from data we hold, so it is ours to publish, carries no
// third-party image and costs no image-optimisation quota. It is a schematic,
// not a map — the caption says so.

const BOX = { minLat: 28.34, maxLat: 28.58, minLng: 76.92, maxLng: 77.16 };
const W = 320;
const H = 180;

function xy(lat: number, lng: number): [number, number] {
  const x = ((lng - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * W;
  const y = H - ((lat - BOX.minLat) / (BOX.maxLat - BOX.minLat)) * H;
  return [Math.max(8, Math.min(W - 8, x)), Math.max(8, Math.min(H - 8, y))];
}

const SHOWN = new Set(["cyber-hub", "nh48", "igi"]);

export default function SectorPinTile({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const [px, py] = xy(lat, lng);
  // Several tiles render on one page; each needs its own pattern id.
  const gridId = `grid-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.round(px)}-${Math.round(py)}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Schematic position of ${label} relative to Cyber Hub, Rajiv Chowk and IGI Airport`}
      className="h-full w-full bg-[#101012]"
    >
      <defs>
        <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${gridId})`} />
      {GURGAON_ANCHORS.filter((a) => SHOWN.has(a.key)).map((a) => {
        const [ax, ay] = xy(a.lat, a.lng);
        return (
          <g key={a.key}>
            <circle cx={ax} cy={ay} r="3" fill="#6b7280" />
            <text x={ax + 6} y={ay + 3} fontSize="9" fill="#9ca3af">
              {a.label.replace(/\s*\(.*\)$/, "")}
            </text>
          </g>
        );
      })}
      <circle cx={px} cy={py} r="9" fill="rgba(217,178,104,0.25)" />
      <circle cx={px} cy={py} r="4.5" fill="#D9B268" />
      <text x={px + 10} y={py - 8} fontSize="10" fontWeight="700" fill="#F2D79B">
        {label}
      </text>
    </svg>
  );
}
