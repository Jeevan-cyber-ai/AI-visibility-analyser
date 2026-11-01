# How to Run AI Visibility Analyzer

This guide documents the exact commands to run each component, milestone, and the FastAPI backend server.

---

## Milestone 1: Core Citation & Brand Mention Checker
Tests sending a single sample query to the LLM (Gemini with live Google Search Grounding or Groq `openai/gpt-oss-120b`) and analyzing mentions, positions, sentiments, and citations.

```powershell
python test_step1.py
```

---

## Milestone 2: Dynamic Query Cluster Expansion & Auto-Discovery
Simulates realistic human buying queries (Casual, Specific/Feature, Budget/Free, Alternatives, Comparison) and runs parallel multi-intent visibility audits with optional automatic competitor discovery.

```powershell
python test_step2.py
```

---

## Milestone 3: Controlled Experiment (Before vs After GEO Audit)
Audits the sample baseline site (V1 - blocked bots, 0 schema, no stats, Grade F: 3.8/100) vs the optimized site (V2 - unblocked bots, JSON-LD schemas, direct answers, benchmarks, Grade A: 100/100), demonstrating a **+96.2 point score improvement**, complete side-by-side delta table, and Share of Voice calculations.

```powershell
python test_step3.py
```

---

## Milestone 4: Running the FastAPI Web API Server

To start the local REST API server:

```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```

Interactive Swagger documentation is automatically available at:
👉 **`http://127.0.0.1:8000/docs`**

### Available Endpoints:
* `POST /api/crawler/audit-page`: Audits any webpage URL or local HTML file + robots.txt against the 6 core GEO factors.
* `POST /api/audit/cluster`: Expands natural search queries, runs parallel LLM calls, and returns visibility scores.
* `POST /api/audit/full`: Combines on-page crawl audit + live query cluster audit + Share of Voice benchmark report.
* `POST /api/competitors/discover`: Automatically detects top competitors for any brand or topic.
* `POST /api/queries/expand`: Generates human-like query variations across user intents.

---

## Folder Navigation Cheat Sheet

| Where your terminal is | Milestone 1 | Milestone 2 | Milestone 3 |
| :--- | :--- | :--- | :--- |
| `ai_visibility_analyzer` | `python test_step1.py` | `python test_step2.py` | `python test_step3.py` |
| `ai_visibility_analyzer\backend` | `python test_step1.py` | `python test_step2.py` | `python test_step3.py` |
| Workspace Root | `python ai_visibility_analyzer\test_step1.py` | `python ai_visibility_analyzer\test_step2.py` | `python ai_visibility_analyzer\test_step3.py` |

---

## Environment & API Keys
Your API keys are stored in:
👉 `ai_visibility_analyzer\backend\.env`

* **Gemini (Google):** Active with live Google Search Grounding (configured in `.env`)
* **Groq:** Active with fast LLaMA models (configured in `.env`)
* **Mistral:** Active with automatic graceful fallback if rate-limited (configured in `.env`)
