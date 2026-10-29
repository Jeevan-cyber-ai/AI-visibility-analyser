import React, { useState } from 'react';
import { Search, Zap, ExternalLink, ArrowRight } from 'lucide-react';
import type { CompetitorInfo } from '../types/api';
import { discoverCompetitors } from '../services/api';

interface CompetitorsViewProps {
  onSelectForCrawler?: (url: string) => void;
}

export const CompetitorsView: React.FC<CompetitorsViewProps> = ({ onSelectForCrawler }) => {
  const [topic, setTopic] = useState<string>('Agile Sprint Project Management');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorInfo[]>([
    {
      brand: 'Linear',
      domain: 'linear.app',
      url: 'https://linear.app',
    },
    {
      brand: 'ClickUp',
      domain: 'clickup.com',
      url: 'https://clickup.com',
    },
    {
      brand: 'Jira',
      domain: 'atlassian.com',
      url: 'https://atlassian.com/software/jira',
    },
    {
      brand: 'Asana',
      domain: 'asana.com',
      url: 'https://asana.com',
    },
  ]);

  const handleDiscover = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await discoverCompetitors(topic, 5);
      if (data.competitors && data.competitors.length > 0) {
        setCompetitors(data.competitors);
      }
    } catch (err: any) {
      setError(err.message || 'Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="competitors-view">
      <div className="view-intro">
        <h2 className="view-title">Competitor Intelligence & Auto-Discovery</h2>
        <p className="view-desc">
          Uncover the top competing brands commanding AI search real-estate in your niche and benchmark their GEO footprint.
        </p>
      </div>

      {/* Discovery Input Panel */}
      <div className="glass-panel discovery-card">
        <div className="input-group">
          <label className="input-label">Niche Topic or Industry Segment</label>
          <div className="discovery-input-row">
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Project Management, Antivirus Software, AI Writing Tools"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
            />
            <button
              className="btn btn-primary btn-lg"
              onClick={handleDiscover}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Zap size={18} className="animate-spin" />
                  <span>Scanning Market...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Discover Competitors</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick topic presets */}
        <div className="topic-presets">
          <span className="presets-label">Popular Verticals:</span>
          {[
            'Agile Sprint Project Management',
            'Cloud Antivirus & Endpoint Security',
            'AI CRM for Sales Teams',
            'Cloud Hosting Platforms',
          ].map((t) => (
            <button
              key={t}
              className="preset-chip"
              onClick={() => {
                setTopic(t);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <strong>Discovery Error:</strong> {error}
        </div>
      )}

      {/* Competitors Grid */}
      <div className="competitors-grid-section">
        <h3 className="section-title">Discovered Market Leaders ({competitors.length})</h3>
        <p className="section-subtitle">
          These rivals actively compete for the same AI answers and citations:
        </p>

        <div className="grid-2">
          {competitors.map((comp, idx) => (
            <div key={idx} className="glass-panel comp-profile-card">
              <div className="comp-card-top">
                <div className="comp-avatar">
                  {comp.brand.slice(0, 2).toUpperCase()}
                </div>
                <div className="comp-meta">
                  <h4 className="comp-brand-name">{comp.brand}</h4>
                  <span className="comp-domain mono">{comp.domain}</span>
                </div>
              </div>

              <div className="comp-card-actions">
                <a
                  href={comp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={14} /> Visit Site
                </a>

                {onSelectForCrawler && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectForCrawler(comp.url)}
                  >
                    <span>Audit in Crawler</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .competitors-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .discovery-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .discovery-input-row {
          display: flex;
          gap: 1rem;
        }

        .topic-presets {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }

        .competitors-grid-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .comp-profile-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1.25rem;
        }

        .comp-card-top {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .comp-avatar {
          width: 46px;
          height: 46px;
          border-radius: var(--radius-md);
          background: var(--grad-primary);
          color: #ffffff;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .comp-meta {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .comp-brand-name {
          font-size: 1.15rem;
          color: #ffffff;
        }

        .comp-domain {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .comp-card-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border-subtle);
        }

        @media (max-width: 768px) {
          .discovery-input-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
