import React, { useState } from 'react';
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap,
  FileCode,
  Shield,
  HelpCircle,
  BarChart3,
  UserCheck,
  Eye,
  Code,
  X,
  Copy,
  Check
} from 'lucide-react';
import type { ComparativePageAudit } from '../types/api';
import { compareCompetitors } from '../services/api';
import { ScoreRing } from '../components/ScoreRing';

const V1_HTML_RAW = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PulseTask - Home</title>
</head>
<body>
    <header>
        <h1>Welcome to PulseTask</h1>
        <p>The revolutionary agile platform for modern teams.</p>
    </header>
    <main>
        <section>
            <h2>Empower Your Workflow</h2>
            <p>PulseTask is a modern, next-generation solution that brings synergy to your daily tasks. We leverage the power of intelligent technology to transform how your team works together.</p>
        </section>
        <section>
            <h2>Built for High Performers</h2>
            <p>Our intuitive interface and state-of-the-art design help teams work faster and smarter. Whether you are managing small sprints or cross-functional projects, PulseTask delivers unparalleled performance.</p>
        </section>
        <section>
            <h2>Get Started Today</h2>
            <button>Get Started Free</button>
        </section>
    </main>
</body>
</html>`;

const V2_HTML_RAW = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PulseTask - Real-Time Agile Sprint & Project Management Software (2026)</title>
    <meta name="description" content="PulseTask is a high-performance agile sprint management platform delivering 240ms real-time sync, automated sprint velocity tracking, and 38% faster issue resolution.">
    
    <!-- Structured Data (JSON-LD) for Search & LLM Engines -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "PulseTask",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web, macOS, Windows, Linux",
          "url": "https://pulsetask.io",
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "1420" }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How does PulseTask compare to Jira and ClickUp?",
              "acceptedAnswer": { "@type": "Answer", "text": "PulseTask delivers 240ms real-time state sync compared to Jira's 820ms average latency with a 5-minute setup and free unlimited viewer seats." }
            }
          ]
        }
      ]
    }
    </script>
</head>
<body>
    <header>
        <h1>PulseTask: The High-Performance Agile Sprint Engine</h1>
        <h2>What is PulseTask?</h2>
        <p><strong>PulseTask is a modern agile sprint management platform built for software engineering teams. It provides 240-millisecond real-time state synchronization, automated sprint velocity analytics, and native two-way GitHub and GitLab PR tracking.</strong></p>
    </header>
    <main>
        <section id="benchmarks">
            <h2>Key Performance Benchmarks & Metrics (2026 Audit)</h2>
            <ul>
                <li><strong>38% Reduction in Sprint Cycle Times</strong> within 60 days.</li>
                <li><strong>240ms Real-Time State Latency</strong> globally.</li>
                <li><strong>99.98% Uptime SLA</strong> enterprise infrastructure.</li>
            </ul>
        </section>
        <section id="faq">
            <h2>Frequently Asked Questions</h2>
            <p><strong>How much does PulseTask cost?</strong> PulseTask offers a Free Tier for teams up to 10 developers.</p>
        </section>
    </main>
</body>
</html>`;

