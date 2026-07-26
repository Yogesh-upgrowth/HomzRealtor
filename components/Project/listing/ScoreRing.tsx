// Size-configurable gold gauge ring, extracted from InvestmentScore.tsx so a
// compact variant can also sit in the hero's KeyFactsRibbon.
type Props = {
  score: number;
  grade?: string;
  size?: number; // outer diameter in px
};

const ScoreRing = ({ score, grade, size = 180 }: Props) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const gradientId = `score-gold-${size}`;

  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F2D79B" />
            <stop offset="100%" stopColor="#C99A4B" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-white" style={{ fontSize: size * 0.22 }}>
          {score}
        </span>
        {size >= 140 && <span className="text-xs text-gray-400">out of 100</span>}
        {grade && (
          <span className="mt-0.5 font-semibold text-[#D9B268]" style={{ fontSize: size * 0.08 }}>
            {grade}
          </span>
        )}
      </div>
    </div>
  );
};

export default ScoreRing;
