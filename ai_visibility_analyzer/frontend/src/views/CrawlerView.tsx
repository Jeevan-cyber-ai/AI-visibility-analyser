import React, { useState } from 'react';
import {
  Globe,
  Search,
  Zap,
  Plus,
  Trash2,
  ShieldAlert,
  Building2,
  FlaskConical,
  Compass,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles
} from 'lucide-react';
import type { ComparativePageAudit } from '../types/api';
import { compareCompetitors, discoverCompetitors } from '../services/api';
import { ScoreRing } from '../components/ScoreRing';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { FactorCard } from '../components/FactorCard';
import { RecommendationsRoadmap } from '../components/RecommendationsRoadmap';
import { CrawlerPipelineStream } from '../components/CrawlerPipelineStream';

type AuditMode = 'real-apps' | 'our-project';

export const CrawlerView: React.FC = () => {
  const [auditMode, setAuditMode] = useState<AuditMode>('real-apps');

  // Input states
  const [targetUrl, setTargetUrl] = useState<string>('https://www.notion.com');
  const [competitors, setCompetitors] = useState<string[]>([
    'https://coda.io',
    'https://clickup.com',
  ]);
  const [searchQuery, setSearchQuery] = useState<string>(
    'tell me the best workspace and note taking software in 2026'
  );
  const [includeQueryAudit, setIncludeQueryAudit] = useState<boolean>(true);
  const [provider, setProvider] = useState<string>('Gemini');
  const [newCompetitor, setNewCompetitor] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [discovering, setDiscovering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparativePageAudit | null>(null);
  const [expandedSnippet, setExpandedSnippet] = useState<number | null>(null);

  const handleAudit = async (urlToTest?: string, compsToTest?: string[], queryToTest?: string) => {
    const url = urlToTest || targetUrl;
    const comps = compsToTest || competitors;
    const q = includeQueryAudit ? (queryToTest || searchQuery) : undefined;
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await compareCompetitors(url, comps, q, provider);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Audit failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !competitors.includes(newCompetitor.trim())) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const applyRealAppPreset = (target: string, rivals: string[], queryStr: string) => {
    setTargetUrl(target);
    setCompetitors(rivals);
    setSearchQuery(queryStr);
    handleAudit(target, rivals, queryStr);
  };

  const applyProjectPreset = (target: string, queryStr: string) => {
    setTargetUrl(target);
    const rivals = [
      'https://linear.app',
      'https://clickup.com',
      'https://atlassian.com/software/jira',
    ];
    setCompetitors(rivals);
    setSearchQuery(queryStr);
    handleAudit(target, rivals, queryStr);
  };

  const handleAutoDiscover = async () => {
    if (!targetUrl.trim()) return;
    setDiscovering(true);
    try {
      const domain = targetUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
      const brandGuess = domain.split('.')[0];
      const data = await discoverCompetitors(brandGuess, 3, provider);
      if (data.competitors && data.competitors.length > 0) {
        const discoveredUrls = data.competitors
          .map((c) => c.url)
          .filter((u) => u && u !== targetUrl);
        setCompetitors(discoveredUrls);
      }
    } catch (err) {
      console.warn('Auto-discovery failed:', err);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className="crawler-view">
      {/* View Header */}
      <div className="view-intro">
        <h2 className="view-title">Unified GEO Crawler & AI Search Citation Benchmark</h2>
        <p className="view-desc">
          Audit any website (live app or unoptimized test site) combining <strong>on-page GEO crawler signals</strong> with <strong>real-time search-grounded LLM query audits</strong> to benchmark your target and competitors side-by-side.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mode-switcher-container">
        <button
          className={`mode-tab-btn ${auditMode === 'real-apps' ? 'active' : ''}`}
          onClick={() => {
            setAuditMode('real-apps');
            setTargetUrl('https://www.notion.com');
            setCompetitors(['https://coda.io', 'https://clickup.com']);
            setSearchQuery('tell me the best workspace and note taking software in 2026');
          }}
        >
          <Building2 size={16} />
          <span>Audit Real-World Production Apps (e.g. Notion, Linear, Coda)</span>
        </button>

        <button
          className={`mode-tab-btn ${auditMode === 'our-project' ? 'active' : ''}`}
          onClick={() => {
            setAuditMode('our-project');
            setTargetUrl('sample_site/v1_baseline/index.html');
            setCompetitors([
              'https://linear.app',
              'https://clickup.com',
              'https://atlassian.com/software/jira',
            ]);
            setSearchQuery('tell me the best agile sprint management software in 2026');
          }}
        >
          <FlaskConical size={16} />
          <span>Audit Our Own Website (Unoptimized HTML / Vercel Live)</span>
        </button>
      </div>

      {/* Top Layout Grid: Input Form + Live Crawler Pipe */}
      <div className="top-layout-grid">
        {/* Target URL & Query Input Panel */}
        <div className="audit-input-panel glass-panel">
        <div className="grid-2">
          {/* Target Website */}
          <div className="input-group">
            <label className="input-label">
              {auditMode === 'real-apps'
                ? 'Target Production Website URL'
                : 'Target Website URL or Local HTML File Path'}
            </label>
            <div className="url-field-wrap">
              <Globe size={18} className="url-icon" />
              <input
                type="text"
                className="input-field url-field"
                placeholder={
                  auditMode === 'real-apps'
                    ? 'https://www.notion.com'
                    : 'sample_site/v1_baseline/index.html or https://my-site.vercel.app'
                }
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
              />
            </div>
          </div>

          {/* Seed Search Query */}
          <div className="input-group">
            <div className="query-label-row">
              <label className="input-label">Seed Search Query for AI Engine Evaluation</label>
              <label className="toggle-query-label">
                <input
                  type="checkbox"
                  checked={includeQueryAudit}
                  onChange={(e) => setIncludeQueryAudit(e.target.checked)}
                />
                <span>Include Live LLM Search</span>
              </label>
            </div>
            <div className="url-field-wrap">
              <Search size={18} className="url-icon" />
              <input
                type="text"
                className={`input-field url-field ${!includeQueryAudit ? 'opacity-50' : ''}`}
                placeholder="e.g. tell me the best workspace and note taking software in 2026"
                value={searchQuery}
                disabled={!includeQueryAudit}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
              />
            </div>
          </div>
        </div>

        {/* Engine and Action Row */}
        <div className="engine-action-row">
          <div className="engine-selector-box">
            <span className="input-label">LLM Engine:</span>
            <div className="provider-options">
              {['Gemini', 'Groq', 'Mistral'].map((p) => (
                <button
                  key={p}
                  className={`provider-chip ${provider === p ? 'active' : ''}`}
                  onClick={() => setProvider(p)}
                >
                  <Cpu size={13} />
                  <span>{p === 'Gemini' ? 'Gemini 2.5 (Search Grounded)' : p}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg audit-submit-btn"
            onClick={() => handleAudit()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Zap size={18} className="animate-spin" />
                <span>
                  {includeQueryAudit
                    ? 'Crawling Page & Evaluating LLM Query...'
                    : 'Auditing Page & Robots...'}
                </span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Audit & Benchmark Target vs Competitors</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Presets Based on Mode */}
        {auditMode === 'real-apps' ? (
          <div className="presets-row">
            <span className="presets-label">Real-World Presets:</span>
            <button
              className="preset-chip real-app"
              onClick={() =>
                applyRealAppPreset(
                  'https://www.notion.com',
                  ['https://coda.io', 'https://clickup.com'],
                  'tell me the best workspace and note taking software in 2026'
                )
              }
            >
              📓 Notion vs Coda & ClickUp
            </button>
            <button
              className="preset-chip real-app"
              onClick={() =>
                applyRealAppPreset(
                  'https://linear.app',
                  ['https://atlassian.com/software/jira', 'https://clickup.com'],
                  'best issue tracking and sprint software in 2026'
                )
              }
            >
              ⚡ Linear vs Jira & ClickUp
            </button>
            <button
              className="preset-chip real-app"
              onClick={() =>
                applyRealAppPreset(
                  'https://bitdefender.com',
                  ['https://norton.com', 'https://mcafee.com'],
                  'tell me the best cloud antivirus software in 2026'
                )
              }
            >
              🛡️ Bitdefender vs Norton & McAfee
            </button>
          </div>
        ) : (
          <div className="presets-row">
            <span className="presets-label">Our Site Presets:</span>
            <button
              className="preset-chip unoptimized"
              onClick={() =>
                applyProjectPreset(
                  'sample_site/v1_baseline/index.html',
                  'tell me the best agile sprint management software in 2026'
                )
              }
            >
              🚨 Step 1: Unoptimized Starting Site (Grade F)
            </button>
            <button
              className="preset-chip optimized"
              onClick={() =>
                applyProjectPreset(
                  'sample_site/v2_optimized/index.html',
                  'tell me the best agile sprint management software in 2026'
                )
              }
            >
              🏆 Step 2: Applied GEO Fixes (Grade A)
            </button>
            <button
              className="preset-chip live-vercel"
              onClick={() =>
                applyProjectPreset(
                  'https://pulsetask.vercel.app',
                  'tell me the best agile sprint management software in 2026'
                )
              }
            >
              🌐 Step 3: Live Vercel Deployment
            </button>
          </div>
        )}

        {/* Competitor Benchmarks Drawer */}
        <div className="competitors-section">
          <div className="comp-label-row">
            <div>
              <span className="input-label">Competitor Benchmarks ({competitors.length})</span>
              <span className="comp-hint">
                {' '}— each competitor's live webpage & robots.txt will be crawled and benchmarked
              </span>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleAutoDiscover}
              disabled={discovering || !targetUrl.trim()}
              title="Auto-discover rivals using AI"
            >
              {discovering ? <Zap size={13} className="animate-spin" /> : <Compass size={13} />}
              <span>{discovering ? 'Discovering...' : 'Auto-Discover Competitors via AI'}</span>
            </button>
          </div>

          <div className="competitor-tags">
            {competitors.map((comp, idx) => (
              <span key={idx} className="comp-tag">
                <span className="comp-tag-text">{comp}</span>
                <button
                  className="comp-tag-remove"
                  onClick={() => removeCompetitor(idx)}
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>

          <div className="add-comp-row">
            <input
              type="text"
              className="input-field comp-input"
              placeholder="Add another competitor URL (e.g. https://coda.io or https://asana.com)"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
            />
            <button className="btn btn-secondary btn-sm" onClick={addCompetitor}>
              <Plus size={14} /> Add Rival
            </button>
          </div>
        </div>
        </div>

        {/* Live Crawling & Scraping Pipeline Stepper */}
        <CrawlerPipelineStream
          loading={loading}
          targetUrl={targetUrl}
          competitors={competitors}
          searchQuery={searchQuery}
          includeQueryAudit={includeQueryAudit}
          result={result}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-alert">
          <ShieldAlert size={20} />
          <div>
            <strong>Audit Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="audit-results-container">
          {/* Top Overview Grid */}
          <div className="grid-2 top-stats-grid">
            {/* Score Ring & Summary Card */}
            <div className="glass-panel score-summary-card">
              <div className="score-ring-wrap">
                <ScoreRing
                  score={result.target_audit.overall_score}
                  grade={result.target_audit.grade}
                  size={190}
                  label="Target GEO Score"
                />
              </div>

              <div className="score-summary-details">
                <div className="target-name-header">
                  <h3>{result.target_brand}</h3>
                  <span className={`grade-badge grade-${result.target_audit.grade}`}>
                    {result.target_audit.grade}
                  </span>
                </div>
                <p className="target-url-text mono">{result.target_audit.url_or_path}</p>

                <div className="rank-highlight-box">
                  <div className="rank-label-small">CURRENT LEADERBOARD RANKING</div>
                  <div className="rank-value-large">
                    Rank #{result.rank_position} of {result.total_sites}
                  </div>
                  <div className="rank-diff-text">
                    {result.rank_position === 1 ? (
                      <span className="text-emerald">★ #1 Leader in Generative Search Visibility</span>
                    ) : (
                      <span className="text-rose">
                        Lagging behind {result.winner_brand}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Audit Metrics Card */}
            <div className="glass-panel metrics-grid-card">
              <h4 className="card-subheading">
                {result.cluster_summary
                  ? `AI Search Performance for "${result.query || searchQuery}"`
                  : `Crawl & Signal Summary for ${result.target_brand}`}
              </h4>

              {result.cluster_summary ? (
                <div className="metrics-quad">
                  <div className="quad-item">
                    <div className="quad-label">AI Mention Rate</div>
                    <div className="quad-value mono">
                      {result.cluster_summary.mention_rate_pct.toFixed(0)}%
                    </div>
                    <div className="quad-desc">
                      {result.cluster_summary.mentions_count} of {result.cluster_summary.total_queries} queries
                    </div>
                  </div>

                  <div className="quad-item">
                    <div className="quad-label">AI Citation Rate</div>
                    <div className="quad-value mono">
                      {result.cluster_summary.citation_rate_pct.toFixed(0)}%
                    </div>
                    <div className="quad-desc">Direct source link citations</div>
                  </div>

                  <div className="quad-item">
                    <div className="quad-label">Share of Voice</div>
                    <div className="quad-value mono text-indigo">
                      {result.brand_query_scores &&
                      result.brand_query_scores[result.target_brand.toLowerCase()]
                        ? `${result.brand_query_scores[result.target_brand.toLowerCase()].share_of_voice.toFixed(1)}%`
                        : '0%'}
                    </div>
                    <div className="quad-desc">Among tested competitors</div>
                  </div>

                  <div className="quad-item">
                    <div className="quad-label">Robots AI Access</div>
                    <div className="quad-value">
                      {result.target_audit.stats_summary?.has_robots_txt ? (
                        <span className="pill pill-pass">Allowed</span>
                      ) : (
                        <span className="pill pill-fail">Blocked</span>
                      )}
                    </div>
                    <div className="quad-desc">GPTBot & Perplexity access</div>
                  </div>
                </div>
              ) : (
                <div className="metrics-quad">
                  <div className="quad-item">
                    <div className="quad-label">Robots AI Access</div>
                    <div className="quad-value">
                      {result.target_audit.stats_summary?.has_robots_txt ? (
                        <span className="pill pill-pass">Allowed</span>
                      ) : (
                        <span className="pill pill-fail">Blocked / Missing</span>
                      )}
                    </div>
                    <div className="quad-desc">GPTBot & Perplexity access</div>
                  </div>

                  <div className="quad-item">
                    <div className="quad-label">Structured Schema</div>
                    <div className="quad-value mono">
                      {result.target_audit.stats_summary?.schemas_detected?.length || 0} Types
                    </div>
                    <div className="quad-desc">JSON-LD knowledge graphs</div>
                  </div>

                  <div className="quad-item">
                    <div className="quad-label">Direct Q&A Answers</div>
                    <div className="quad-value mono">
                      {result.target_audit.stats_summary?.direct_answers_count || 0} Sections
                    </div>
                    <div className="quad-desc">Zero-click headings & answers</div>
                  </div>

                  <div className="quad-item">
                    <div className="quad-label">Empirical Stats</div>
                    <div className="quad-value mono">
                      {result.target_audit.stats_summary?.statistics_detected_count || 0} Citations
                    </div>
                    <div className="quad-desc">Hard metrics & benchmark data</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Integrated Competitor Leaderboard Table */}
          <LeaderboardTable
            targetBrand={result.target_brand}
            targetAudit={result.target_audit}
            competitors={result.competitors}
            rankPosition={result.rank_position}
            brandQueryScores={result.brand_query_scores}
            query={result.query}
          />

          {/* AI Generative Search Query Breakdown (if query audit was executed) */}
          {result.cluster_summary && (
            <div className="glass-panel query-cluster-section">
              <div className="query-section-header">
                <div className="query-header-icon-box">
                  <Sparkles size={20} className="text-indigo" />
                </div>
                <div>
                  <h3 className="section-title">
                    AI Generative Search Query Intent Breakdown
                  </h3>
                  <p className="section-subtitle">
                    How Google Search Grounded LLMs answered search intents for "{result.query}":
                  </p>
                </div>
              </div>

              <div className="queries-list">
                {result.cluster_summary.results.map((res, idx) => {
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
            </div>
          )}

          {/* Clean Descriptive Bullet-Point Recommendations */}
          <RecommendationsRoadmap
            actionableBullets={result.actionable_bullet_points}
            competitiveGapSummary={result.competitive_gap_summary}
            brandName={result.target_brand}
          />

          {/* Individual Factor Breakdown */}
          <div className="factors-section">
            <h3 className="section-title">Deep Factor Analysis & Scoring Breakdown</h3>
            <p className="section-subtitle">
              Inspect each of the 6 core pillars contributing to Generative Engine Optimization for {result.target_brand}:
            </p>

            <div className="factors-list">
              {Object.entries(result.target_audit.factors).map(([key, factor]) => (
                <FactorCard key={key} factorKey={key} factor={factor} />
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .crawler-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .top-layout-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 1.5rem;
          align-items: flex-start;
        }

        @media (max-width: 1100px) {
          .top-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .view-intro {
          margin-bottom: 0.5rem;
        }

        .view-title {
          font-size: 1.75rem;
          color: #ffffff;
          margin-bottom: 0.35rem;
        }

        .view-desc {
          color: var(--text-secondary);
          max-width: 900px;
        }

        .mode-switcher-container {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .mode-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.15rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: rgba(15, 23, 42, 0.6);
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-tab-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .mode-tab-btn.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: var(--indigo-500);
          color: #ffffff;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
        }

        .audit-input-panel {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .query-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .toggle-query-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--indigo-400);
          cursor: pointer;
        }

        .url-field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .url-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }

        .url-field {
          padding-left: 2.75rem;
          font-size: 0.95rem;
        }

        .opacity-50 {
          opacity: 0.5;
        }

        .engine-action-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 0.5rem;
        }

        .engine-selector-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .provider-options {
          display: flex;
          gap: 0.5rem;
        }

        .provider-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .provider-chip:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .provider-chip.active {
          background: rgba(99, 102, 241, 0.25);
          border-color: var(--indigo-500);
          color: #ffffff;
        }

        .audit-submit-btn {
          flex-shrink: 0;
        }

        .presets-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.65rem;
        }

        .presets-label {
          font-size: 0.8rem;
          font-family: var(--font-heading);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .preset-chip {
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-family: var(--font-mono);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .preset-chip:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }

        .preset-chip.real-app:hover {
          border-color: var(--cyan-500);
          color: var(--cyan-400);
        }

        .preset-chip.unoptimized:hover {
          border-color: var(--rose-500);
          color: var(--rose-400);
        }

        .preset-chip.optimized:hover {
          border-color: var(--emerald-500);
          color: var(--emerald-400);
        }

        .preset-chip.live-vercel:hover {
          border-color: var(--indigo-500);
          color: var(--indigo-400);
        }

        .competitors-section {
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .comp-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .comp-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .competitor-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .comp-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          font-size: 0.8rem;
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }

        .comp-tag-remove {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .comp-tag-remove:hover {
          color: var(--rose-400);
        }

        .add-comp-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          max-width: 500px;
        }

        .comp-input {
          font-size: 0.85rem;
          padding: 0.45rem 0.75rem;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
          background: rgba(244, 63, 94, 0.15);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: #fb7185;
          font-size: 0.95rem;
        }

        .audit-results-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .top-stats-grid {
          margin-bottom: 0.5rem;
        }

        .score-summary-card {
          padding: 1.75rem;
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .score-summary-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .target-name-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .target-url-text {
          font-size: 0.82rem;
          color: var(--text-muted);
          word-break: break-all;
        }

        .rank-highlight-box {
          margin-top: 0.5rem;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .rank-label-small {
          font-size: 0.7rem;
          font-family: var(--font-heading);
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }

        .rank-value-large {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffffff;
        }

        .rank-diff-text {
          font-size: 0.82rem;
          margin-top: 0.2rem;
        }

        .metrics-grid-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .card-subheading {
          font-size: 1.1rem;
          color: #ffffff;
        }

        .metrics-quad {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .quad-item {
          background: rgba(10, 16, 30, 0.5);
          border: 1px solid var(--border-subtle);
          padding: 0.85rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .quad-label {
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-family: var(--font-heading);
        }

        .quad-value {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }

        .quad-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .query-cluster-section {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .query-section-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .query-header-icon-box {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .queries-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .query-card {
          padding: 1.15rem;
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
          gap: 0.75rem;
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
          font-size: 0.98rem;
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

        .factors-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .section-title {
          font-size: 1.35rem;
          color: #ffffff;
        }

        .section-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-top: -0.5rem;
          margin-bottom: 0.5rem;
        }

        .text-emerald {
          color: #34d399;
        }

        .text-rose {
          color: #fb7185;
        }

        .text-indigo {
          color: #a5b4fc;
        }

        @media (max-width: 900px) {
          .score-summary-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};
