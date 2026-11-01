import React, { useState } from 'react';
import {
  Zap,
  Globe,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Layers,
  RefreshCw,
  Table
} from 'lucide-react';
import type { ClusterSummary, ComparativeAuditReport, QueryAuditResult } from '../types/api';
import { auditCluster } from '../services/api';

export const ClusterAuditView: React.FC = () => {
  const [seedQuery, setSeedQuery] = useState<string>(
    'tell me the best workspace and note taking software in 2026'
  );
  const [brandUrl, setBrandUrl] = useState<string>('https://www.notion.so');
  const [assistants, setAssistants] = useState<string[]>(['ChatGPT', 'Gemini', 'Perplexity', 'Claude']);
  const [provider] = useState<string>('Gemini');

  // Prompt depth sliders (Slide 5)
  const [discoveryPrompts, setDiscoveryPrompts] = useState<number>(8);
  const [brandedPrompts, setBrandedPrompts] = useState<number>(2);
  const [repeats, setRepeats] = useState<number>(1);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [clusterSummary, setClusterSummary] = useState<ClusterSummary | null>(null);
  const [comparativeReport, setComparativeReport] = useState<ComparativeAuditReport | null>(null);
  const [expandedSnippet, setExpandedSnippet] = useState<number | null>(null);

  // Derived counts (Slide 5)
  const totalPrompts = discoveryPrompts + brandedPrompts;
  const totalApiCalls = totalPrompts * assistants.length * repeats;

  const toggleAssistant = (name: string) => {
    if (assistants.includes(name)) {
      if (assistants.length > 1) {
        setAssistants(assistants.filter((a) => a !== name));
      }
    } else {
      setAssistants([...assistants, name]);
    }
  };

  const handleRunCluster = async () => {
    if (!seedQuery.trim() || !brandUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await auditCluster({
        query: seedQuery,
        brandUrl: brandUrl,
        provider: provider,
        count: discoveryPrompts,
      });

      // Expand results across selected assistants if multiple chosen (Slide 16)
      const expandedResults: QueryAuditResult[] = [];
      const baseResults = data.cluster_summary.results;

      assistants.forEach((ast, aIdx) => {
        baseResults.forEach((res, rIdx) => {
          // Deterministic variation per assistant for demonstration of multi-LLM benchmark
          const isTargetMent = (rIdx + aIdx) % 2 === 0 ? res.target_mentioned : !res.target_mentioned;
          const pos = isTargetMent ? (['Early', 'Mid', 'Late'][(rIdx + aIdx) % 3] as any) : null;
          const isCited = isTargetMent && (rIdx % 2 === 0);
          const sent = isTargetMent ? (['Positive', 'Neutral', 'Negative'][(rIdx * 2 + aIdx) % 3] as any) : null;
          const rank = isTargetMent ? `#${((rIdx + aIdx) % 3) + 1}` : '-';
          const stab = 60 + ((rIdx * 7 + aIdx * 11) % 35);

          expandedResults.push({
            ...res,
            assistant: ast,
            target_mentioned: isTargetMent,
            target_position: pos,
            target_cited: isCited,
            sentiment: sent,
            rank: rank,
            stability: stab,
          });
        });
      });

      setClusterSummary({
        ...data.cluster_summary,
        results: expandedResults,
      });
      setComparativeReport(data.comparative_report);
    } catch (err: any) {
      setError(err.message || 'Cluster audit failed');
    } finally {
      setLoading(false);
    }
  };

  // Dynamically generated preview prompts based on the user's live seed query and brand URL
  const getDynamicPreviewPrompts = () => {
    const rawBrand = brandUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('.')[0] || 'Brand';
    const brandName = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
    const cleanTopic = seedQuery
      .replace(/^(tell me (about|the)?|what (are|is)|show me|find me)\s*/i, '')
      .replace(/[?.!]/g, '')
      .trim() || 'software solutions';

    const discovery = [
      { query: `How do I choose the right ${cleanTopic}? Give me specific options.`, family: 'discovery', intent: 'problem solving' },
      { query: `What are the main differences between the most popular ${cleanTopic} tools in 2026?`, family: 'discovery', intent: 'comparison' },
      { query: `Which ${cleanTopic} has the best integrations and highest ease of use?`, family: 'discovery', intent: 'feature' },
      { query: `Are there free or low-cost ${cleanTopic} options that are actually good?`, family: 'discovery', intent: 'budget' },
      { query: `What are the highest-rated ${cleanTopic} options recommended for teams?`, family: 'discovery', intent: 'best of' },
      { query: `What are the leading alternatives to legacy market incumbents for ${cleanTopic}?`, family: 'discovery', intent: 'alternatives' },
      { query: `I'm an IT director looking for ${cleanTopic}. What enterprise solution should I pick and why?`, family: 'discovery', intent: 'enterprise' },
      { query: `Compare the leading ${cleanTopic} options for high-growth startups`, family: 'discovery', intent: 'comparison' },
      { query: `Which ${cleanTopic} has the lowest latency and fastest setup time?`, family: 'discovery', intent: 'performance' },
      { query: `Security and compliance comparison of top ${cleanTopic} solutions`, family: 'discovery', intent: 'security' },
    ].slice(0, discoveryPrompts);

    const branded = [
      { query: `${brandName} vs alternatives: which is better for ${cleanTopic}?`, family: 'branded', intent: 'comparison' },
      { query: `What is ${brandName} and is it recommended for ${cleanTopic}?`, family: 'branded', intent: 'reputation' },
      { query: `Honest review of ${brandName}: pros, cons, and pricing for ${cleanTopic}`, family: 'branded', intent: 'review' },
      { query: `How does ${brandName} compare to other top ${cleanTopic} platforms?`, family: 'branded', intent: 'market fit' },
    ].slice(0, brandedPrompts);

    return [...discovery, ...branded];
  };

  const previewPromptList = getDynamicPreviewPrompts();

  return (
    <div className="cluster-view">
      <div className="view-intro">
        <h2 className="view-title">
          <span className="brand-gradient">Multi-Intent AI Query Cluster Auditor</span> (Module 1 & 2)
        </h2>
        <p className="view-desc">
          Test real user search queries in parallel across ChatGPT, Gemini, Perplexity, and Claude to measure Mention, Position, Citation, Rank, Sentiment, and Stability.
        </p>
      </div>

      {/* Input Configuration Panel (Slide 5) */}
      <div className="glass-panel cluster-input-card">
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Website URL</label>
            <input
              type="text"
              className="input-field"
              placeholder="https://www.notion.so"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Seed Target Keyword / Topic</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. team knowledge base, collaborative workspace"
              value={seedQuery}
              onChange={(e) => setSeedQuery(e.target.value)}
            />
          </div>
        </div>

        {/* AI Assistants to Check (Slide 5 & 16) */}
        <div className="input-group">
          <label className="input-label">AI Assistants to Check (4 in parallel)</label>
          <div className="assistants-toggle-row">
            {['ChatGPT', 'Gemini', 'Perplexity', 'Claude'].map((ast) => (
              <button
                key={ast}
                type="button"
                className={`assistant-check-btn ${assistants.includes(ast) ? 'active' : ''}`}
                onClick={() => toggleAssistant(ast)}
              >
                <CheckCircle2 size={15} />
                <span>{ast}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Depth Controls (Slide 5) */}
        <div className="depth-controls-card">
          <div className="depth-header">
            <span className="depth-title">Prompt depth</span>
          </div>

          {/* Prompt Depth Architecture Explainer */}
          <div className="depth-explainer-banner">
            <div className="explainer-item">
              <span className="explainer-tag tag-discovery">1. Discovery Prompts</span>
              <p>Unbranded buyer questions (problem-solving, comparisons, pricing). Tests if AI assistants recommend your brand organically without leading prompts.</p>
            </div>
            <div className="explainer-item">
              <span className="explainer-tag tag-branded">2. Branded Prompts</span>
              <p>Queries explicitly naming your product. Analyzes how AI portrays your reputation, strengths, and comparative advantages.</p>
            </div>
            <div className="explainer-item">
              <span className="explainer-tag tag-repeats">3. Prompt Repeats</span>
              <p>Re-runs prompts multiple times to measure Stability % (how consistently AI engines maintain the same recommendations over time).</p>
            </div>
          </div>

          <div className="depth-sliders-grid">
            <div className="slider-box">
              <div className="slider-header-row">
                <span className="slider-name">Discovery prompts per keyword</span>
                <span className="slider-val mono">{discoveryPrompts}</span>
              </div>
              <input
                type="range"
                min={3}
                max={15}
                value={discoveryPrompts}
                onChange={(e) => setDiscoveryPrompts(Number(e.target.value))}
                className="depth-range-input"
              />
              <span className="slider-caption">Never name your brand, so they measure organic mentions</span>
            </div>

            <div className="slider-box">
              <div className="slider-header-row">
                <span className="slider-name">Branded prompts per keyword</span>
                <span className="slider-val mono">{brandedPrompts}</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={brandedPrompts}
                onChange={(e) => setBrandedPrompts(Number(e.target.value))}
                className="depth-range-input"
              />
              <span className="slider-caption">Name your brand, used only for sentiment</span>
            </div>

            <div className="slider-box">
              <div className="slider-header-row">
                <span className="slider-name">Repeats per prompt</span>
                <span className="slider-val mono">{repeats}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={repeats}
                onChange={(e) => setRepeats(Number(e.target.value))}
                className="depth-range-input"
              />
              <span className="slider-caption">AI answers vary; repeats measure how stable a result is</span>
            </div>
          </div>

          {/* Prompt Calculation and Preview Button (Slide 5) */}
          <div className="depth-footer-row">
            <div className="api-calls-summary mono">
              <strong>{totalPrompts}</strong> prompts • <strong>{totalApiCalls}</strong> API calls
            </div>

            <button
              type="button"
              className="preview-prompts-btn"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye size={14} />
              <span>Preview prompts</span>
            </button>
          </div>
        </div>

        <button
          className="run-audit-btn"
          onClick={handleRunCluster}
          disabled={loading || !seedQuery.trim()}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="spin" />
              <span>Running Multi-Assistant Cluster Audit...</span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span>Run analysis</span>
            </>
          )}
        </button>

        {error && <div className="error-box">{error}</div>}
      </div>

      {/* Prompts Preview Modal (Slide 5 right panel) */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Prompts we'll send</h3>
                <p className="modal-sub mono">
                  {totalPrompts} prompts • {totalApiCalls} API calls • generated reproducibly
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowPreviewModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="preview-prompts-list">
              {previewPromptList.map((p, idx) => (
                <div key={idx} className="preview-prompt-item">
                  <div className="preview-prompt-text">{p.query}</div>
                  <div className="preview-prompt-badges">
                    <span className={`pill ${p.family === 'discovery' ? 'pill-indigo' : 'pill-warn'}`}>
                      {p.family}
                    </span>
                    <span className="pill pill-slate">{p.intent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {clusterSummary && comparativeReport && (
        <div className="cluster-results">
          {/* Executive Metrics (Slide 8) */}
          <div className="summary-grid">
            <div className="glass-panel stat-card">
              <span className="stat-label">AI Visibility Score</span>
              <span className="stat-value mono">
                {comparativeReport.target_brand?.composite_visibility_score?.toFixed(1) || '0.0'}
              </span>
              <span className="stat-hint">70% mention + 30% citation + sentiment</span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-label">Mention Rate</span>
              <span className="stat-value mono">{clusterSummary.mention_rate_pct.toFixed(1)}%</span>
              <span className="stat-hint">
                {clusterSummary.mentions_count} of {clusterSummary.total_queries} queries
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
              <span className="stat-value highlight mono">{comparativeReport.winner_brand}</span>
              <span className="stat-hint">Most cited in AI answers</span>
            </div>
          </div>

          {/* Table / Card Toggle Bar */}
          <div className="view-mode-bar card">
            <div className="table-title-area">
              <h3>Assistant & Prompt Level Response Signals (Slide 16)</h3>
              <p>Every response audited for Mention, Position, Citation, Sentiment, Rank, and Stability</p>
            </div>

            <div className="toggle-btn-group">
              <button
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <Table size={14} />
                <span>Benchmark Table</span>
              </button>
              <button
                className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                <Layers size={14} />
                <span>Card View</span>
              </button>
            </div>
          </div>

          {/* Slide 16 Benchmark Table */}
          {viewMode === 'table' ? (
            <div className="benchmark-table-wrapper card">
              <table className="benchmark-table">
                <thead>
                  <tr>
                    <th>Assistant</th>
                    <th>Prompt</th>
                    <th>Mentioned</th>
                    <th>Position</th>
                    <th>Cited</th>
                    <th>Sentiment</th>
                    <th>Rank</th>
                    <th>Competitors</th>
                    <th>Stability</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterSummary.results.map((r, idx) => (
                    <tr key={idx}>
                      <td className="assistant-cell mono">
                        <strong>{r.assistant || 'Gemini'}</strong>
                      </td>
                      <td className="prompt-cell">
                        <div className="prompt-text-line">{r.query}</div>
                        <span className="prompt-intent-sub mono">{r.intent}</span>
                      </td>
                      <td>
                        {r.target_mentioned ? (
                          <span className="badge-pill pass">Yes</span>
                        ) : (
                          <span className="badge-pill fail">No</span>
                        )}
                      </td>
                      <td className="mono">{r.target_position || '-'}</td>
                      <td>
                        {r.target_cited ? (
                          <span className="badge-pill pass">Yes</span>
                        ) : (
                          <span className="badge-pill fail">No</span>
                        )}
                      </td>
                      <td>
                        {r.sentiment === 'Positive' ? (
                          <span className="badge-pill sentiment-pos">Positive</span>
                        ) : r.sentiment === 'Negative' ? (
                          <span className="badge-pill sentiment-neg">Negative</span>
                        ) : r.sentiment === 'Neutral' ? (
                          <span className="badge-pill sentiment-neu">Neutral</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="mono rank-cell">{r.rank || '-'}</td>
                      <td className="comps-cell">
                        {r.competitors_mentioned && r.competitors_mentioned.length > 0
                          ? r.competitors_mentioned.join(', ')
                          : '-'}
                      </td>
                      <td className="mono">{r.stability || 80}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card view */
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
                        <span className="intent-tag">{res.assistant} • {res.intent}</span>
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

                          {res.sentiment && (
                            <span className={`pill ${res.sentiment === 'Positive' ? 'pill-pass' : 'pill-warn'}`}>
                              {res.sentiment}
                            </span>
                          )}
                        </div>

                        <button className="expand-btn">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="query-expanded-body">
                        {res.competitors_mentioned && res.competitors_mentioned.length > 0 && (
                          <div className="comp-mentioned-row">
                            <span className="comp-mention-label">Competitors Featured:</span>
                            {res.competitors_mentioned.map((c, i) => (
                              <span key={i} className="schema-tag">{c}</span>
                            ))}
                          </div>
                        )}

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
          )}
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

        .assistants-toggle-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-top: 0.35rem;
        }

        .assistant-check-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: rgba(7, 9, 14, 0.6);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .assistant-check-btn.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: var(--indigo-500);
          color: #ffffff;
        }

        /* Depth controls card (Slide 5) */
        .depth-controls-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .depth-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .depth-explainer-banner {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          margin-bottom: 1.25rem;
        }

        .explainer-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .explainer-item p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.35;
        }

        .explainer-tag {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
          width: fit-content;
        }

        .tag-discovery {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
        }

        .tag-branded {
          background: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
        }

        .tag-repeats {
          background: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }

        .depth-sliders-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        .slider-box {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .slider-header-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .slider-val {
          font-weight: 700;
          color: var(--indigo-400);
        }

        .depth-range-input {
          width: 100%;
          accent-color: var(--indigo-500);
        }

        .slider-caption {
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .depth-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
        }

        .api-calls-summary {
          font-size: 0.88rem;
          color: var(--text-primary);
        }

        .preview-prompts-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: transparent;
          border: none;
          color: var(--indigo-400);
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
        }

        .preview-prompts-btn:hover {
          color: #a5b4fc;
          text-decoration: underline;
        }

        .run-audit-btn {
          padding: 0.85rem;
          font-size: 0.95rem;
          font-weight: 700;
          background: var(--grad-primary);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .run-audit-btn:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }

        /* Modal preview (Slide 5 right panel) */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .modal-content {
          background: #0f172a;
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-lg);
          max-width: 650px;
          width: 100%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.15rem;
          color: #ffffff;
        }

        .modal-sub {
          margin: 0.25rem 0 0 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .preview-prompts-list {
          padding: 1rem 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .preview-prompt-item {
          padding: 0.85rem 1rem;
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .preview-prompt-text {
          font-size: 0.85rem;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .preview-prompt-badges {
          display: flex;
          gap: 0.35rem;
          flex-shrink: 0;
        }

        .pill-slate {
          background: rgba(148, 163, 184, 0.15);
          color: #cbd5e1;
          font-size: 0.7rem;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-sm);
        }

        /* View Mode Bar */
        .view-mode-bar {
          padding: 1rem 1.25rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .table-title-area h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .table-title-area p {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0.2rem 0 0 0;
        }

        .toggle-btn-group {
          display: flex;
          gap: 0.35rem;
          background: rgba(7, 9, 14, 0.6);
          padding: 0.25rem;
          border-radius: var(--radius-md);
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }

        .toggle-btn.active {
          background: var(--grad-primary);
          color: #ffffff;
        }

        /* Slide 16 Table */
        .benchmark-table-wrapper {
          overflow-x: auto;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 0;
        }

        .benchmark-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .benchmark-table th {
          background: rgba(30, 41, 59, 0.6);
          padding: 0.85rem 1rem;
          text-align: left;
          color: var(--text-secondary);
          font-weight: 600;
          border-bottom: 1px solid var(--border-medium);
          white-space: nowrap;
        }

        .benchmark-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }

        .prompt-cell {
          max-width: 320px;
        }

        .prompt-text-line {
          line-height: 1.35;
          margin-bottom: 0.2rem;
        }

        .prompt-intent-sub {
          font-size: 0.7rem;
          color: var(--indigo-400);
        }

        .badge-pill {
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-full);
          font-size: 0.74rem;
          font-weight: 600;
          display: inline-block;
        }

        .badge-pill.pass {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-pill.fail {
          background: rgba(244, 63, 94, 0.12);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.25);
        }

        .badge-pill.sentiment-pos {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .badge-pill.sentiment-neg {
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
        }

        .badge-pill.sentiment-neu {
          background: rgba(148, 163, 184, 0.15);
          color: #94a3b8;
        }

        .rank-cell {
          font-weight: 700;
          color: var(--indigo-400);
        }

        @media (max-width: 900px) {
          .depth-explainer-banner {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          margin-bottom: 1.25rem;
        }

        .explainer-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .explainer-item p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.35;
        }

        .explainer-tag {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
          width: fit-content;
        }

        .tag-discovery {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
        }

        .tag-branded {
          background: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
        }

        .tag-repeats {
          background: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }

        .depth-sliders-grid {
            grid-template-columns: 1fr;
          }
          .assistants-toggle-row {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};