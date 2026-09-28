import { clsx } from 'clsx';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function ScoreRing({
  score,
  label,
  size = 'md',
  color,
  className,
}: ScoreRingProps) {
  const dims = { sm: 64, md: 88, lg: 120 };
  const strokes = { sm: 5, md: 7, lg: 9 };
  const dim = dims[size];
  const stroke = strokes[size];
  const radius = (dim - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (color) return color;
    if (score >= 80) return '#10b981'; // emerald
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const labelSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className={clsx('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-gray-700"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx('font-bold text-white leading-none', textSize)}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className={clsx('text-gray-400 text-center font-medium', labelSize)}>
        {label}
      </span>
    </div>
  );
}
