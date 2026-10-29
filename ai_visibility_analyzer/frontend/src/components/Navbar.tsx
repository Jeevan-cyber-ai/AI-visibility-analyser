import React from 'react';
import {
  Globe,
  Activity,
  Layers,
  Sparkles,
  Award,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { HealthResponse } from '../types/api';

export type NavTab = 'crawler' | 'cluster' | 'competitors' | 'experiment' | 'overview';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  health: HealthResponse | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, health }) => {
  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    {
      id: 'crawler',
      label: 'Live GEO Crawler',
      icon: <Globe size={18} />,
      badge: 'Core'
    },
    {
      id: 'cluster',
      label: 'AI Query Cluster',
      icon: <Search size={18} />,
    },
    {
      id: 'competitors',
      label: 'Competitor Intel',
      icon: <Layers size={18} />,
    },
    {
      id: 'experiment',
      label: 'Before vs After Lab',
      icon: <Award size={18} />,
      badge: 'Demo'
    },
    {
      id: 'overview',
      label: 'System Overview',
      icon: <Activity size={18} />,
    },
  ];

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon-wrapper">
            <Sparkles size={22} className="brand-sparkle" />
          </div>
          <div>
            <div className="brand-title">
              GEO <span className="brand-gradient">ANALYZER</span>
            </div>
            <div className="brand-subtitle">AI Visibility & Citations Platform</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`tab-badge ${isActive ? 'badge-active' : ''}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live LLM Status Indicators */}
        <div className="navbar-engines">
          <div className="engine-chip">
            <div className="engine-indicator live"></div>
            <span className="engine-name">Gemini Grounded</span>
            <span className="engine-tag">2.5 Flash</span>
          </div>

          <div className="engine-chip">
            <div className="engine-indicator live"></div>
            <span className="engine-name">Groq Llama</span>
            <span className="engine-tag">120B</span>
          </div>

          {health?.status === 'healthy' ? (
            <div className="status-badge connected" title="API Connected: http://127.0.0.1:8000">
              <CheckCircle2 size={14} />
              <span>Online</span>
            </div>
          ) : (
            <div className="status-badge disconnected" title="Backend check failed">
              <AlertCircle size={14} />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar-wrapper {
          background: rgba(7, 9, 14, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0.85rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          cursor: pointer;
          user-select: none;
        }

        .brand-icon-wrapper {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.35));
          border: 1px solid rgba(99, 102, 241, 0.4);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
        }

        .brand-sparkle {
          color: #a5b4fc;
        }

        .brand-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #ffffff;
          line-height: 1.1;
        }

        .brand-gradient {
          background: var(--grad-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-subtitle {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .navbar-tabs {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(15, 23, 42, 0.6);
          padding: 0.3rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
        }

        .nav-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.95rem;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-tab-btn.active {
          background: var(--grad-primary);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        .tab-badge {
          font-size: 0.65rem;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          font-family: var(--font-mono);
          text-transform: uppercase;
        }

        .tab-badge.badge-active {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        .navbar-engines {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .engine-chip {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
        }

        .engine-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .engine-indicator.live {
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .engine-name {
          color: var(--text-primary);
          font-weight: 600;
        }

        .engine-tag {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: var(--indigo-400);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-full);
        }

        .status-badge.connected {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-badge.disconnected {
          background: rgba(244, 63, 94, 0.12);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }

        @media (max-width: 1100px) {
          .navbar-engines {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .navbar-container {
            flex-direction: column;
            gap: 0.85rem;
          }
          .navbar-tabs {
            overflow-x: auto;
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </header>
  );
};
