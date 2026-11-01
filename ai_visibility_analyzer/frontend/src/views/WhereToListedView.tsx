import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  Building2,
  Loader2,
  Tv,
  Users,
  Newspaper,
  ListOrdered,
  PenTool
} from 'lucide-react';
import type { CitationGapResponse, CitationGapEntry } from '../types/api';
import { fetchCitationGaps } from '../services/api';

interface WhereToListedViewProps {
  onNavigateToStudio?: (query: string) => void;
}

export const WhereToListedView: React.FC<WhereToListedViewProps> = ({ onNavigateToStudio }) => {
  const [query, setQuery] = useState<string>('tell me the best workspace and note taking software in 2026');
  const [brandUrl, setBrandUrl] = useState<string>('https://www.notion.so');
  const [competitors, setCompetitors] = useState<string>('https://coda.io, https://clickup.com, https://evernote.com');
  const [provider, setProvider] = useState<string>('Gemini');

  const [activeTab, setActiveTab] = useState<'observed' | 'suggested'>('observed');
  const [selectedType, setSelectedType] = useState<string>('all');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CitationGapResponse | null>(null);

  const handleRun = async () => {
    if (!query.trim() || !brandUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const compList = competitors.split(',').map((c) => c.trim()).filter(Boolean);
      const res = await fetchCitationGaps({
        query: query.trim(),
        brandUrl: brandUrl.trim(),
        competitors: compList,
        provider,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze citation gaps');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'platform':
        return (
          <span className="badge badge-indigo">
            <Building2 size={12} /> Review Platform
          </span>
        );
      case 'community':
        return (
          <span className="badge badge-emerald">
            <Users size={12} /> Community
          </span>
        );
      case 'publisher':
        return (
          <span className="badge badge-cyan">
            <Newspaper size={12} /> Publisher
          </span>
        );
      case 'video':
        return (
          <span className="badge badge-amber">
            <Tv size={12} /> Video
          </span>
        );
      case 'listing':
        return (
          <span className="badge badge-slate">
            <ListOrdered size={12} /> Listing
          </span>
        );
      default:
        return <span className="badge badge-slate">{type}</span>;
    }
  };

  const filterEntries = (entries: CitationGapEntry[]) => {
    if (selectedType === 'all') return entries;
    return entries.filter((e) => e.source_type === selectedType);
  };

  return (
    <div className="where-to-listed-container">
      {/* View Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">
            <span className="brand-gradient">Where to Get Listed</span>: Citation Gap Analysis
          </h1>
          <p className="view-subtitle">
            Module 4: Pinpoints the exact 3rd-party platforms, communities, and publishers AI assistants cite when recommending your competitors instead of you.
          </p>
        </div>
      </div>

      {/* Control Card */}
      <div className="card audit-controls-card">
        <div className="controls-grid">
          <div className="input-group">
            <label className="input-label">Seed Search Query</label>
            <input
              type="text"
              className="studio-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. best agile sprint management software"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Target Brand Domain / URL</label>
            <input
              type="text"
              className="studio-input"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
              placeholder="https://pulsetask.io"
            />
          </div>

          <div className="input-group full-width">
            <label className="input-label">Competitors (comma separated)</label>
            <input
              type="text"
              className="studio-input"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="https://coda.io, https://clickup.com"
            />
          </div>
        </div>

        <div className="controls-action-row">
          <div className="engine-select-group">
            <span className="control-label">Assistant:</span>
            {['Gemini', 'Groq', 'Mistral', 'Claude'].map((eng) => (
              <button
                key={eng}
                type="button"
                className={`engine-pill-btn ${provider === eng ? 'active' : ''}`}
                onClick={() => setProvider(eng)}
              >
                {eng}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Harvesting AI Citations...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Run Citation Gap Audit</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {data ? (
        <div className="gap-results-wrapper">
          {/* Executive Gap Banner (Slide 10) */}
          <div className="card gap-summary-banner">
            <div className="summary-banner-content">
              <h2>Sources AI cited when competitors won</h2>
              <p className="summary-banner-desc">
                From <span className="mono bold-text">{data.gap_report.total_answers_analysed}</span> AI answers.
                Competitors were recommended instead of you in{' '}
                <span className="mono bold-amber">{data.gap_report.gap_answers_count}</span> answers.
              </p>
            </div>

            <div className="gap-badges-row">
              <div className="stat-pill">
                <span className="stat-pill-label">Observed Gap Sources</span>
                <span className="stat-pill-val mono">{data.gap_report.observed.length}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-label">Suggested Industry Sources</span>
                <span className="stat-pill-val mono">{data.gap_report.suggested.length}</span>
              </div>
            </div>
          </div>

          {/* Subtabs & Source Type Filter */}
          <div className="gap-toolbar card">
            <div className="tab-pill-group">
              <button
                className={`tab-pill-btn ${activeTab === 'observed' ? 'active' : ''}`}
                onClick={() => setActiveTab('observed')}
              >
                <span>Observed in Answers ({data.gap_report.observed.length})</span>
              </button>
              <button
                className={`tab-pill-btn ${activeTab === 'suggested' ? 'active' : ''}`}
                onClick={() => setActiveTab('suggested')}
              >
                <span>Suggested for Industry ({data.gap_report.suggested.length})</span>
              </button>
            </div>

            <div className="type-filter-group">
              <span className="filter-label">Filter by:</span>
              {['all', 'platform', 'community', 'publisher', 'video', 'listing'].map((t) => (
                <button
                  key={t}
                  className={`type-filter-pill ${selectedType === t ? 'active' : ''}`}
                  onClick={() => setSelectedType(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Sources List (Slide 10 Table Style) */}
          <div className="sources-list card">
            {activeTab === 'observed' ? (
              filterEntries(data.gap_report.observed).length > 0 ? (
                filterEntries(data.gap_report.observed).map((entry, idx) => (
                  <div key={idx} className="source-row">
                    <div className="source-meta-col">
                      <div className="source-domain-row">
                        <span className="source-domain-name">{entry.domain}</span>
                        {getTypeBadge(entry.source_type)}
                      </div>
                      <div className="source-gap-count mono">
                        Cited <span className="bold-amber">{entry.gap_citation_count}×</span> when you were missing
                      </div>
                      {/* Priority meter bar */}
                      <div className="priority-meter-wrap" title={`Priority score: ${entry.priority}`}>
                        <div
                          className="priority-meter-bar"
                          style={{
                            width: `${Math.min(100, (entry.priority / 10) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="source-action-col">
                      <p className="source-action-text">{entry.action}</p>
                      {entry.competitors_seen_with.length > 0 && (
                        <div className="source-competitors-seen">
                          <span className="seen-label">Appeared alongside:</span>
                          {entry.competitors_seen_with.map((comp, cIdx) => (
                            <span key={cIdx} className="competitor-seen-badge">
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}
                      {onNavigateToStudio && (
                        <div style={{ marginTop: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                            onClick={() => onNavigateToStudio(entry.example_queries?.[0] || `How to evaluate ${entry.domain} alternatives in 2026`)}
                          >
                            <PenTool size={12} />
                            <span>Draft Blog in Content Studio</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-sources-filter">No observed sources match the selected filter.</div>
              )
            ) : (
              /* Suggested Sources Tab */
              filterEntries(data.gap_report.suggested).map((entry, idx) => (
                <div key={idx} className="source-row suggested-row">
                  <div className="source-meta-col">
                    <div className="source-domain-row">
                      <span className="source-domain-name">{entry.domain}</span>
                      {getTypeBadge(entry.source_type)}
                    </div>
                    <span className="suggested-tag mono">Industry Standard</span>
                  </div>

                  <div className="source-action-col">
                    <p className="source-action-text">{entry.action}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="empty-state-box card">
          <div className="empty-icon-circle">
            <Layers size={32} className="text-indigo" />
          </div>
          <h2>Analyze Where AI Gets Its Recommendations</h2>
          <p>
            When ChatGPT, Gemini, or Claude recommend a competitor over your brand, they cite specific authoritative sources (G2, Reddit, Capterra, TechRadar, YouTube).
            This tool audits those citation gaps so your marketing team knows exactly where to get listed.
          </p>
        </div>
      )}

      <style>{`
        .where-to-listed-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .audit-controls-card {
          padding: 1.5rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .controls-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .controls-grid .full-width {
          grid-column: 1 / -1;
        }

        .controls-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
        }

        .engine-select-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .control-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .engine-pill-btn {
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: rgba(7, 9, 14, 0.6);
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .engine-pill-btn.active {
          background: rgba(99, 102, 241, 0.25);
          border-color: var(--indigo-500);
          color: #ffffff;
        }

        .gap-results-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .gap-summary-banner {
          padding: 1.5rem 1.75rem;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.25rem;
        }

        .summary-banner-content h2 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.4rem;
        }

        .summary-banner-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .bold-text {
          color: #ffffff;
          font-weight: 700;
        }

        .bold-amber {
          color: #f59e0b;
          font-weight: 700;
        }

        .gap-badges-row {
          display: flex;
          gap: 0.85rem;
        }

        .stat-pill {
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          padding: 0.6rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-pill-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .stat-pill-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #ffffff;
        }

        .gap-toolbar {
          padding: 0.85rem 1.25rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .type-filter-group {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .filter-label {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-right: 0.25rem;
        }

        .type-filter-pill {
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .type-filter-pill.active {
          background: var(--grad-primary);
          color: #ffffff;
          border-color: transparent;
        }

        .sources-list {
          padding: 0;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .source-row {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          padding: 1.5rem 1.75rem;
          border-bottom: 1px solid var(--border-subtle);
          align-items: center;
          transition: background 0.15s ease;
        }

        .source-row:last-child {
          border-bottom: none;
        }

        .source-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .source-meta-col {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .source-domain-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .source-domain-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }

        .source-gap-count {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .priority-meter-wrap {
          width: 100%;
          height: 5px;
          background: rgba(30, 41, 59, 0.6);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-top: 0.25rem;
        }

        .priority-meter-bar {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          border-radius: var(--radius-full);
        }

        .source-action-col {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .source-action-text {
          font-size: 0.92rem;
          color: var(--text-primary);
          line-height: 1.5;
          margin: 0;
        }

        .source-competitors-seen {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .seen-label {
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .competitor-seen-badge {
          font-size: 0.72rem;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-weight: 600;
        }

        .suggested-tag {
          font-size: 0.72rem;
          color: var(--indigo-400);
        }

        .empty-sources-filter {
          padding: 2.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .empty-state-box {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          border-radius: var(--radius-lg);
        }

        .empty-state-box h2 {
          font-size: 1.45rem;
          color: #ffffff;
          margin: 0;
        }

        .empty-state-box p {
          max-width: 600px;
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 0.92rem;
          margin: 0;
        }

        @media (max-width: 900px) {
          .source-row {
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }
          .controls-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};