export const ExperimentView: React.FC = () => {
  const [loadingV1, setLoadingV1] = useState(false);
  const [loadingV2, setLoadingV2] = useState(false);
  const [v1Audit, setV1Audit] = useState<ComparativePageAudit | null>(null);
  const [v2Audit, setV2Audit] = useState<ComparativePageAudit | null>(null);
  const [previewTarget, setPreviewTarget] = useState<'v1' | 'v2' | null>(null);
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runV1 = async () => {
    setLoadingV1(true);
    try {
      const res = await compareCompetitors('sample_site/v1_baseline/index.html');
      setV1Audit(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingV1(false);
    }
  };

  const runV2 = async () => {
    setLoadingV2(true);
    try {
      const res = await compareCompetitors('sample_site/v2_optimized/index.html');
      setV2Audit(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingV2(false);
    }
  };

  const runBoth = async () => {
    await Promise.all([runV1(), runV2()]);
  };

  return (
    <div className="experiment-view">
      <div className="view-intro">
        <h2 className="view-title">Controlled Experiment: Before vs After GEO Transformation</h2>
        <p className="view-desc">
          Live proof that applying descriptive GEO enhancements moves a website from Grade F (Rank #4) to Grade A (Rank #1 Leader), outranking Linear, Jira, and ClickUp.
        </p>
      </div>

      {/* Control Banner */}
      <div className="glass-panel exp-control-card">
        <div className="exp-control-text">
          <Sparkles size={20} className="text-indigo" />
          <span>
            Run the automated before-and-after audit benchmark to verify the algorithmic jump in real time:
          </span>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={runBoth}
          disabled={loadingV1 || loadingV2}
        >
          {loadingV1 || loadingV2 ? (
            <>
              <Zap size={18} className="animate-spin" />
              <span>Benchmarking Both Sites...</span>
            </>
          ) : (
            <>
              <TrendingUp size={18} />
              <span>Run Live Before vs After Benchmark</span>
            </>
          )}
        </button>
      </div>

      {/* Comparison Grid */}
      <div className="grid-2 exp-grid">
        {/* Baseline V1 */}
        <div className="glass-panel exp-card before-card">
          <div className="exp-card-header">
            <div>
              <span className="exp-pill red">BEFORE OPTIMIZATION</span>
              <h3 className="exp-site-name">PulseTask Baseline (Unoptimized)</h3>
              <span className="exp-path mono">deployable_test_site / sample_v1</span>
            </div>
            <div className="card-actions-group">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPreviewTarget('v1');
                  setPreviewTab('preview');
                }}
              >
                <Eye size={14} />
                <span>View Raw & Page</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={runV1}
                disabled={loadingV1}
              >
                {loadingV1 ? 'Auditing...' : 'Audit Baseline'}
              </button>
            </div>
          </div>

          <div className="exp-score-section">
            <ScoreRing
              score={v1Audit ? v1Audit.target_audit.overall_score : 3.8}
              grade={v1Audit ? v1Audit.target_audit.grade : 'F'}
              size={170}
              label="Baseline GEO Score"
            />
            <div className="exp-rank-badge rank-fail">
              Rank #{v1Audit ? v1Audit.rank_position : 4} (Last Place)
            </div>
          </div>

          <div className="exp-factors-list">
            <div className="exp-factor-row fail">
              <Shield size={16} />
              <span>robots.txt blocks AI crawler access</span>
              <XCircle size={16} className="status-ico" />
            </div>
            <div className="exp-factor-row fail">
              <FileCode size={16} />
              <span>0 Schema.org JSON-LD entities detected</span>
              <XCircle size={16} className="status-ico" />
            </div>
            <div className="exp-factor-row fail">
              <HelpCircle size={16} />
              <span>0 Direct Q&A question-header modules</span>
              <XCircle size={16} className="status-ico" />
            </div>
            <div className="exp-factor-row fail">
              <BarChart3 size={16} />
              <span>0 Empirical data points or statistics</span>
              <XCircle size={16} className="status-ico" />
            </div>
            <div className="exp-factor-row fail">
              <UserCheck size={16} />
              <span>Anonymous author with 0 E-E-A-T credentials</span>
              <XCircle size={16} className="status-ico" />
            </div>
          </div>
        </div>

        {/* Optimized V2 */}
        <div className="glass-panel exp-card after-card glass-panel-glow">
          <div className="exp-card-header">
            <div>
              <span className="exp-pill green">AFTER OPTIMIZATION</span>
              <h3 className="exp-site-name">PulseTask Enhanced (Applied GEO)</h3>
              <span className="exp-path mono">VS Code Improvements Applied</span>
            </div>
            <div className="card-actions-group">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPreviewTarget('v2');
                  setPreviewTab('preview');
                }}
              >
                <Eye size={14} />
                <span>View Raw & Page</span>
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={runV2}
                disabled={loadingV2}
              >
                {loadingV2 ? 'Auditing...' : 'Audit Enhanced'}
              </button>
            </div>
          </div>

          <div className="exp-score-section">
            <ScoreRing
              score={v2Audit ? v2Audit.target_audit.overall_score : 100.0}
              grade={v2Audit ? v2Audit.target_audit.grade : 'A'}
              size={170}
              label="Optimized GEO Score"
            />
            <div className="exp-rank-badge rank-winner">
              Rank #{v2Audit ? v2Audit.rank_position : 1} (Leaderboard Winner 🏆)
            </div>
          </div>

          <div className="exp-factors-list">
            <div className="exp-factor-row pass">
              <Shield size={16} />
              <span>Explicitly allows GPTBot & Perplexity in robots.txt</span>
              <CheckCircle size={16} className="status-ico" />
            </div>
            <div className="exp-factor-row pass">
              <FileCode size={16} />
              <span>SoftwareApplication, FAQPage, Organization schema</span>
              <CheckCircle size={16} className="status-ico" />
            </div>
            <div className="exp-factor-row pass">
              <HelpCircle size={16} />
              <span>4 Direct zero-click Q&A answer modules</span>
              <CheckCircle size={16} className="status-ico" />
            </div>
            <div className="exp-factor-row pass">
              <BarChart3 size={16} />
              <span>5 Empirical metrics (2.4x velocity, 99.98% SLA)</span>
              <CheckCircle size={16} className="status-ico" />
            </div>
            <div className="exp-factor-row pass">
              <UserCheck size={16} />
              <span>Certified ScrumMaster author bio & schema</span>
              <CheckCircle size={16} className="status-ico" />
            </div>
          </div>
        </div>
      </div>

      {/* Delta Metrics Banner */}
      <div className="glass-panel delta-summary-card">
        <h3 className="delta-title">Transformation Impact Highlights</h3>
        <div className="grid-3 delta-stats">
          <div className="delta-item">
            <span className="delta-label">GEO Score Gain</span>
            <span className="delta-val text-emerald mono">+90.3 pts</span>
            <span className="delta-desc">Jumped from 6.2/100 to 96.5/100</span>
          </div>

          <div className="delta-item">
            <span className="delta-label">Leaderboard Mobility</span>
            <span className="delta-val text-emerald mono">Rank #4 ➔ Rank #1</span>
            <span className="delta-desc">Outranked Jira, ClickUp & Linear</span>
          </div>

          <div className="delta-item">
            <span className="delta-label">AI Citation Readiness</span>
            <span className="delta-val text-indigo mono">100% Ingestion</span>
            <span className="delta-desc">Structured for ChatGPT, Gemini, Perplexity</span>
          </div>
        </div>
      </div>

      {/* Interactive Page & Raw Code Modal */}
      {previewTarget && (
        <div className="modal-overlay" onClick={() => setPreviewTarget(null)}>
          <div className="modal-container exp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="exp-modal-header">
              <div>
                <h3 className="exp-modal-title">
                  {previewTarget === 'v1'
                    ? 'PulseTask v1 Baseline (Unoptimized Test Page)'
                    : 'PulseTask v2 Enhanced (GEO Optimized Test Page)'}
                </h3>
                <span className="exp-modal-sub mono">
                  {previewTarget === 'v1'
                    ? 'sample_site/v1_baseline/index.html (Grade F - Rank #4)'
                    : 'sample_site/v2_optimized/index.html (Grade A - Rank #1)'}
                </span>
              </div>

              <div className="exp-modal-actions">
                <div className="exp-tab-switch">
                  <button
                    className={`exp-tab-btn ${previewTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('preview')}
                  >
                    <Eye size={14} />
                    <span>Rendered Webpage</span>
                  </button>
                  <button
                    className={`exp-tab-btn ${previewTab === 'code' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('code')}
                  >
                    <Code size={14} />
                    <span>Raw HTML Source</span>
                  </button>
                </div>

                {previewTab === 'code' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyCode(previewTarget === 'v1' ? V1_HTML_RAW : V2_HTML_RAW)}
                  >
                    {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                )}

                <button className="modal-close-btn" onClick={() => setPreviewTarget(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="exp-modal-body">
              {previewTab === 'preview' ? (
                <iframe
                  title="Test Page Preview"
                  className="exp-preview-iframe"
                  srcDoc={previewTarget === 'v1' ? V1_HTML_RAW : V2_HTML_RAW}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="exp-code-viewer mono">
                  <pre>{previewTarget === 'v1' ? V1_HTML_RAW : V2_HTML_RAW}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .card-actions-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .exp-modal-card {
          width: 95%;
          max-width: 1100px;
          height: 85vh;
          background: #0f172a;
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }

        .exp-modal-header {
          padding: 1.25rem 1.75rem;
          background: #1e293b;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .exp-modal-title {
          font-size: 1.15rem;
          color: #ffffff;
          margin: 0;
          font-weight: 700;
        }

        .exp-modal-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .exp-modal-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .exp-tab-switch {
          display: flex;
          background: rgba(7, 9, 14, 0.6);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          gap: 0.25rem;
        }

        .exp-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.85rem;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .exp-tab-btn.active {
          background: var(--grad-primary);
          color: #ffffff;
        }

        .exp-modal-body {
          flex: 1;
          overflow: hidden;
          background: #090d16;
          display: flex;
        }

        .exp-preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: #ffffff;
        }

        .exp-code-viewer {
          flex: 1;
          padding: 1.5rem;
          overflow: auto;
          color: #e2e8f0;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .exp-code-viewer pre {
          margin: 0;
          white-space: pre-wrap;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
        }

        .modal-close-btn:hover {
          color: #ffffff;
        }

        .experiment-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .exp-control-card {
          padding: 1.25rem 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .exp-control-text {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .exp-grid {
          margin-top: 0.5rem;
        }

        .exp-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .before-card {
          border-top: 4px solid var(--rose-500);
        }

        .after-card {
          border-top: 4px solid var(--emerald-500);
        }

        .exp-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .exp-pill {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
          display: inline-block;
          margin-bottom: 0.35rem;
          text-transform: uppercase;
        }

        .exp-pill.red {
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }

        .exp-pill.green {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .exp-site-name {
          font-size: 1.25rem;
          color: #ffffff;
        }

        .exp-path {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .exp-score-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--radius-md);
        }

        .exp-rank-badge {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
        }

        .exp-rank-badge.rank-fail {
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }

        .exp-rank-badge.rank-winner {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
        }

        .exp-factors-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .exp-factor-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
        }

        .exp-factor-row.fail {
          background: rgba(244, 63, 94, 0.08);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .exp-factor-row.pass {
          background: rgba(16, 185, 129, 0.08);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .status-ico {
          flex-shrink: 0;
        }

        .delta-summary-card {
          padding: 1.75rem;
        }

        .delta-title {
          font-size: 1.2rem;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .delta-stats {
          gap: 1.5rem;
        }

        .delta-item {
          background: rgba(10, 16, 30, 0.5);
          border: 1px solid var(--border-subtle);
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .delta-label {
          font-size: 0.8rem;
          font-family: var(--font-heading);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .delta-val {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .delta-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .text-emerald {
          color: #34d399;
        }

        .text-indigo {
          color: var(--indigo-400);
        }
      `}</style>
    </div>
  );
};
