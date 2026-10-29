import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  FileCode,
  HelpCircle,
  BarChart3,
  UserCheck,
  Calendar
} from 'lucide-react';
import type { FactorDetail } from '../types/api';

interface FactorCardProps {
  factorKey: string;
  factor: FactorDetail;
}

export const FactorCard: React.FC<FactorCardProps> = ({ factorKey, factor }) => {
  const [expanded, setExpanded] = useState(false);

  // Icon mapping
  const getIcon = () => {
    switch (factorKey) {
      case 'robots_ai_access':
        return <Shield size={18} />;
      case 'json_ld_schema':
        return <FileCode size={18} />;
      case 'direct_answer_formatting':
        return <HelpCircle size={18} />;
      case 'empirical_statistics':
        return <BarChart3 size={18} />;
      case 'author_authority_eeat':
        return <UserCheck size={18} />;
      case 'temporal_freshness':
        return <Calendar size={18} />;
      default:
        return <Shield size={18} />;
    }
  };

  // Status icon
  const getStatusIcon = () => {
    switch (factor.status) {
      case 'PASSED':
        return <CheckCircle size={15} />;
      case 'WARNING':
        return <AlertTriangle size={15} />;
      case 'FAILED':
        return <XCircle size={15} />;
    }
  };

  const statusClass = factor.status === 'PASSED' ? 'pill-pass' : factor.status === 'WARNING' ? 'pill-warn' : 'pill-fail';

  return (
    <div className={`factor-card glass-panel status-${factor.status.toLowerCase()}`}>
      <div className="factor-header" onClick={() => setExpanded(!expanded)}>
        <div className="factor-left">
          <div className="factor-icon-wrapper">
            {getIcon()}
          </div>
          <div>
            <div className="factor-title-row">
              <h4 className="factor-title">{factor.name}</h4>
              <span className={`pill ${statusClass}`}>
                {getStatusIcon()}
                <span>{factor.status}</span>
              </span>
            </div>
            <p className="factor-summary">{factor.summary}</p>
          </div>
        </div>

        <div className="factor-right">
          <div className="factor-score-box">
            <span className="factor-score-val mono">{factor.score.toFixed(1)}</span>
            <span className="factor-weight-val mono">/ {factor.weight} pts</span>
          </div>
          <button className="expand-btn" aria-label="Toggle details">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="factor-details">
          {/* Evidence section */}
          {factor.evidence && factor.evidence.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Audit Evidence & Findings</div>
              <ul className="evidence-list">
                {factor.evidence.map((item, idx) => (
                  <li key={idx} className="evidence-item">
                    <span className="evidence-dot"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations section */}
          {factor.recommendations && factor.recommendations.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">How to Improve This Factor</div>
              <ul className="rec-list">
                {factor.recommendations.map((rec, idx) => (
                  <li key={idx} className="rec-item">
                    <span className="rec-arrow">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style>{`
        .factor-card {
          padding: 1.25rem;
          margin-bottom: 0.85rem;
          cursor: pointer;
        }

        .factor-card.status-failed {
          border-left: 3px solid var(--rose-500);
        }

        .factor-card.status-passed {
          border-left: 3px solid var(--emerald-500);
        }

        .factor-card.status-warning {
          border-left: 3px solid var(--amber-500);
        }

        .factor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .factor-left {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          flex: 1;
        }

        .factor-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          flex-shrink: 0;
        }

        .factor-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .factor-title {
          font-size: 1.05rem;
          color: #ffffff;
        }

        .factor-summary {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .factor-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .factor-score-box {
          text-align: right;
        }

        .factor-score-val {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          display: block;
          line-height: 1;
        }

        .factor-weight-val {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .expand-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
        }

        .factor-details {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-section-title {
          font-family: var(--font-heading);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .evidence-list, .rec-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .evidence-item, .rec-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .evidence-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--text-muted);
          margin-top: 0.45rem;
          flex-shrink: 0;
        }

        .rec-arrow {
          color: var(--indigo-400);
          font-weight: bold;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
