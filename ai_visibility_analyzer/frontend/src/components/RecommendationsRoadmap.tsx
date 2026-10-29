import React, { useState } from 'react';
import { ListChecks, CheckCircle2, Circle, Sparkles, Copy, Check } from 'lucide-react';

interface RecommendationsRoadmapProps {
  actionableBullets: string[];
  competitiveGapSummary?: string;
  brandName?: string;
}

export const RecommendationsRoadmap: React.FC<RecommendationsRoadmapProps> = ({
  actionableBullets,
  competitiveGapSummary,
  brandName = 'Target Site',
}) => {
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleCheck = (index: number) => {
    setCompletedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const copyToClipboard = () => {
    const text = actionableBullets.map((b, i) => `${i + 1}. ${b}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const total = actionableBullets.length;
  const completed = Object.values(completedItems).filter(Boolean).length;
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="recommendations-box glass-panel">
      {/* Header */}
      <div className="rec-header">
        <div className="rec-title-group">
          <div className="rec-icon-box">
            <ListChecks size={22} className="text-indigo" />
          </div>
          <div>
            <h3 className="rec-title">Actionable GEO Optimization Checklist</h3>
            <p className="rec-subtitle">
              Apply these descriptive improvements to {brandName} in VS Code to outrank competitors
            </p>
          </div>
        </div>

        <div className="rec-actions">
          <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
            {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Checklist'}</span>
          </button>
        </div>
      </div>

      {/* Competitive Gap Summary Banner */}
      {competitiveGapSummary && (
        <div className="gap-summary-banner">
          <Sparkles size={16} className="text-indigo flex-shrink-0" />
          <div className="gap-summary-text">
            <strong>Competitive Gap Analysis: </strong>
            {competitiveGapSummary}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-labels">
          <span className="progress-status-text">
            Implementation Progress: {completed} of {total} actions completed
          </span>
          <span className="progress-pct mono">{progressPct.toFixed(0)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Bulleted Roadmap List */}
      <div className="bullets-container">
        {actionableBullets.map((bullet, idx) => {
          const isDone = !!completedItems[idx];

          return (
            <div
              key={idx}
              className={`bullet-item ${isDone ? 'bullet-completed' : ''}`}
              onClick={() => toggleCheck(idx)}
            >
              <button
                className="bullet-checkbox"
                aria-label={`Toggle recommendation ${idx + 1}`}
              >
                {isDone ? (
                  <CheckCircle2 size={19} className="text-emerald" />
                ) : (
                  <Circle size={19} className="text-muted" />
                )}
              </button>

              <div className="bullet-content">
                <span className="bullet-number mono">#{idx + 1}</span>
                <span className="bullet-text">{bullet}</span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .recommendations-box {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .rec-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          gap: 1rem;
        }

        .rec-title-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .rec-icon-box {
          width: 44px;
          height: 44px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-indigo {
          color: var(--indigo-400);
        }

        .text-emerald {
          color: var(--emerald-400);
        }

        .text-muted {
          color: var(--text-muted);
        }

        .rec-title {
          font-size: 1.25rem;
          color: #ffffff;
        }

        .rec-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .gap-summary-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          margin-bottom: 1.25rem;
        }

        .gap-summary-text {
          font-size: 0.88rem;
          color: var(--text-primary);
          line-height: 1.45;
        }

        .gap-summary-text strong {
          color: var(--indigo-400);
        }

        .progress-section {
          margin-bottom: 1.25rem;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }

        .progress-status-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .progress-pct {
          font-size: 0.8rem;
          color: var(--indigo-400);
          font-weight: 700;
        }

        .progress-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--grad-primary);
          transition: width 0.3s ease;
          border-radius: var(--radius-full);
        }

        .bullets-container {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .bullet-item {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 0.85rem 1rem;
          background: rgba(10, 16, 30, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bullet-item:hover {
          background: rgba(15, 23, 42, 0.8);
          border-color: var(--border-medium);
        }

        .bullet-completed {
          opacity: 0.6;
          border-color: rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.03);
        }

        .bullet-completed .bullet-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .bullet-checkbox {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          margin-top: 0.15rem;
        }

        .bullet-content {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          flex: 1;
        }

        .bullet-number {
          font-size: 0.78rem;
          color: var(--indigo-400);
          font-weight: 700;
          margin-top: 0.1rem;
        }

        .bullet-text {
          font-size: 0.92rem;
          color: var(--text-primary);
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
};
