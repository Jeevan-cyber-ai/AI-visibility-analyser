import React from 'react';
import {
  Globe,
  Search,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { HealthResponse } from '../types/api';
import type { NavTab } from '../components/Navbar';

interface OverviewViewProps {
  health: HealthResponse | null;
  onNavigate: (tab: NavTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ health, onNavigate }) => {
  return (
    <div className="overview-view">
      {/* Hero Welcome Banner */}
      <div className="glass-panel hero-banner glass-panel-glow">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-indigo" />
            <span>Generative Engine Optimization (GEO) Platform</span>
          </div>
          <h1 className="hero-title">
            Dominate AI Search in ChatGPT, Perplexity & Gemini
          </h1>
          <p className="hero-desc">
            Traditional SEO focuses on Google blue links. GEO (Generative Engine Optimization) ensures your brand is indexed by AI crawlers, understood via JSON-LD entity graphs, and actively cited in generative search answers.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onNavigate('crawler')}
            >
              <Globe size={18} />
              <span>Launch Live GEO Crawler</span>
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => onNavigate('experiment')}
            >
              <Award size={18} />
              <span>Explore Before vs After Lab</span>
            </button>
          </div>

          {/* Engine health summary line */}
          <div className="health-status-row">
            {health?.status === 'healthy' ? (
              <span className="health-text text-emerald">
                <CheckCircle2 size={15} /> All AI audit services and live LLMs operational
              </span>
            ) : (
              <span className="health-text text-amber">
                <AlertCircle size={15} /> Connecting to AI Visibility core services...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3 Core Workflow Modules */}
      <div className="grid-3 workflow-grid">
        <div className="glass-panel workflow-card" onClick={() => onNavigate('crawler')}>
          <div className="card-top">
            <div className="card-icon-box indigo">
              <Globe size={22} />
            </div>
            <span className="step-tag mono">PILLAR 1</span>
          </div>
          <h3 className="card-title">Live On-Page GEO Crawler</h3>
          <p className="card-desc">
            Audits your live website or Vercel URL against 6 core GEO factors (robots.txt, schema, direct answers, stats, author bio) and ranks it against competitors on a live leaderboard.
          </p>
          <div className="card-footer-link">
            <span>Audit Website</span>
            <ArrowRight size={14} />
          </div>
        </div>

        <div className="glass-panel workflow-card" onClick={() => onNavigate('cluster')}>
          <div className="card-top">
            <div className="card-icon-box cyan">
              <Search size={22} />
            </div>
            <span className="step-tag mono">PILLAR 2</span>
          </div>
          <h3 className="card-title">Multi-Intent AI Query Cluster</h3>
          <p className="card-desc">
            Expands high-intent user queries into 5 intent categories and executes parallel evaluations against Google Search Grounded LLMs to track citation rates and brand sentiment.
          </p>
          <div className="card-footer-link">
            <span>Evaluate Queries</span>
            <ArrowRight size={14} />
          </div>
        </div>

        <div className="glass-panel workflow-card" onClick={() => onNavigate('experiment')}>
          <div className="card-top">
            <div className="card-icon-box emerald">
              <Award size={22} />
            </div>
            <span className="step-tag mono">PILLAR 3</span>
          </div>
          <h3 className="card-title">Controlled Experiment Lab</h3>
          <p className="card-desc">
            Demonstrates how an unoptimized website scoring Grade F (3.8/100) leaps to Grade A (100/100) and Rank #1 by applying clean, bullet-point descriptive recommendations.
          </p>
          <div className="card-footer-link">
            <span>View Experiment</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* GEO Methodology Breakdown */}
      <div className="glass-panel methodology-card">
        <h3 className="section-title">The 6 Pillars of Generative Engine Optimization</h3>
        <p className="section-subtitle">
          How LLMs and AI search engines decide which sources to cite:
        </p>

        <div className="grid-3 methodology-grid">
          <div className="pillar-item">
            <div className="pillar-num mono">01</div>
            <h4 className="pillar-title">AI Bot Crawler Ingestion</h4>
            <p className="pillar-desc">
              Robots.txt must explicitly grant access to GPTBot, PerplexityBot, ClaudeBot, and CCBot with a linked sitemap.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-num mono">02</div>
            <h4 className="pillar-title">Machine Entity Schema</h4>
            <p className="pillar-desc">
              JSON-LD structured data (SoftwareApplication, Organization, FAQPage) gives LLMs unambiguous entity relationships.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-num mono">03</div>
            <h4 className="pillar-title">Direct-Answer Formatting</h4>
            <p className="pillar-desc">
              H2/H3 question headers immediately followed by 1-2 sentence direct answers optimize for zero-click AI snippet extraction.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-num mono">04</div>
            <h4 className="pillar-title">Quantitative Statistics</h4>
            <p className="pillar-desc">
              AI engines prioritize empirical metrics, benchmarks (e.g. 2.4x speed, 99.98% SLA), and percentages over fluffy marketing jargon.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-num mono">05</div>
            <h4 className="pillar-title">E-E-A-T Author Authority</h4>
            <p className="pillar-desc">
              Verified author names, credentials, certifications, and linked profiles build the trust thresholds required for AI citation.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-num mono">06</div>
            <h4 className="pillar-title">Temporal Freshness Signals</h4>
            <p className="pillar-desc">
              Explicit copyright years and 2026 update timestamps ensure LLMs select your site as the most current source of truth.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .overview-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .hero-banner {
          padding: 3rem 2.5rem;
          position: relative;
          overflow: hidden;
        }

        .hero-content {
          max-width: 850px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.85rem;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-family: var(--font-heading);
          font-weight: 600;
          color: #a5b4fc;
          width: fit-content;
        }

        .hero-title {
          font-size: 2.75rem;
          font-weight: 800;
          line-height: 1.15;
          color: #ffffff;
          letter-spacing: -0.03em;
        }

        .hero-desc {
          font-size: 1.1rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }

        .health-status-row {
          margin-top: 0.5rem;
        }

        .health-text {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-family: var(--font-mono);
        }

        .text-emerald {
          color: #34d399;
        }

        .text-amber {
          color: #fbbf24;
        }

        .workflow-grid {
          gap: 1.5rem;
        }

        .workflow-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          cursor: pointer;
        }

        .workflow-card:hover {
          transform: translateY(-4px);
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-icon-box {
          width: 46px;
          height: 46px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-icon-box.indigo {
          background: rgba(99, 102, 241, 0.15);
          color: var(--indigo-400);
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .card-icon-box.cyan {
          background: rgba(6, 182, 212, 0.15);
          color: var(--cyan-400);
          border: 1px solid rgba(6, 182, 212, 0.3);
        }

        .card-icon-box.emerald {
          background: rgba(16, 185, 129, 0.15);
          color: var(--emerald-400);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .step-tag {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
        }

        .card-title {
          font-size: 1.2rem;
          color: #ffffff;
        }

        .card-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          flex: 1;
        }

        .card-footer-link {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--indigo-400);
          margin-top: 0.5rem;
        }

        .methodology-card {
          padding: 2rem;
        }

        .methodology-grid {
          margin-top: 1.5rem;
          gap: 1.5rem;
        }

        .pillar-item {
          background: rgba(10, 16, 30, 0.5);
          border: 1px solid var(--border-subtle);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .pillar-num {
          font-size: 0.8rem;
          color: var(--indigo-400);
          font-weight: 700;
        }

        .pillar-title {
          font-size: 1.05rem;
          color: #ffffff;
        }

        .pillar-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }
          .hero-banner {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};
