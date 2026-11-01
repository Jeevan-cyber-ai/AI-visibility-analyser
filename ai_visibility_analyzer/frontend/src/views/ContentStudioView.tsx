import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Code,
  CheckCircle2,
  XCircle,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Wand2,
  Eye
} from 'lucide-react';
import type { ContentDraftResponse } from '../types/api';
import { generateContentDraft } from '../services/api';

interface ContentStudioViewProps {
  initialQuery?: string;
  onNavigateToCrawler?: (url: string) => void;
}

export const ContentStudioView: React.FC<ContentStudioViewProps> = ({
  initialQuery = 'Compare the leading collaborative workspace options for a small team',
  onNavigateToCrawler,
}) => {
  // Input states
  const [question, setQuestion] = useState<string>(initialQuery);
  const [website, setWebsite] = useState<string>('https://www.notion.so');
  const [keywords, setKeywords] = useState<string>('team knowledge base, collaborative workspace, project management');
  const [audience, setAudience] = useState<string>('small teams');
  const [tone, setTone] = useState<string>('helpful and expert');
  const [lengthWords, setLengthWords] = useState<number>(1200);
  const [provider, setProvider] = useState<string>('Gemini');

  // UI tabs
  const [activeTab, setActiveTab] = useState<'article' | 'seo-schema'>('article');
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);

  // Async states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContentDraftResponse | null>(null);

  // Quick select lost queries from analysis
  const lostQueries = [
    'Compare the leading collaborative workspace options for a small team',
    'Which project management software is the most reliable for long-term use?',
    'How do I choose the right team knowledge base? Give me specific options.',
    'What are the main differences between the most popular team knowledge base tools?',
    "I'm an enterprise IT manager looking for a team knowledge base. What should I pick and why?",
    'Are there free or low-cost team knowledge base options that are actually good?',
  ];

  const handleGenerate = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateContentDraft({
        question: question.trim(),
        website: website.trim(),
        keywords: keywords.trim(),
        audience: audience.trim(),
        tone,
        word_count: lengthWords,
        provider,
      });
      setDraft(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate content draft');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'md' | 'schema') => {
    navigator.clipboard.writeText(text);
    if (type === 'md') {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } else {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="content-studio-container">
      {/* Top Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">
            <span className="brand-gradient">Content Studio</span>: AI Blog Writer
          </h1>
          <p className="view-subtitle">
            Draft authoritative articles designed specifically to answer queries your competitors currently win in AI assistants.
          </p>
        </div>
      </div>

      <div className="studio-layout">
        {/* Left Column: Input Form */}
        <aside className="studio-sidebar-left card">
          <div className="sidebar-header">
            <div className="badge badge-indigo">
              <Wand2 size={13} />
              <span>Prompt & GEO Parameters</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Question to answer</label>
            <textarea
              className="studio-textarea"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Compare the leading collaborative workspace options for a small team"
            />
          </div>

          {/* Quick select lost queries */}
          <div className="lost-queries-box">
            <div className="lost-queries-label">
              <span>Queries you lost in your last analysis:</span>
            </div>
            <div className="lost-queries-list">
              {lostQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`lost-query-pill ${question === q ? 'active' : ''}`}
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Your website</label>
            <input
              type="text"
              className="studio-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.notion.so"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Keywords (first is primary)</label>
            <input
              type="text"
              className="studio-input"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="team knowledge base, collaborative workspace"
            />
          </div>

          <div className="grid-2-col">
            <div className="input-group">
              <label className="input-label">Audience</label>
              <input
                type="text"
                className="studio-input"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="small teams"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Tone</label>
              <select
                className="studio-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="helpful and expert">Helpful & Expert</option>
                <option value="objective and technical">Objective & Technical</option>
                <option value="comparative and decisive">Comparative & Decisive</option>
                <option value="concise executive">Concise Executive</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <div className="slider-label-row">
              <label className="input-label">Target Length</label>
              <span className="mono slider-value">{lengthWords} words</span>
            </div>
            <input
              type="range"
              min={400}
              max={2000}
              step={100}
              value={lengthWords}
              onChange={(e) => setLengthWords(Number(e.target.value))}
              className="studio-slider"
            />
          </div>

          <div className="input-group">
            <label className="input-label">LLM Writer Engine</label>
            <div className="engine-select-row">
              {['Gemini', 'Groq', 'Mistral', 'Claude'].map((eng) => (
                <button
                  key={eng}
                  type="button"
                  className={`engine-chip-btn ${provider === eng ? 'active' : ''}`}
                  onClick={() => setProvider(eng)}
                >
                  {eng}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary submit-btn"
            onClick={handleGenerate}
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Generating GEO-Optimized Draft...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Write a new draft</span>
              </>
            )}
          </button>

          {error && (
            <div className="error-alert">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}
        </aside>

        {/* Center / Right Content Area */}
        <main className="studio-main">
          {draft ? (
            <>
              {/* Executive Stat Strip */}
              <div className="studio-metrics-strip">
                <div className="metric-box card">
                  <div className="metric-caption">GEO checklist</div>
                  <div className="metric-num-row">
                    <span className="metric-value-large mono">{draft.geo_score}</span>
                    <span className="metric-denom mono">/100</span>
                  </div>
                </div>

                <div className="metric-box card">
                  <div className="metric-caption">Words</div>
                  <div className="metric-num-row">
                    <span className="metric-value-large mono">{draft.word_count}</span>
                  </div>
                </div>

                <div className="metric-box card metric-alert-box">
                  <div className="metric-caption">Facts to confirm</div>
                  <div className="metric-num-row">
                    <span className="metric-value-large metric-amber mono">
                      {draft.facts_to_confirm.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-tabs & Action Toolbar */}
              <div className="studio-toolbar">
                <div className="tab-pill-group">
                  <button
                    className={`tab-pill-btn ${activeTab === 'article' ? 'active' : ''}`}
                    onClick={() => setActiveTab('article')}
                  >
                    <BookOpen size={14} />
                    <span>Article Preview</span>
                  </button>
                  <button
                    className={`tab-pill-btn ${activeTab === 'seo-schema' ? 'active' : ''}`}
                    onClick={() => setActiveTab('seo-schema')}
                  >
                    <Code size={14} />
                    <span>SEO and Schema</span>
                  </button>
                </div>

                <div className="toolbar-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyToClipboard(draft.article_markdown, 'md')}
                  >
                    {copiedMd ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                    <span>{copiedMd ? 'Copied' : 'Copy Markdown'}</span>
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => downloadFile(draft.article_markdown, 'article-draft.md', 'text/markdown')}
                  >
                    <Download size={14} />
                    <span>Markdown</span>
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => downloadFile(draft.suggested_schema, 'faq-schema.json', 'application/json')}
                  >
                    <Code size={14} />
                    <span>Schema</span>
                  </button>
                </div>
              </div>

              {/* Two Column Layout for Article & Checklist */}
              <div className="draft-content-grid">
                {/* Center Article Preview */}
                <div className="article-preview-panel card">
                  {activeTab === 'article' ? (
                    <div
                      className="article-body-render"
                      dangerouslySetInnerHTML={{ __html: draft.article_html }}
                    />
                  ) : (
                    /* SEO and Schema Tab (Slide 15) */
                    <div className="seo-schema-view">
                      {/* Search Preview */}
                      <div className="serp-preview-card">
                        <div className="serp-header">
                          <Eye size={15} />
                          <span>Search SERP Preview</span>
                        </div>
                        <div className="serp-box">
                          <div className="serp-url mono">{draft.page_url}</div>
                          <div className="serp-title">{draft.meta_title}</div>
                          <div className="serp-desc">{draft.meta_description}</div>
                        </div>
                        <div className="serp-counts mono">
                          Title {draft.meta_title.length}/60 characters • Description {draft.meta_description.length}/155
                        </div>
                      </div>

                      {/* Keyword Placement Checklist */}
                      {draft.primary_keyword_analysis && (
                        <div className="keyword-placement-card card">
                          <div className="section-title">Keyword placement</div>
                          <ul className="checklist-list">
                            <li className="checklist-item">
                              {draft.primary_keyword_analysis.in_title ? (
                                <CheckCircle2 size={16} className="check-pass" />
                              ) : (
                                <XCircle size={16} className="check-fail" />
                              )}
                              <span>"{draft.primary_keyword_analysis.keyword}" in title</span>
                            </li>
                            <li className="checklist-item">
                              {draft.primary_keyword_analysis.in_first_100_words ? (
                                <CheckCircle2 size={16} className="check-pass" />
                              ) : (
                                <XCircle size={16} className="check-fail" />
                              )}
                              <span>In the first 100 words</span>
                            </li>
                            <li className="checklist-item">
                              {draft.primary_keyword_analysis.in_at_least_one_h2 ? (
                                <CheckCircle2 size={16} className="check-pass" />
                              ) : (
                                <XCircle size={16} className="check-fail" />
                              )}
                              <span>In at least one H2</span>
                            </li>
                            <li className="checklist-item">
                              {draft.primary_keyword_analysis.density_status === 'passed' ? (
                                <CheckCircle2 size={16} className="check-pass" />
                              ) : (
                                <XCircle size={16} className="check-fail" />
                              )}
                              <span>
                                Density {draft.primary_keyword_analysis.density_pct}% (aim for 0.5–2.5%)
                              </span>
                            </li>
                          </ul>

                          {draft.secondary_keywords.length > 0 && (
                            <div className="secondary-keywords-row">
                              {draft.secondary_keywords.map((sk, i) => (
                                <span key={i} className="kw-badge mono">
                                  {sk.keyword}: {sk.count}×
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Schema Box */}
                      <div className="schema-display-card card">
                        <div className="schema-header">
                          <div>
                            <div className="schema-title">FAQ schema (JSON-LD)</div>
                            <div className="schema-subtitle">Paste inside the page's &lt;head&gt;</div>
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => copyToClipboard(draft.suggested_schema, 'schema')}
                          >
                            {copiedSchema ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                            <span>{copiedSchema ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="schema-code mono">{draft.suggested_schema}</pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar: GEO Checklist + Facts to Confirm */}
                <aside className="studio-sidebar-right">
                  {/* GEO Checklist Card */}
                  <div className="card checklist-card">
                    <div className="checklist-header">
                      <ShieldCheck size={16} className="text-indigo" />
                      <h3>GEO checklist</h3>
                    </div>
                    <ul className="geo-checklist-list">
                      <li className="geo-check-row">
                        {draft.geo_checklist.direct_answer_at_top ? (
                          <CheckCircle2 size={16} className="check-pass" />
                        ) : (
                          <XCircle size={16} className="check-fail" />
                        )}
                        <span>Direct answer at the top</span>
                      </li>
                      <li className="geo-check-row">
                        {draft.geo_checklist.headings_as_questions ? (
                          <CheckCircle2 size={16} className="check-pass" />
                        ) : (
                          <XCircle size={16} className="check-fail" />
                        )}
                        <span>Headings phrased as questions</span>
                      </li>
                      <li className="geo-check-row">
                        {draft.geo_checklist.comparison_table ? (
                          <CheckCircle2 size={16} className="check-pass" />
                        ) : (
                          <XCircle size={16} className="check-fail" />
                        )}
                        <span>Comparison table</span>
                      </li>
                      <li className="geo-check-row">
                        {draft.geo_checklist.scannable_list ? (
                          <CheckCircle2 size={16} className="check-pass" />
                        ) : (
                          <XCircle size={16} className="check-fail" />
                        )}
                        <span>Scannable list</span>
                      </li>
                      <li className="geo-check-row">
                        {draft.geo_checklist.faq_section ? (
                          <CheckCircle2 size={16} className="check-pass" />
                        ) : (
                          <XCircle size={16} className="check-fail" />
                        )}
                        <span>FAQ with 3+ questions</span>
                      </li>
                      <li className="geo-check-row">
                        {draft.geo_checklist.word_count_700_plus ? (
                          <CheckCircle2 size={16} className="check-pass" />
                        ) : (
                          <XCircle size={16} className="check-fail" />
                        )}
                        <span>700+ words of depth</span>
                      </li>
                      <li className="geo-check-row">
                        {draft.geo_checklist.data_points_or_stats ? (
                          <CheckCircle2 size={16} className="check-pass" />
                        ) : (
                          <XCircle size={16} className="check-fail" />
                        )}
                        <span>Data points or stats</span>
                      </li>
                    </ul>
                  </div>

                  {/* Confirm Before Publishing (Slide 14) */}
                  <div className="card facts-card">
                    <div className="facts-header">
                      <AlertTriangle size={16} className="text-amber" />
                      <div>
                        <h3>Confirm before publishing</h3>
                        <p className="facts-sub">
                          The writer never invents numbers or quotes. Replace each highlight with a real, sourced fact.
                        </p>
                      </div>
                    </div>
                    <div className="facts-list">
                      {draft.facts_to_confirm.map((fact, idx) => (
                        <div key={idx} className="fact-item mono">
                          {fact}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* After Publishing */}
                  <div className="card after-pub-card">
                    <h3>After publishing</h3>
                    <ol className="after-pub-steps">
                      <li>
                        Publish at <span className="mono link-text">{draft.page_url}</span> with the JSON-LD in the page &lt;head&gt;
                      </li>
                      <li>
                        Run a re-crawl on the Live GEO Crawler tab to verify the +GEO score delta.
                        {onNavigateToCrawler && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginTop: '0.4rem', display: 'block' }}
                            onClick={() => onNavigateToCrawler(draft.page_url)}
                          >
                            Verify on Live Crawler
                          </button>
                        )}
                      </li>
                    </ol>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="empty-studio-state card">
              <div className="empty-icon-circle">
                <Wand2 size={32} className="text-indigo" />
              </div>
              <h2>GEO Content Studio Ready</h2>
              <p>
                Select a lost query from the left panel or enter your target question, then click{' '}
                <strong>"Write a new draft"</strong> to generate an article with direct answer structure, comparison table, FAQPage schema, and verified factual safeguards.
              </p>
              <div className="empty-features-grid">
                <div className="empty-feat">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Direct Answer TL;DR for LLM citation extraction</span>
                </div>
                <div className="empty-feat">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Strict anti-hallucination placeholders ([STAT:...], [SOURCE:...])</span>
                </div>
                <div className="empty-feat">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Automatic FAQPage JSON-LD schema generation</span>
                </div>
                <div className="empty-feat">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Real-time 7-point GEO Checklist grading</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .content-studio-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .studio-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .studio-sidebar-left {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
          padding: 1.25rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }

        .studio-textarea, .studio-input, .studio-select {
          width: 100%;
          background: rgba(7, 9, 14, 0.85);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          padding: 0.65rem 0.85rem;
          font-size: 0.88rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .studio-textarea:focus, .studio-input:focus, .studio-select:focus {
          outline: none;
          border-color: var(--indigo-500);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.25);
        }

        .lost-queries-box {
          background: rgba(7, 9, 14, 0.4);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.75rem;
        }

        .lost-queries-label {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          letter-spacing: 0.04em;
        }

        .lost-queries-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          max-height: 180px;
          overflow-y: auto;
        }

        .lost-query-pill {
          text-align: left;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          padding: 0.45rem 0.65rem;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s ease;
          line-height: 1.3;
        }

        .lost-query-pill:hover {
          color: var(--text-primary);
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .lost-query-pill.active {
          background: rgba(99, 102, 241, 0.25);
          border-color: var(--indigo-500);
          color: #ffffff;
          font-weight: 600;
        }

        .grid-2-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .slider-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }

        .slider-value {
          font-size: 0.8rem;
          color: var(--indigo-400);
          font-weight: 600;
        }

        .studio-slider {
          width: 100%;
          accent-color: var(--indigo-500);
        }

        .engine-select-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.35rem;
        }

        .engine-chip-btn {
          padding: 0.45rem 0.2rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          background: rgba(7, 9, 14, 0.6);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .engine-chip-btn.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: var(--indigo-500);
          color: #ffffff;
        }

        .submit-btn {
          width: 100%;
          justify-content: center;
          padding: 0.85rem;
          font-size: 0.95rem;
          margin-top: 0.5rem;
        }

        .studio-main {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .studio-metrics-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .metric-box {
          padding: 1rem 1.25rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }

        .metric-caption {
          font-size: 0.78rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.35rem;
        }

        .metric-num-row {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .metric-value-large {
          font-size: 1.85rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
        }

        .metric-denom {
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .metric-amber {
          color: #f59e0b;
        }

        .studio-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .tab-pill-group {
          display: flex;
          gap: 0.35rem;
          background: rgba(15, 23, 42, 0.6);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .tab-pill-btn {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab-pill-btn.active {
          background: var(--grad-primary);
          color: #ffffff;
        }

        .toolbar-actions {
          display: flex;
          gap: 0.5rem;
        }

        .draft-content-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.25rem;
          align-items: start;
        }

        .article-preview-panel {
          padding: 2rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          min-height: 600px;
        }

        .article-body-render {
          color: var(--text-primary);
          line-height: 1.7;
          font-size: 0.98rem;
        }

        .article-body-render h1 {
          font-size: 1.85rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 1.25rem;
          line-height: 1.2;
        }

        .article-body-render h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .article-body-render h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .article-body-render p {
          margin-bottom: 1.15rem;
        }

        .article-body-render strong {
          color: #ffffff;
          font-weight: 700;
        }

        .article-body-render table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.88rem;
        }

        .article-body-render th {
          background: rgba(30, 41, 59, 0.8);
          padding: 0.75rem 1rem;
          text-align: left;
          color: #ffffff;
          border-bottom: 2px solid var(--border-medium);
        }

        .article-body-render td {
          padding: 0.7rem 1rem;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        .article-body-render ul, .article-body-render ol {
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }

        .article-body-render li {
          margin-bottom: 0.4rem;
        }

        /* Fact placeholder badges */
        .article-body-render mark.fact-badge {
          background: rgba(245, 158, 11, 0.22);
          border: 1px solid rgba(245, 158, 11, 0.5);
          color: #fcd34d;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.85em;
          display: inline-block;
          margin: 0 0.2rem;
        }

        .studio-sidebar-right {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .checklist-card, .facts-card, .after-pub-card {
          padding: 1.25rem;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }

        .checklist-header, .facts-header {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .checklist-header h3, .facts-header h3, .after-pub-card h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .facts-sub {
          font-size: 0.76rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
          line-height: 1.4;
        }

        .geo-checklist-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        .geo-check-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.86rem;
          color: var(--text-secondary);
        }

        .check-pass {
          color: #10b981;
          flex-shrink: 0;
        }

        .check-fail {
          color: #f43f5e;
          flex-shrink: 0;
        }

        .facts-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .fact-item {
          font-size: 0.75rem;
          background: rgba(245, 158, 11, 0.1);
          border-left: 3px solid #f59e0b;
          padding: 0.45rem 0.65rem;
          color: #fbbf24;
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          line-height: 1.4;
        }

        .after-pub-steps {
          padding-left: 1.2rem;
          margin: 0.75rem 0 0 0;
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .after-pub-steps li {
          margin-bottom: 0.5rem;
        }

        .link-text {
          color: var(--indigo-400);
          word-break: break-all;
        }

        /* SEO & Schema view styling */
        .seo-schema-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .serp-preview-card {
          border: 1px solid var(--border-medium);
          background: rgba(7, 9, 14, 0.6);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .serp-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 0.85rem;
        }

        .serp-box {
          background: rgba(15, 23, 42, 0.9);
          border-radius: var(--radius-sm);
          padding: 1rem;
          border: 1px solid var(--border-subtle);
        }

        .serp-url {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 0.25rem;
        }

        .serp-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: #60a5fa;
          margin-bottom: 0.35rem;
          line-height: 1.3;
        }

        .serp-desc {
          font-size: 0.85rem;
          color: #cbd5e1;
          line-height: 1.4;
        }

        .serp-counts {
          font-size: 0.74rem;
          color: var(--text-muted);
          margin-top: 0.65rem;
        }

        .checklist-list {
          list-style: none;
          padding: 0;
          margin: 0.75rem 0 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.86rem;
          color: var(--text-secondary);
        }

        .secondary-keywords-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 1rem;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border-subtle);
        }

        .kw-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-full);
          background: rgba(30, 41, 59, 0.7);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }

        .schema-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
        }

        .schema-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
        }

        .schema-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .schema-code {
          background: #020617;
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          padding: 1rem;
          font-size: 0.8rem;
          color: #38bdf8;
          max-height: 350px;
          overflow-y: auto;
          line-height: 1.5;
        }

        /* Empty state */
        .empty-studio-state {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          background: rgba(15, 23, 42, 0.5);
          border: 1px dashed var(--border-medium);
          border-radius: var(--radius-lg);
        }

        .empty-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-studio-state h2 {
          font-size: 1.5rem;
          color: #ffffff;
          margin: 0;
        }

        .empty-studio-state p {
          max-width: 600px;
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 0.92rem;
          margin: 0;
        }

        .empty-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
          margin-top: 1rem;
          text-align: left;
        }

        .empty-feat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #f87171;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          padding: 0.65rem;
          border-radius: var(--radius-sm);
        }

        @media (max-width: 1100px) {
          .studio-layout {
            grid-template-columns: 1fr;
          }
          .draft-content-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};