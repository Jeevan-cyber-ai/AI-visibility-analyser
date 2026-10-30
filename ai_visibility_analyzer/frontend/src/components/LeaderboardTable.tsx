import React from 'react';
import { Trophy, Check, X, TrendingUp } from 'lucide-react';
import type { PageAuditResult, BrandQueryScore } from '../types/api';

interface LeaderboardTableProps {
  targetBrand: string;
  targetAudit: PageAuditResult;
  competitors: PageAuditResult[];
  rankPosition: number;
  brandQueryScores?: Record<string, BrandQueryScore>;
  query?: string;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  targetBrand,
  targetAudit,
  competitors,
  rankPosition,
  brandQueryScores,
  query,
}) => {
  const hasQueryAudit = !!brandQueryScores && Object.keys(brandQueryScores).length > 0;

  // Combine target and competitors, sorted by score descending
  const allSites: (PageAuditResult & { isTarget: boolean; queryMetric?: BrandQueryScore })[] = [
    {
      ...targetAudit,
      isTarget: true,
      queryMetric: brandQueryScores ? brandQueryScores[targetAudit.brand_name.toLowerCase()] : undefined,
    },
    ...competitors.map((c) => ({
      ...c,
      isTarget: false,
      queryMetric: brandQueryScores ? brandQueryScores[c.brand_name.toLowerCase()] : undefined,
    })),
  ].sort((a, b) => {
    // If query metrics available, sort by composite visibility, else by on-page overall_score
    if (hasQueryAudit && a.queryMetric && b.queryMetric) {
      return b.queryMetric.query_score - a.queryMetric.query_score;
    }
    return b.overall_score - a.overall_score;
  });

  const winnerScore = hasQueryAudit && allSites[0]?.queryMetric
    ? allSites[0].queryMetric.query_score
    : (allSites[0]?.overall_score || 100);

  return (
    <div className="leaderboard-wrapper glass-panel">
      <div className="leaderboard-header">
        <div className="header-title-group">
          <div className="trophy-icon-box">
            <Trophy size={20} className="trophy-icon" />
          </div>
          <div>
            <h3 className="leaderboard-title">Competitive GEO & AI Search Leaderboard</h3>
            <p className="leaderboard-subtitle">
              {query
                ? `Benchmarking ${targetBrand} & rivals for query: "${query}"`
                : `Benchmarking ${targetBrand} against market alternatives in generative search`}
            </p>
          </div>
        </div>

        <div className="rank-indicator-box">
          <span className="rank-label">Target Position:</span>
          <span className={`rank-value ${rankPosition === 1 ? 'rank-winner' : 'rank-behind'}`}>
            Rank #{rankPosition} of {allSites.length}
          </span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th style={{ width: '75px' }}>Rank</th>
              <th>Brand & Domain</th>
              <th style={{ width: '110px' }}>GEO Score</th>
              <th style={{ width: '110px' }}>SEO Score</th>
              <th style={{ width: '85px' }}>Grade</th>
              {hasQueryAudit ? (
                <>
                  <th>AI Mention Rate</th>
                  <th>AI Citation Rate</th>
                  <th>Share of Voice</th>
                  <th>AI Search Score</th>
                </>
              ) : (
                <>
                  <th>Robots AI Access</th>
                  <th>Schema Types</th>
                  <th>Direct Answers</th>
                  <th>Stats & Citations</th>
                </>
              )}
              <th>Gap vs #1</th>
            </tr>
          </thead>
          <tbody>
            {allSites.map((site, index) => {
              const rank = index + 1;
              const currentScore = hasQueryAudit && site.queryMetric
                ? site.queryMetric.query_score
                : site.overall_score;
              const delta = currentScore - winnerScore;
              const isFirst = rank === 1;

              return (
                <tr
                  key={site.brand_name + index}
                  className={`table-row ${site.isTarget ? 'target-row' : ''}`}
                >
                  {/* Rank Badge */}
                  <td>
                    <div className="rank-col">
                      <span className={`rank-badge rank-${rank <= 3 ? rank : 'other'}`}>
                        #{rank}
                      </span>
                    </div>
                  </td>

                  {/* Brand & URL */}
                  <td>
                    <div className="brand-info-cell">
                      <div className="brand-name-row">
                        <span className="brand-name">{site.brand_name}</span>
                        {site.isTarget && (
                          <span className="target-pill">Target Under Test</span>
                        )}
                      </div>
                      <span className="brand-domain mono">{site.url_or_path}</span>
                    </div>
                  </td>

                  {/* GEO Score */}
                  <td>
                    <div className="score-cell">
                      <span className="score-text mono">{site.overall_score.toFixed(1)}</span>
                      <span className="score-max">/100</span>
                    </div>
                  </td>

                  {/* Classic SEO Score */}
                  <td>
                    <div className="score-cell">
                      <span className="score-text mono">{(site.seo_score ?? 75).toFixed(0)}</span>
                      <span className="score-max">/100</span>
                    </div>
                  </td>

                  {/* Grade */}
                  <td>
                    <span className={`grade-badge grade-${site.grade}`}>
                      {site.grade}
                    </span>
                  </td>

                  {hasQueryAudit ? (
                    <>
                      {/* AI Mention Rate */}
                      <td>
                        <span className="metric-chip mono">
                          {site.queryMetric ? `${site.queryMetric.mention_rate.toFixed(0)}%` : '0%'}
                        </span>
                      </td>

                      {/* AI Citation Rate */}
                      <td>
                        <span className="metric-chip mono">
                          {site.queryMetric ? `${site.queryMetric.citation_rate.toFixed(0)}%` : '0%'}
                        </span>
                      </td>

                      {/* Share of Voice */}
                      <td>
                        <span className="metric-chip mono text-indigo">
                          {site.queryMetric ? `${site.queryMetric.share_of_voice.toFixed(1)}%` : '0%'}
                        </span>
                      </td>

                      {/* AI Search Score */}
                      <td>
                        <div className="score-cell">
                          <span className="score-text mono text-emerald">
                            {site.queryMetric ? site.queryMetric.query_score.toFixed(1) : site.overall_score.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Robots AI Access */}
                      <td>
                        {site.stats_summary?.has_robots_txt ? (
                          <span className="status-chip pass">
                            <Check size={13} /> Allowed
                          </span>
                        ) : (
                          <span className="status-chip fail">
                            <X size={13} /> Blocked / Missing
                          </span>
                        )}
                      </td>

                      {/* Schema Types */}
                      <td>
                        <div className="schema-chips">
                          {site.stats_summary?.schemas_detected && site.stats_summary.schemas_detected.length > 0 ? (
                            site.stats_summary.schemas_detected.map((s, i) => (
                              <span key={i} className="schema-tag">{s}</span>
                            ))
                          ) : (
                            <span className="none-tag">None (0)</span>
                          )}
                        </div>
                      </td>

                      {/* Direct Answers */}
                      <td>
                        <span className="metric-chip mono">
                          {site.stats_summary?.direct_answers_count ?? 0} found
                        </span>
                      </td>

                      {/* Stats Count */}
                      <td>
                        <span className="metric-chip mono">
                          {site.stats_summary?.statistics_detected_count ?? 0} citations
                        </span>
                      </td>
                    </>
                  )}

                  {/* Gap vs #1 */}
                  <td>
                    {isFirst ? (
                      <span className="delta-chip winner">
                        <TrendingUp size={13} /> Leader
                      </span>
                    ) : (
                      <span className="delta-chip behind">
                        {delta.toFixed(1)} pts
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .leaderboard-wrapper {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .leaderboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .header-title-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .trophy-icon-box {
          width: 44px;
          height: 44px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .trophy-icon {
          color: #fbbf24;
        }

        .leaderboard-title {
          font-size: 1.25rem;
          color: #ffffff;
        }

        .leaderboard-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .rank-indicator-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.8);
          padding: 0.5rem 0.9rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .rank-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .rank-value {
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 0.95rem;
        }

        .rank-value.rank-winner {
          color: #34d399;
        }

        .rank-value.rank-behind {
          color: #fb7185;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          text-align: left;
        }

        .leaderboard-table th {
          padding: 0.85rem 1rem;
          color: var(--text-muted);
          font-family: var(--font-heading);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-subtle);
        }

        .leaderboard-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: middle;
        }

        .table-row {
          transition: background-color 0.15s ease;
        }

        .table-row:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .target-row {
          background: rgba(99, 102, 241, 0.08);
          border-left: 3px solid var(--indigo-500);
        }

        .target-row:hover {
          background: rgba(99, 102, 241, 0.12);
        }

        .brand-info-cell {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .brand-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .brand-name {
          font-weight: 700;
          color: #ffffff;
          font-size: 0.95rem;
        }

        .target-pill {
          font-size: 0.65rem;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-full);
          background: rgba(99, 102, 241, 0.25);
          color: #a5b4fc;
          font-family: var(--font-mono);
          text-transform: uppercase;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }

        .brand-domain {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .score-cell {
          display: flex;
          align-items: baseline;
          gap: 0.2rem;
        }

        .score-text {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }

        .score-max {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          padding: 0.25rem 0.55rem;
          border-radius: var(--radius-full);
          font-weight: 600;
        }

        .status-chip.pass {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-chip.fail {
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }

        .schema-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .schema-tag {
          font-size: 0.72rem;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-sm);
          background: rgba(99, 102, 241, 0.12);
          color: #a5b4fc;
          font-family: var(--font-mono);
          border: 1px solid rgba(99, 102, 241, 0.25);
        }

        .none-tag {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .metric-chip {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .delta-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          font-family: var(--font-mono);
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .delta-chip.winner {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .delta-chip.behind {
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
        }
      `}</style>
    </div>
  );
};
