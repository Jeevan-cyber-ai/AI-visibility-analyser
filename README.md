# AI Visibility & GEO Analyzer 🔍⚡

> **Next-Generation Generative Engine Optimization (GEO) & AI Search Citation Intelligence Platform**  
> Benchmark your brand's AI search visibility, citation rates, and on-page technical readiness across search-grounded LLMs (Google Gemini 2.5, Groq, Mistral) against industry competitors.

---

## 🌟 Key Highlights & Capabilities

### 1. 🕷️ Real-Time On-Page GEO Crawler & Live Pipeline Stepper
- **6-Factor Generative Engine Optimization Evaluation**:
  1. **AI Crawler Access in `robots.txt`**: Evaluates allow/disallow permissions for `GPTBot`, `PerplexityBot`, `Google-Extended`, `ClaudeBot`, `Bytespider`, and `CCBot`.
  2. **Structured Data Graph**: Validates Schema.org JSON-LD entities (`SoftwareApplication`, `FAQPage`, `Organization`) for direct LLM knowledge-graph entity extraction.
  3. **Direct Answer Density**: Scans for natural question headers (`what`, `how`, `why`, `best`) paired with concise, direct answer blocks tailored for zero-click AI summaries.
  4. **Empirical & Benchmark Statistics**: Detects verifiable numerical metrics (latencies, SLA uptime %, benchmark numbers) that LLMs prioritize as authoritative proof points.
  5. **E-E-A-T Credibility Signals**: Analyzes author bylines, certifications (SOC2, ISO, GDPR), methodology notes, and leadership expertise.
  6. **Freshness & Temporal Anchoring**: Validates semantic `<time>` stamps, recent year anchoring (e.g. `2026`), and explicit publication/audit metadata.
- **Visual Scraping Pipeline**: Interactive real-time pipeline visualizer showing:
  `Target URL Received` ➔ `Fetching Webpage HTML` ➔ `Inspecting robots.txt` ➔ `Extracting Schema Graph` ➔ `Parsing Answer Blocks` ➔ `Calculating GEO Scores` ➔ `Benchmarking Rivals`.

---

### 2. 🤖 Integrated Search-Grounded AI Query Audit
- Combines on-page technical crawling with live search-grounded LLM query execution.
- Generates multi-intent query expansions (Informational, Comparative, Commercial, Technical).
- Benchmarks **AI Mention Rate (%)**, **AI Citation Rate (%)**, and **Share of Voice (SOV %)** side-by-side with on-page GEO scores in a unified leaderboard.

---

### 3. 🎯 Dual Operational Modes
- **Mode 1: Audit Real-World Production Apps**
  - Live crawls real internet domains (e.g., Notion, Linear, ClickUp, Coda, Jira, Bitdefender) and their live `robots.txt`.
  - Conducts head-to-head competitive gap analysis against top market leaders.
- **Mode 2: Audit Our Own Website (Development & Optimization)**
  - Audits local HTML files (e.g., unoptimized starting baseline) or live Vercel deployments.
  - Generates clear, actionable, **bullet-point recommendations** (no raw code dumps).
  - Enables iterative developer workflows: inspect low score (Grade F) ➔ apply fixes ➔ re-audit to verify Grade A status (100.0/100, Rank #1).

---

## 🏗️ Architecture & Tech Stack

```text
Ai_visibility analyser/
├── ai_visibility_analyzer/
│   ├── backend/
│   │   ├── config/          # Environment configuration & LLM provider keys
│   │   ├── controllers/     # FastAPI REST API endpoints (audit_controller.py)
│   │   ├── core/            # LLM grounding clients & citation checkers
│   │   ├── models/          # Pydantic data schemas (crawler, query, scoring)
│   │   ├── services/        # CrawlerService, QueryService, CitationService, ScoringService
│   │   ├── sample_site/     # Baseline (v1) and Optimized (v2) test sites
│   │   └── main.py          # FastAPI application entry point
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/  # CrawlerPipelineStream, LeaderboardTable, FactorCard, ScoreRing...
│   │   │   ├── views/       # CrawlerView, ClusterAuditView, OverviewView...
│   │   │   ├── services/    # REST API client
│   │   │   └── App.tsx      # Main application container & navigation
│   │   └── package.json     # Vite + React + TypeScript dependencies
│   └── deployable_test_site/# Self-contained deployable site for live testing
```

- **Backend**: Python 3.12, FastAPI, BeautifulSoup4, Requests, Pydantic, Uvicorn.
- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Cyber-Intelligence CSS Design Tokens.
- **AI Engines**: Google Gemini 2.5 (Search Grounded), Groq, Mistral.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) API keys for Google Gemini, Groq, or Mistral (offline simulation mode available if keys are not provided).

### 1. Backend Setup
```bash
cd ai_visibility_analyzer/backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and insert your API keys

# Start FastAPI backend
python -m uvicorn main:app --reload --port 8000
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend Setup
```bash
cd ai_visibility_analyzer/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) or access the bundled app directly through FastAPI at [http://localhost:8000/](http://localhost:8000/).

---

## 📊 Live Screenshots & Workflow

1. **Crawler & Benchmark Studio**: Enter target URL and competitor URLs, select LLM provider, and optionally include live search queries.
2. **Right-Hand Spider Pipeline**: Watch live scraping and analysis progress in real-time.
3. **Leaderboard & Factor Cards**: Inspect weighted factor breakdown, competitive gap comparisons, and descriptive optimization roadmaps.

---

## 🔒 Security & Privacy
- Sensitive `.env` files and API keys are strictly excluded via `.gitignore`.
- Always use `.env.example` as a template for local environment secrets.

---

## 📄 License
MIT License. Built for Generative Engine Optimization (GEO) researchers and modern engineering teams.
