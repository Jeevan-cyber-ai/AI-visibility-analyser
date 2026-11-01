import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import type { NavTab } from './components/Navbar';
import { CrawlerView } from './views/CrawlerView';
import { ClusterAuditView } from './views/ClusterAuditView';
import { WhereToListedView } from './views/WhereToListedView';
import { AdvisorView } from './views/AdvisorView';
import { ContentStudioView } from './views/ContentStudioView';
import { CompetitorsView } from './views/CompetitorsView';
import { ExperimentView } from './views/ExperimentView';
import { OverviewView } from './views/OverviewView';
import type { HealthResponse } from './types/api';
import { fetchHealth } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('crawler');
  const [studioQuery, setStudioQuery] = useState<string>(
    'Compare the leading collaborative workspace options for a small team'
  );
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    // Initial backend health check
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn('Backend not responding yet:', err));
  }, []);

  const handleNavigateToStudio = (query: string) => {
    setStudioQuery(query);
    setActiveTab('studio');
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        health={health}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'crawler' && <CrawlerView />}
        {activeTab === 'cluster' && <ClusterAuditView />}
        {activeTab === 'listings' && (
          <WhereToListedView onNavigateToStudio={handleNavigateToStudio} />
        )}
        {activeTab === 'advisor' && (
          <AdvisorView onNavigateToStudio={handleNavigateToStudio} />
        )}
        {activeTab === 'studio' && (
          <ContentStudioView
            key={studioQuery}
            initialQuery={studioQuery}
            onNavigateToCrawler={() => setActiveTab('crawler')}
          />
        )}
        {activeTab === 'competitors' && (
          <CompetitorsView
            onSelectForCrawler={(_url) => {
              setActiveTab('crawler');
            }}
          />
        )}
        {activeTab === 'experiment' && <ExperimentView />}
        {activeTab === 'overview' && (
          <OverviewView
            health={health}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-left">
            <span className="footer-brand">AI Visibility & GEO Analyzer</span>
            <span className="footer-sep">•</span>
            <span className="footer-copy">Enterprise Generative Engine Optimization Engine</span>
          </div>

          <div className="footer-right">
            <span className="mono footer-tech">Gemini 2.5 Grounded + Groq Llama 3 120B</span>
            <span className="footer-version mono">v2.0-PRO</span>
          </div>
        </div>

        <style>{`
          .app-footer {
            border-top: 1px solid var(--border-subtle);
            background: rgba(7, 9, 14, 0.95);
            padding: 1.5rem 0;
            margin-top: auto;
          }

          .footer-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.85rem;
            color: var(--text-muted);
            flex-wrap: wrap;
            gap: 1rem;
          }

          .footer-left {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .footer-brand {
            color: var(--text-secondary);
            font-weight: 600;
          }

          .footer-sep {
            color: var(--border-medium);
          }

          .footer-right {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .footer-tech {
            font-size: 0.78rem;
            color: var(--text-muted);
          }

          .footer-version {
            font-size: 0.75rem;
            padding: 0.15rem 0.5rem;
            border-radius: var(--radius-sm);
            background: rgba(99, 102, 241, 0.15);
            color: var(--indigo-400);
            border: 1px solid rgba(99, 102, 241, 0.3);
          }
        `}</style>
      </footer>
    </div>
  );
}

export default App;
