// Server-rendered, single-series horizontal bar chart — no client JS, no
// charting library. Position already encodes magnitude, so every bar shares
// one accent fill (color isn't doing the encoding here). Dark-surface pair
// validated per the dataviz skill: #c98500 passes lightness/chroma/contrast
// against the site's #1a1a19-equivalent dark surface.
type Bar = { label: string; value: number };

const ROW_H = 34;
const BAR_H = 18;
const CHART_W = 640;
const LABEL_W = 190;

function formatValue(value: number, unit?: string): string {
  if (unit === "INR") {
    if (Math.abs(value) >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (Math.abs(value) >= 1e5) return `₹${(value / 1e5).toFixed(1)} L`;
    return `₹${value}`;
  }
  if (unit === "percent") return `${value}%`;
  return String(value);
}

const BarChartDiagram = ({
  bars,
  unit,
  alt,
  caption,
}: {
  bars: Bar[];
  unit?: string;
  alt: string;
  caption?: string;
}) => {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const trackW = CHART_W - LABEL_W - 70;
  const height = bars.length * ROW_H + 12;

  return (
    <figure className="my-2">
      <svg
        viewBox={`0 0 ${CHART_W} ${height}`}
        width="100%"
        role="img"
        aria-labelledby="bar-chart-title bar-chart-desc"
        className="max-w-full"
      >
        <title id="bar-chart-title">{alt}</title>
        <desc id="bar-chart-desc">
          {bars.map((b) => `${b.label}: ${formatValue(b.value, unit)}`).join("; ")}
        </desc>
        {bars.map((b, i) => {
          const y = i * ROW_H + 6;
          const w = Math.max((b.value / max) * trackW, 4);
          return (
            <g key={b.label}>
              <text
                x={0}
                y={y + BAR_H / 2}
                dominantBaseline="middle"
                className="fill-gray-300 text-[12px]"
              >
                {b.label}
              </text>
              <rect x={LABEL_W} y={y} width={trackW} height={BAR_H} rx={4} className="fill-gray-800" />
              <rect x={LABEL_W} y={y} width={w} height={BAR_H} rx={4} fill="#c98500" />
              <text
                x={LABEL_W + w + 8}
                y={y + BAR_H / 2}
                dominantBaseline="middle"
                className="fill-white text-[12px] font-semibold"
              >
                {formatValue(b.value, unit)}
              </text>
            </g>
          );
        })}
      </svg>
      {caption && <figcaption className="mt-2 text-xs text-gray-500">{caption}</figcaption>}
    </figure>
  );
};

export default BarChartDiagram;
