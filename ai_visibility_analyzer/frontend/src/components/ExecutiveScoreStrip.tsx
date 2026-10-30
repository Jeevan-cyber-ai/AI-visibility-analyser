import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface MetricRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const MetricRing: React.FC<MetricRingProps> = ({ score, size = 56, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (clamped / 100) * circumference;

  // Determine dynamic ring color (<50 red, 50-74 amber, >=75 green)
  let strokeColor = '#10b981'; // Green
  let glowColor = 'rgba(16, 185, 129, 0.25)';

  if (clamped < 50) {
    strokeColor = '#e11d48'; // Crimson / Rose Red
    glowColor = 'rgba(225, 29, 72, 0.25)';
  } else if (clamped < 75) {
    strokeColor = '#f59e0b'; // Amber / Orange
    glowColor = 'rgba(245, 158, 11, 0.25)';
  }

  return (
    <div className="metric-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="metric-ring-svg">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Filled Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="metric-ring-value mono">{clamped}</div>
    </div>
  );
};

interface ExecutiveScoreStripProps {
  aiVisibility: number;
  geoScore: number;
  seoScore: number;
  shareOfVoice: number;
  seoDetails?: Record<string, any>;
  brandName?: string;
}

export const ExecutiveScoreStrip: React.FC<ExecutiveScoreStripProps> = ({
  aiVisibility,
  geoScore,
  seoScore,
  shareOfVoice,
  seoDetails,
  brandName = 'Target Brand',
}) => {
  const [showSeoBreakdown, setShowSeoBreakdown] = useState(false);

  return (
    <div className="executive-score-container">
      {/* 4 Core Metric Cards Strip */}
      <div className="executive-score-strip glass-panel">
        {/* Card 1: AI Visibility */}
        <div className="score-pillar-card">
          <MetricRing score={aiVisibility} />
          <div className="score-pillar-text">
            <h4 className="score-pillar-title">AI Visibility</h4>
            <p className="score-pillar-desc">How often and how prominently AI mentions you</p>
          </div>
        </div>

        {/* Card 2: GEO Score */}
        <div className="score-pillar-card">
          <MetricRing score={geoScore} />
          <div className="score-pillar-text">
            <h4 className="score-pillar-title">GEO Score</h4>
            <p className="score-pillar-desc">How easy your pages are for AI to read and quote</p>
          </div>
        </div>

        {/* Card 3: SEO Score */}
        <div 
          className={`score-pillar-card clickable-seo-card ${showSeoBreakdown ? 'active' : ''}`}
          onClick={() => setShowSeoBreakdown(!showSeoBreakdown)}
          title="Click to view classic on-page SEO factors breakdown"
        >
          <MetricRing score={seoScore} />
          <div className="score-pillar-text">
            <div className="title-with-toggle">
              <h4 className="score-pillar-title">SEO Score</h4>
              {showSeoBreakdown ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
            </div>
            <p className="score-pillar-desc">Classic on-page search health</p>
          </div>
        </div>

        {/* Card 4: Share of voice */}
        <div className="score-pillar-card">
          <MetricRing score={shareOfVoice} />
          <div className="score-pillar-text">
            <h4 className="score-pillar-title">Share of voice</h4>
            <p className="score-pillar-desc">Your share of all brand mentions in these answers</p>
          </div>
        </div>
      </div>

      {/* Expandable Classic SEO Breakdown Drawer */}
      {showSeoBreakdown && seoDetails && Object.keys(seoDetails).length > 0 && (
        <div className="seo-breakdown-drawer glass-panel">
          <div className="drawer-header">
            <div className="drawer-title-row">
              <ShieldCheck size={18} className="text-cyan" />
              <h5>Classic On-Page SEO Health Breakdown for {brandName}</h5>
            </div>
            <span className="mono seo-score-pill">
              Overall SEO: {Math.round(seoScore)}/100
            </span>
          </div>

          <div className="seo-factors-grid">
            {Object.entries(seoDetails).map(([key, item]: [string, any]) => {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              const status = item.status || 'PASSED';
              return (
                <div key={key} className={`seo-factor-item ${status.toLowerCase()}`}>
                  <div className="factor-item-top">
                    <span className="factor-item-name">{label}</span>
                    <span className="factor-item-score mono">+{item.score} pts</span>
                  </div>
                  <div className="factor-item-detail">
                    {status === 'PASSED' ? (
                      <CheckCircle2 size={13} className="text-emerald" />
                    ) : status === 'WARNING' ? (
                      <AlertTriangle size={13} className="text-amber" />
                    ) : (
                      <XCircle size={13} className="text-rose" />
                    )}
                    <span>{item.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .executive-score-container {
          margin-bottom: 1.5rem;
          width: 100%;
        }

        .executive-score-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: rgba(14, 18, 28, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
          align-items: center;
        }

        .score-pillar-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.25s ease;
        }

        .score-pillar-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .clickable-seo-card {
          cursor: pointer;
        }

        .clickable-seo-card.active {
          border-color: var(--primary-cyan);
          background: rgba(6, 182, 212, 0.05);
        }

        .metric-ring-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-ring-svg {
          display: block;
        }

        .metric-ring-value {
          position: absolute;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .score-pillar-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }

        .title-with-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .score-pillar-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .score-pillar-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.35;
          margin: 0;
        }

        /* SEO Breakdown Drawer */
        .seo-breakdown-drawer {
          margin-top: 0.75rem;
          padding: 1.25rem 1.5rem;
          background: rgba(11, 15, 24, 0.95);
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: var(--radius-md);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .drawer-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .drawer-title-row h5 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .seo-score-pill {
          font-size: 0.8rem;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          background: rgba(6, 182, 212, 0.15);
          color: var(--primary-cyan);
          border: 1px solid rgba(6, 182, 212, 0.3);
        }

        .seo-factors-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .seo-factor-item {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .seo-factor-item.passed {
          border-left: 3px solid #10b981;
        }

        .seo-factor-item.warning {
          border-left: 3px solid #f59e0b;
        }

        .seo-factor-item.failed {
          border-left: 3px solid #ef4444;
        }

        .factor-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .factor-item-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .factor-item-score {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .factor-item-detail {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        @media (max-width: 1200px) {
          .executive-score-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .seo-factors-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .executive-score-strip {
            grid-template-columns: 1fr;
          }
          .seo-factors-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
