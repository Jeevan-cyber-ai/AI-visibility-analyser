import React, { useState } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  Loader2
} from 'lucide-react';
import type { EvidenceAdvisorResponse, AdvisorRecommendation } from '../types/api';
import { fetchEvidenceAdvisor } from '../services/api';

interface AdvisorViewProps {
  onNavigateToStudio?: (query: string) => void;
}

export const AdvisorView: React.FC<AdvisorViewProps> = ({ onNavigateToStudio }) => {
  const [query, setQuery] = useState<string>('tell me the best workspace and note taking software in 2026');
  const [brandUrl, setBrandUrl] = useState<string>('https://www.notion.so');
  const [competitors, setCompetitors] = useState<string>('https://coda.io, https://clickup.com, https://evernote.com');
  const [provider, setProvider] = useState<string>('Gemini');

  // UI tabs
  const [mainTab, setMainTab] = useState<'recommendations' | 'lost-queries'>('recommendations');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EvidenceAdvisorResponse | null>(null);

  const handleRun = async () => {
    if (!query.trim() || !brandUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const compList = competitors.split(',').map((c) => c.trim()).filter(Boolean);
      const res = await fetchEvidenceAdvisor({
        query: query.trim(),
        brandUrl: brandUrl.trim(),
        competitors: compList,
        provider,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch evidence-grounded advisor recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Derive lost queries from cluster summary
  const getLostQueries = () => {
    if (!data?.cluster_summary?.results) return [];
    return data.cluster_summary.results.filter(
      (r) => !r.target_mentioned && r.competitors_mentioned && r.competitors_mentioned.length > 0
    );
  };

  const lostQueriesList = getLostQueries();

  const getFilteredRecs = (recs: AdvisorRecommendation[]) => {
    if (priorityFilter === 'ALL') return recs;
    return recs.filter((r) => r.priority === priorityFilter);
  };

  const getEvidenceText = (ids: string[]) => {
    if (!data?.evidence) return '';
    const matches = data.evidence.filter((e) => ids.includes(e.id));
    if (matches.length > 0) {
      return matches.map((m) => `${m.id}: ${m.finding}`).join(' • ');
    }
    return ids.join(', ');
  };

  return (
    <div className="advisor-view-container">
      {/* View Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">
            <span className="brand-gradient">AI Advisor</span>: Evidence-Grounded Recommendations
          </h1>
          <p className="view-subtitle">
            Module 5: Every strategic recommendation is algorithmically tied to specific measured evidence items (E1..En) from query audits and citation gaps.
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
              placeholder="e.g. tell me the best workspace and note taking software in 2026"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Target Brand Domain / URL</label>
            <input
              type="text"
              className="studio-input"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
              placeholder="https://www.notion.so"
            />
          </div>

          <div className="input-group full-width">
            <label className="input-label">Competitors (comma separated)</label>
            <input
              type="text"
              className="studio-input"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="https://coda.io, https://clickup.com, https://evernote.com"
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
                <span>Synthesizing Evidence Chain...</span>
              </>
            ) : (
              <>
                <Lightbulb size={16} />
                <span>Run Evidence Advisor Audit</span>
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

      {/* Live Animated Advisor Synthesis Scanner */}
      {loading && (
        <div className="card live-scanner-motion-card">
          <div className="radar-spinner-wrap">
            <div className="radar-circle pulse-1"></div>
            <div className="radar-circle pulse-2"></div>
            <div className="radar-core">
              <Lightbulb size={22} className="text-amber" />
            </div>
          </div>
          <div className="scanner-status-text">
            <h3>Synthesizing Grounded Evidence Chain...</h3>
            <p className="scanner-sub">
              Correlating on-page crawler audits with multi-assistant query outputs:
            </p>
            <div className="scanner-steps mono">
              <span className="step-item step-active">✓ 1. Auditing target domain against 7 GEO factors</span>
              <span className="step-item step-active">✓ 2. Executing multi-intent AI queries across ChatGPT, Gemini, Perplexity</span>
              <span className="step-item step-pulse">⚡ 3. Compiling Evidence IDs (E1..En) and prioritizing lost queries</span>
            </div>
          </div>
        </div>
      )}

      {data ? (
        <div className="advisor-results-wrap">
          {/* Main Top Nav Tabs (Slide 12 & 13) */}
          <div className="advisor-main-nav card">
            <div className="tab-pill-group">
              <button
                className={`tab-pill-btn ${mainTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setMainTab('recommendations')}
              >
                <span>Recommendations ({data.recommendations.length})</span>
              </button>
              <button
                className={`tab-pill-btn ${mainTab === 'lost-queries' ? 'active' : ''}`}
                onClick={() => setMainTab('lost-queries')}
              >
                <span>Lost queries ({lostQueriesList.length})</span>
              </button>
            </div>

            {mainTab === 'recommendations' && (
              <div className="priority-filters-row">
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                  <button
                    key={p}
                    className={`priority-filter-pill ${priorityFilter === p ? 'active' : ''}`}
                    onClick={() => setPriorityFilter(p)}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {mainTab === 'recommendations' ? (
            /* Recommendations Grid (Slide 12) */
            <div className="recs-cards-grid">
              {getFilteredRecs(data.recommendations).map((rec, idx) => (
                <div key={idx} className="rec-card card">
                  <div className="rec-badge-row">
                    <span
                      className={`badge ${
                        rec.priority === 'HIGH'
                          ? 'badge-rose'
                          : rec.priority === 'MEDIUM'
                          ? 'badge-amber'
                          : 'badge-slate'
                      }`}
                    >
                      {rec.priority.toLowerCase()}
                    </span>
                    <span className="badge badge-slate">{rec.category || 'Content'}</span>
                    <span className="badge badge-indigo">Effort: {rec.effort || 'medium'}</span>
                  </div>

                  <h3 className="rec-title">{rec.title}</h3>
                  <p className="rec-desc">{rec.recommendation}</p>

                  <div className="rec-based-on mono">
                    <span className="based-label">Based on:</span>{' '}
                    <span>{getEvidenceText(rec.evidence_ids)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Lost Queries Table View (Slide 13) */
            <div className="lost-queries-view card">
              <div className="lost-queries-header">
                <h2>Queries lost to competitors</h2>
                <p>
                  These user search questions triggered AI answers that recommended competitors while omitting your brand. Click{' '}
                  <strong>"Write a blog for this"</strong> to draft a GEO-optimized answer in Content Studio.
                </p>
              </div>

              <div className="lost-queries-table">
                {lostQueriesList.length > 0 ? (
                  lostQueriesList.map((lq, idx) => (
                    <div key={idx} className="lost-query-row">
                      <div className="lost-query-info">
                        <div className="lost-query-text">{lq.query}</div>
                        <div className="lost-query-meta">
                          <span className="meta-label">Lost on:</span>
                          <span className="assistant-tag mono">
                            {lq.assistant || 'Gemini Grounded'}
                          </span>
                          <span className="meta-sep">•</span>
                          <span className="meta-label">to:</span>
                          {lq.competitors_mentioned.map((comp, cIdx) => (
                            <span key={cIdx} className="comp-winner-tag">
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="lost-query-action">
                        <button
                          className="btn btn-secondary btn-sm write-blog-btn"
                          onClick={() => {
                            if (onNavigateToStudio) {
                              onNavigateToStudio(lq.query);
                            }
                          }}
                        >
                          <PenTool size={13} />
                          <span>Write a blog for this</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-lost-queries">
                    <CheckCircle2 size={24} className="text-emerald" />
                    <span>No queries were lost to competitors in this audit run!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="empty-state-box card">
          <div className="empty-icon-circle">
            <Lightbulb size={32} className="text-indigo" />
          </div>
          <h2>Evidence-Grounded Recommendation Engine</h2>
          <p>
            Unlike generic SEO tools that offer vague checklists, the AI Advisor measures your crawler access, citation gaps, and organic mention rates, assigns precise evidence IDs (E1..En), and builds defensible action cards.
          </p>
        </div>
      )}

      <style>{`
        .advisor-view-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .advisor-results-wrap {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .advisor-main-nav {
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

        .priority-filters-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .priority-filter-pill {
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .priority-filter-pill.active {
          background: var(--grad-primary);
          color: #ffffff;
          border-color: transparent;
        }

        /* Recommendation cards grid (Slide 12) */
        .recs-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 1.25rem;
        }

        .rec-card {
          padding: 1.5rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .rec-card:hover {
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateY(-2px);
        }

        .rec-badge-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .rec-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.35;
          margin: 0;
        }

        .rec-desc {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin: 0;
          flex-grow: 1;
        }

        .rec-based-on {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: rgba(7, 9, 14, 0.45);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          border-left: 2px solid var(--indigo-500);
          line-height: 1.4;
        }

        .based-label {
          color: var(--indigo-400);
          font-weight: 600;
        }

        /* Lost queries table (Slide 13) */
        .lost-queries-view {
          padding: 1.5rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }

        .lost-queries-header h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.35rem;
        }

        .lost-queries-header p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
        }

        .lost-queries-table {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .lost-query-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.15rem 1.35rem;
          border-bottom: 1px solid var(--border-subtle);
          gap: 1.5rem;
          transition: background 0.15s ease;
        }

        .lost-query-row:last-child {
          border-bottom: none;
        }

        .lost-query-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .lost-query-info {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .lost-query-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.4;
        }

        .lost-query-meta {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78rem;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        .meta-label {
          color: var(--text-muted);
        }

        .assistant-tag {
          padding: 0.15rem 0.45rem;
          background: rgba(30, 41, 59, 0.6);
          border-radius: var(--radius-sm);
          color: #94a3b8;
          font-size: 0.74rem;
        }

        .comp-winner-tag {
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-size: 0.74rem;
          font-weight: 600;
        }

        .meta-sep {
          color: var(--border-medium);
        }

        .write-blog-btn {
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .live-scanner-motion-card {
          padding: 2rem;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(40, 20, 10, 0.4));
          border: 1px solid rgba(245, 158, 11, 0.5);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 2rem;
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.15);
        }

        .radar-spinner-wrap {
          position: relative;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .radar-circle {
          position: absolute;
          border-radius: 50%;
          border: 2px solid #f59e0b;
          animation: radarPulseAdvisor 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
        }

        .pulse-1 {
          width: 100%;
          height: 100%;
        }

        .pulse-2 {
          width: 100%;
          height: 100%;
          animation-delay: -1s;
        }

        .radar-core {
          z-index: 2;
          background: #451a03;
          border-radius: 50%;
          padding: 0.6rem;
          display: flex;
        }

        @keyframes radarPulseAdvisor {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .scanner-status-text h3 {
          margin: 0 0 0.35rem 0;
          color: #ffffff;
          font-size: 1.1rem;
        }

        .scanner-sub {
          margin: 0 0 0.75rem 0;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .scanner-steps {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.8rem;
        }

        .step-item.step-active {
          color: #34d399;
        }

        .step-item.step-pulse {
          color: #fbbf24;
          font-weight: 700;
          animation: textBlink 1.5s infinite;
        }

        @keyframes textBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .empty-lost-queries {
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: #34d399;
          font-size: 0.95rem;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .recs-cards-grid {
            grid-template-columns: 1fr;
          }
          .lost-query-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};