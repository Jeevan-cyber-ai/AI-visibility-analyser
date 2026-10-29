import React, { useState } from 'react';
import {
  Search,
  Zap,
  Globe,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import type { ClusterSummary, ComparativeAuditReport } from '../types/api';
import { auditCluster } from '../services/api';

export const ClusterAuditView: React.FC = () => {
  const [seedQuery, setSeedQuery] = useState<string>(
    'tell me the best agile sprint management software in 2026'
  );
  const [brandUrl, setBrandUrl] = useState<string>('https://pulsetask.io');
  const [provider, setProvider] = useState<string>('Gemini');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [clusterSummary, setClusterSummary] = useState<ClusterSummary | null>(null);
  const [comparativeReport, setComparativeReport] = useState<ComparativeAuditReport | null>(null);
  const [expandedSnippet, setExpandedSnippet] = useState<number | null>(null);

  const handleRunCluster = async () => {
    if (!seedQuery.trim() || !brandUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await auditCluster({
        query: seedQuery,
        brandUrl: brandUrl,
        provider: provider,
      });
      setClusterSummary(data.cluster_summary);
      setComparativeReport(data.comparative_report);
    } catch (err: any) {
      setError(err.message || 'Cluster audit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cluster-view">
      <div className="view-intro">
        <h2 className="view-title">Multi-Intent AI Query Cluster Auditor</h2>
        <p className="view-desc">
          Test real user search queries in parallel against LLMs (with live search grounding) to track where your brand gets mentioned, cited, and recommended against competitors.
        </p>
      </div>

      {/* Input Configuration Panel */}
      <div className="glass-panel cluster-input-card">
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Seed Search Query</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. best antivirus softwares in 2026"
              value={seedQuery}
              onChange={(e) => setSeedQuery(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Target Brand Domain / URL</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. https://pulsetask.io"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="cluster-config-row">
          <div className="provider-select-box">
            <label className="input-label">LLM Engine</label>
            <div className="provider-options">
              {['Gemini', 'Groq', 'Mistral', 'Mock'].map((p) => (
                <button
                  key={p}
                  className={`provider-btn ${provider === p ? 'active' : ''}`}
                  onClick={() => setProvider(p)}
                >
                  <Cpu size={14} />
                  <span>{p === 'Gemini' ? 'Gemini (Search Grounded)' : p}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg run-cluster-btn"
            onClick={handleRunCluster}
            disabled={loading}
          >
            {loading ? (
              <>
                <Zap size={18} className="animate-spin" />
                <span>Running Parallel Query Audit...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Audit Query Cluster</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <strong>Audit Error:</strong> {error}
        </div>
      )}

      {/* Audit Output */}
      {clusterSummary && comparativeReport && (
        <div className="cluster-results-container">
          {/* Executive Metrics Overview */}
          <div className="grid-4 cluster-stats-row">
            <div className="glass-panel stat-card">
              <span className="stat-label">Mention Rate</span>
              <span className="stat-value mono">
                {clusterSummary.mention_rate_pct.toFixed(0)}%
              </span>
              <span className="stat-hint">
                {clusterSummary.mentions_count} of {clusterSummary.total_queries} queries
              </span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-label">Citation Rate</span>
              <span className="stat-value mono">
                {clusterSummary.citation_rate_pct.toFixed(0)}%
              </span>
              <span className="stat-hint">
                {clusterSummary.citations_count} direct source links
              </span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-label">Share of Voice</span>
              <span className="stat-value mono">
                {(comparativeReport.target_brand?.share_of_voice || 0).toFixed(1)}%
              </span>
              <span className="stat-hint">Among all competing brands</span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-label">Category Winner</span>
              <span className="stat-value highlight mono">
                {comparativeReport.winner_brand}
              </span>
              <span className="stat-hint">Most cited in AI answers</span>
            </div>
          </div>

          {/* Individual Query Intent Breakdown */}
          <div className="queries-matrix-section">
            <h3 className="section-title">Query Cluster Intent Matrix & LLM Responses</h3>
            <p className="section-subtitle">
              Inspect how the AI engine answered each search intent variation:
            </p>

            <div className="queries-list">
              {clusterSummary.results.map((res, idx) => {
                const isExpanded = expandedSnippet === idx;

                return (
                  <div key={idx} className="query-card glass-panel">
                    <div
                      className="query-card-header"
                      onClick={() => setExpandedSnippet(isExpanded ? null : idx)}
                    >
                      <div className="query-header-left">
                        <span className="intent-tag">{res.intent}</span>
                        <h4 className="query-text">"{res.query}"</h4>
                      </div>

                      <div className="query-header-right">
                        <div className="mention-badges">
                          {res.target_mentioned ? (
                            <span className="pill pill-pass">
                              <CheckCircle2 size={13} /> Mentioned ({res.target_position || 'Body'})
                            </span>
                          ) : (
                            <span className="pill pill-fail">
                              <XCircle size={13} /> Not Mentioned
                            </span>
                          )}

                          {res.target_cited ? (
                            <span className="pill pill-indigo">
                              <Globe size={13} /> Cited
                            </span>
                          ) : (
                            <span className="pill pill-warn">No Link</span>
                          )}
                        </div>

                        <button className="expand-btn">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="query-expanded-body">
                        {/* Competitors detected */}
                        {res.competitors_mentioned && res.competitors_mentioned.length > 0 && (
                          <div className="comp-mentioned-row">
                            <span className="comp-mention-label">Competitors Featured:</span>
                            {res.competitors_mentioned.map((c, i) => (
                              <span key={i} className="schema-tag">{c}</span>
                            ))}
                          </div>
                        )}

                        {/* Raw snippet */}
                        <div className="llm-snippet-box">
                          <div className="snippet-header">
                            <span className="snippet-title">Grounding Snippet & LLM Response</span>
                          </div>
                          <p className="snippet-content">{res.raw_response_snippet}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cluster-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .cluster-input-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .cluster-config-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .provider-options {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.35rem;
        }

        .provider-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .provider-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .provider-btn.active {
          background: rgba(99, 102, 241, 0.25);
          border-color: var(--indigo-500);
          color: #ffffff;
        }

        .stat-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.8rem;
          font-family: var(--font-heading);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 1.85rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
        }

        .stat-value.highlight {
          color: var(--indigo-400);
        }

        .stat-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .queries-matrix-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }

        .queries-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .query-card {
          padding: 1.25rem;
          cursor: pointer;
        }

        .query-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .query-header-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .intent-tag {
          font-size: 0.72rem;
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-sm);
          background: rgba(6, 182, 212, 0.15);
          color: var(--cyan-400);
          font-family: var(--font-mono);
          text-transform: uppercase;
        }

        .query-text {
          font-size: 1.02rem;
          color: #ffffff;
        }

        .query-header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mention-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .query-expanded-body {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .comp-mentioned-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .comp-mention-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .llm-snippet-box {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.85rem;
        }

        .snippet-header {
          margin-bottom: 0.35rem;
        }

        .snippet-title {
          font-size: 0.72rem;
          font-family: var(--font-heading);
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .snippet-content {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
