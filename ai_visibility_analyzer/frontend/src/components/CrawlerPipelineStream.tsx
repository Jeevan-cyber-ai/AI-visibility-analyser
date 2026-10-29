import React, { useEffect, useState } from 'react';
import {
  Globe,
  Bot,
  FileCode,
  HelpCircle,
  BarChart3,
  Swords,
  Cpu,
  Trophy,
  CheckCircle2,
  Loader2,
  Terminal,
  Activity
} from 'lucide-react';
import type { ComparativePageAudit } from '../types/api';

interface PipelineStep {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
}

interface CrawlerPipelineStreamProps {
  loading: boolean;
  targetUrl: string;
  competitors: string[];
  searchQuery?: string;
  includeQueryAudit: boolean;
  result: ComparativePageAudit | null;
}

export const CrawlerPipelineStream: React.FC<CrawlerPipelineStreamProps> = ({
  loading,
  targetUrl,
  competitors,
  searchQuery,
  includeQueryAudit,
  result,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const domain = targetUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0] || targetUrl;

  const steps: PipelineStep[] = [
    {
      id: 'fetch',
      label: 'Spider Initialized & Scraping Target URL',
      detail: `HTTP GET ${targetUrl.slice(0, 32)}...`,
      icon: <Globe size={16} />,
    },
    {
      id: 'robots',
      label: 'Inspecting robots.txt AI Bot Permissions',
      detail: `Fetching ${domain}/robots.txt (GPTBot, PerplexityBot)`,
      icon: <Bot size={16} />,
    },
    {
      id: 'html_parse',
      label: 'Parsing HTML DOM & Semantic Hierarchy',
      detail: 'Extracting title, meta description, and word count',
      icon: <Terminal size={16} />,
    },
    {
      id: 'schema',
      label: 'Extracting Schema.org JSON-LD Entities',
      detail: 'Scanning <script type="application/ld+json"> graphs',
      icon: <FileCode size={16} />,
    },
    {
      id: 'direct_answers',
      label: 'Evaluating Direct-Answer Headings & RAG Chunks',
      detail: 'Scanning H1/H2/H3 question headers & concise answer blocks',
      icon: <HelpCircle size={16} />,
    },
    {
      id: 'statistics',
      label: 'Auditing Empirical & Quantitative Benchmarks',
      detail: 'Scanning for latency (ms), percentages (%), SLA uptime',
      icon: <BarChart3 size={16} />,
    },
    {
      id: 'competitors',
      label: `Scraping & Benchmarking ${competitors.length} Competitors`,
      detail: `Fetching live pages & robots.txt for rivals`,
      icon: <Swords size={16} />,
    },
    ...(includeQueryAudit && searchQuery
      ? [
          {
            id: 'llm_query',
            label: 'Parallel AI Search Query Audit (Gemini Grounded)',
            detail: `Executing 5 intent queries: "${searchQuery.slice(0, 28)}..."`,
            icon: <Cpu size={16} />,
          },
        ]
      : []),
    {
      id: 'complete',
      label: 'Synthesizing Leaderboard & Action Roadmap',
      detail: 'Finalizing competitive rank and descriptive recommendations',
      icon: <Trophy size={16} />,
    },
  ];

  // Pipeline animation while loading
  useEffect(() => {
    if (!loading) {
      if (result) {
        setCurrentStepIndex(steps.length); // All completed
      }
      return;
    }

    setCurrentStepIndex(0);
    setLogs([`[0.00s] Initializing spider for ${targetUrl}`]);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next < steps.length - 1) {
          const stepObj = steps[next];
          setLogs((l) => [
            ...l,
            `[+${(next * 0.45).toFixed(2)}s] ${stepObj.label} -> ${stepObj.detail}`,
          ]);
          return next;
        }
        return prev;
      });
    }, 650);

    return () => clearInterval(stepInterval);
  }, [loading, result, targetUrl]);

  // When result arrives, complete all and show real findings
  useEffect(() => {
    if (result && !loading) {
      setCurrentStepIndex(steps.length);
      const summaryLogs = [
        `[COMPLETE] Target "${result.target_brand}" crawled successfully.`,
        `[Robots.txt] ${result.target_audit.stats_summary?.has_robots_txt ? 'AI bots allowed' : 'Robots.txt missing or blocking AI'}`,
        `[Schema] Detected ${result.target_audit.stats_summary?.schemas_detected?.length || 0} types: ${(result.target_audit.stats_summary?.schemas_detected || []).join(', ') || 'None'}`,
        `[Direct Answers] ${result.target_audit.stats_summary?.direct_answers_count || 0} Q&A modules found`,
        `[Empirical Stats] ${result.target_audit.stats_summary?.statistics_detected_count || 0} hard benchmark citations`,
        `[Score] Overall GEO Score: ${result.target_audit.overall_score.toFixed(1)}/100 (Grade ${result.target_audit.grade})`,
        `[Leaderboard] Rank #${result.rank_position} of ${result.total_sites}`,
      ];

      if (result.cluster_summary) {
        summaryLogs.push(
          `[AI Search] Mention Rate: ${result.cluster_summary.mention_rate_pct.toFixed(0)}%, Citation Rate: ${result.cluster_summary.citation_rate_pct.toFixed(0)}%`
        );
      }

      setLogs((prev) => [...prev, ...summaryLogs]);
    }
  }, [result, loading]);

  return (
    <div className="crawler-pipeline-box glass-panel">
      {/* Header */}
      <div className="pipeline-header">
        <div className="pipeline-title-row">
          <Activity size={18} className="pipeline-icon pulse-glow" />
          <h4 className="pipeline-title">Live Crawling & Scraping Pipeline</h4>
        </div>
        <span className={`pipeline-status-badge ${loading ? 'active' : 'idle'}`}>
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              <span>SPIDER ACTIVE</span>
            </>
          ) : result ? (
            <>
              <CheckCircle2 size={12} className="text-emerald" />
              <span>CRAWL FINISHED</span>
            </>
          ) : (
            <span>STANDBY</span>
          )}
        </span>
      </div>

      <p className="pipeline-subtitle">
        Real-time execution pipeline inspecting target DOM, robots.txt, schema graph, and rival pages:
      </p>

      {/* Stepper Pipeline Flow */}
      <div className="pipeline-stepper">
        {steps.map((step, idx) => {
          const isDone = !loading && result ? true : idx < currentStepIndex;
          const isCurrent = loading && idx === currentStepIndex;

          return (
            <div key={step.id} className="pipeline-node-wrapper">
              <div className={`pipeline-node ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}>
                {/* Status Indicator Bubble */}
                <div className="node-bubble">
                  {isDone ? (
                    <CheckCircle2 size={15} className="text-emerald" />
                  ) : isCurrent ? (
                    <Loader2 size={15} className="animate-spin text-indigo" />
                  ) : (
                    <span className="node-index mono">{idx + 1}</span>
                  )}
                </div>

                {/* Node Details */}
                <div className="node-content">
                  <div className="node-title-row">
                    <span className="node-icon">{step.icon}</span>
                    <span className="node-label">{step.label}</span>
                  </div>
                  <span className="node-detail mono">{step.detail}</span>
                </div>
              </div>

              {/* Vertical Pipe Connector */}
              {idx < steps.length - 1 && (
                <div className={`pipeline-connector ${isDone ? 'connector-done' : isCurrent ? 'connector-current' : ''}`}>
                  <div className="pipe-line"></div>
                  <div className="pipe-arrow">▼</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time Spider Log Console */}
      <div className="spider-console-box">
        <div className="console-header">
          <Terminal size={13} className="text-indigo" />
          <span className="console-title mono">crawler_terminal.log</span>
        </div>
        <div className="console-content mono">
          {logs.slice(-5).map((log, i) => (
            <div key={i} className="log-line">
              <span className="log-prompt">&gt;</span> {log}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="log-line text-muted">
              &gt; Ready. Click "Audit & Benchmark" to initiate web spider...
            </div>
          )}
        </div>
      </div>

      <style>{`
        .crawler-pipeline-box {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: fit-content;
        }

        .pipeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .pipeline-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .pipeline-icon {
          color: var(--indigo-400);
        }

        .pipeline-title {
          font-size: 1.05rem;
          color: #ffffff;
        }

        .pipeline-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
          font-family: var(--font-mono);
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-full);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .pipeline-status-badge.active {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.4);
          animation: pulseGlow 1.5s ease-in-out infinite;
        }

        .pipeline-status-badge.idle {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          border: 1px solid var(--border-subtle);
        }

        .pipeline-subtitle {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .pipeline-stepper {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .pipeline-node-wrapper {
          display: flex;
          flex-direction: column;
        }

        .pipeline-node {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.55rem 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          transition: all 0.25s ease;
        }

        .pipeline-node.done {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .pipeline-node.current {
          background: rgba(99, 102, 241, 0.12);
          border-color: var(--indigo-500);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
        }

        .pipeline-node.pending {
          opacity: 0.45;
        }

        .node-bubble {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .node-index {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
        }

        .node-content {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          flex: 1;
        }

        .node-title-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .node-icon {
          color: var(--indigo-400);
          display: flex;
          align-items: center;
        }

        .node-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffffff;
        }

        .node-detail {
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        /* Vertical Connector Pipe */
        .pipeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-left: 1.15rem;
          height: 16px;
          color: var(--border-medium);
          opacity: 0.4;
          transition: all 0.25s ease;
        }

        .pipeline-connector.connector-done {
          color: var(--emerald-500);
          opacity: 0.8;
        }

        .pipeline-connector.connector-current {
          color: var(--indigo-400);
          opacity: 1;
        }

        .pipe-line {
          width: 2px;
          height: 6px;
          background: currentColor;
        }

        .pipe-arrow {
          font-size: 0.6rem;
          line-height: 1;
          margin-top: -2px;
        }

        /* Console */
        .spider-console-box {
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.75rem 0.85rem;
        }

        .console-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.4rem;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .console-title {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .console-content {
          font-size: 0.72rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          line-height: 1.35;
        }

        .log-line {
          word-break: break-all;
        }

        .log-prompt {
          color: var(--indigo-400);
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};
