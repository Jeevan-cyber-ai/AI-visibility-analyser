import React from 'react';

interface ScoreRingProps {
  score: number;
  grade: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  grade,
  size = 180,
  strokeWidth = 12,
  label = 'AI Visibility Score',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Determine color scheme based on grade
  let color = '#10b981'; // Green
  let glowColor = 'rgba(16, 185, 129, 0.4)';

  if (grade === 'F' || clampedScore < 30) {
    color = '#f43f5e'; // Rose/Red
    glowColor = 'rgba(244, 63, 94, 0.4)';
  } else if (grade === 'D' || clampedScore < 50) {
    color = '#f97316'; // Orange
    glowColor = 'rgba(249, 115, 22, 0.4)';
  } else if (grade === 'C' || clampedScore < 70) {
    color = '#f59e0b'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
  } else if (grade === 'B' || clampedScore < 85) {
    color = '#06b6d4'; // Cyan
    glowColor = 'rgba(6, 182, 212, 0.4)';
  }

  return (
    <div className="score-ring-container">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="score-svg">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 12px ${glowColor})`,
            }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        {/* Center Content */}
        <div className="score-center-content">
          <div className="score-number-row">
            <span className="score-value">{score.toFixed(1)}</span>
            <span className="score-scale">/100</span>
          </div>
          <div className={`grade-badge grade-${grade}`}>
            {grade}
          </div>
        </div>
      </div>

      {label && <div className="score-label">{label}</div>}

      <style>{`
        .score-ring-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .score-svg {
          display: block;
        }

        .score-center-content {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          text-align: center;
        }

        .score-number-row {
          display: flex;
          align-items: baseline;
          gap: 0.15rem;
        }

        .score-value {
          font-family: var(--font-heading);
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
        }

        .score-scale {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .score-label {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
