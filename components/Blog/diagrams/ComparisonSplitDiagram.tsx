// Server-rendered two-segment split bar — proportional widths for `left` and
// `right` against `total`, with a 2px surface gap between segments (mark
// spec) and direct labels on both (identity is never color-alone). Dark
// pair validated via the dataviz skill: #c98500 + #9085e9 passes CVD/
// lightness/chroma checks against the site's dark surface.
type Segment = { label: string; value: number };

const CHART_W = 640;
const BAR_H = 40;
const GAP = 2;

const ComparisonSplitDiagram = ({
  total,
  left,
  right,
  alt,
  caption,
}: {
  total: number;
  left: Segment;
  right: Segment;
  alt: string;
  caption?: string;
}) => {
  const leftW = Math.max((left.value / total) * (CHART_W - GAP), 4);
  const rightW = CHART_W - GAP - leftW;

  return (
    <figure className="my-2">
      <svg
        viewBox={`0 0 ${CHART_W} 78`}
        width="100%"
        role="img"
        aria-labelledby="split-title split-desc"
        className="max-w-full"
      >
        <title id="split-title">{alt}</title>
        <desc id="split-desc">
          {`${left.label}: ${left.value} of ${total}; ${right.label}: ${right.value} of ${total}`}
        </desc>
        <rect x={0} y={0} width={leftW} height={BAR_H} rx={4} fill="#c98500" />
        <rect x={leftW + GAP} y={0} width={rightW} height={BAR_H} rx={4} fill="#9085e9" />
        <text x={0} y={BAR_H + 20} className="fill-white text-[13px] font-semibold">
          {left.value.toLocaleString()}
        </text>
        <text x={0} y={BAR_H + 36} className="fill-gray-400 text-[11px]">
          {left.label}
        </text>
        <text x={CHART_W} y={BAR_H + 20} textAnchor="end" className="fill-white text-[13px] font-semibold">
          {right.value.toLocaleString()}
        </text>
        <text x={CHART_W} y={BAR_H + 36} textAnchor="end" className="fill-gray-400 text-[11px]">
          {right.label}
        </text>
      </svg>
      {caption && <figcaption className="mt-2 text-xs text-gray-500">{caption}</figcaption>}
    </figure>
  );
};

export default ComparisonSplitDiagram;
