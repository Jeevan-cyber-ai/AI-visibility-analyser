"""
Audit Controller / Router (C in MVC).
Handles API requests for on-page GEO crawler audits, query expansions,
competitor discovery, cluster audits, and full comprehensive audits.
"""
from __future__ import annotations

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.competitor_service import CompetitorService
from services.query_service import QueryService
from services.citation_service import CitationService
from services.crawler_service import CrawlerService
from services.scoring_service import ScoringService
from services.citation_gap_service import CitationGapService
from services.llm_service import get_llm_client

router = APIRouter(prefix="/api", tags=["audit"])


class PageAuditRequest(BaseModel):
    url_or_path: str = Field(..., example="https://pulsetask.io")


class ClusterAuditRequest(BaseModel):
    query: str = Field(..., example="tell me the best antivirus softwares in 2026")
    brand_url: str = Field(..., example="https://bitdefender.com")
    competitors: Optional[List[str]] = Field(default=None, example=["https://norton.com", "https://mcafee.com"])
    auto_discover_competitors: bool = Field(default=True)
    count: int = Field(default=5, ge=3, le=10)
    provider: str = Field(default="Gemini")


class FullAuditRequest(BaseModel):
    query: str = Field(..., example="best agile sprint management software")
    brand_url: str = Field(..., example="https://pulsetask.io")
    on_page_target: Optional[str] = Field(default=None, example="sample_site/v2_optimized/index.html")
    competitors: Optional[List[str]] = None
    auto_discover_competitors: bool = Field(default=True)
    count: int = Field(default=5, ge=3, le=10)
    provider: str = Field(default="Gemini")


class DiscoverCompetitorsRequest(BaseModel):
    brand_or_topic: str = Field(..., example="Bitdefender")
    limit: int = Field(default=4, ge=2, le=8)
    provider: str = Field(default="Gemini")


class ExpandQueriesRequest(BaseModel):
    query: str = Field(..., example="best project management software")
    brand_url: str = Field(..., example="https://linear.app")
    competitors: Optional[List[str]] = None
    count: int = Field(default=5, ge=3, le=10)
    provider: str = Field(default="Gemini")


class ComparePageRequest(BaseModel):
    url_or_path: str = Field(..., example="https://pulsetask.vercel.app")
    competitors: Optional[List[str]] = Field(default=None, example=["https://atlassian.com", "https://clickup.com"])
    query: Optional[str] = Field(default=None, example="best agile sprint management software in 2026")
    provider: str = Field(default="Gemini")


@router.post("/crawler/audit-page")
def audit_page_endpoint(req: PageAuditRequest):
    """Audits a webpage (or local HTML file) and robots.txt for GEO factors."""
    try:
        result = CrawlerService.audit_page(req.url_or_path)
        return result.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crawler/compare")
def compare_page_endpoint(req: ComparePageRequest):
    """
    Audits the target page and directly benchmarks its score and factors against competitors.
    If a search query is provided, also executes a parallel search-grounded LLM query audit
    to measure mention rate, citation rate, and Share of Voice for all brands.
    """
    try:
        comp_audit = CrawlerService.compare_with_competitors(req.url_or_path, req.competitors)
        res_dict = comp_audit.to_dict()

        # If a seed query is provided, execute parallel LLM query cluster audit
        if req.query and req.query.strip():
            client = get_llm_client(req.provider)
            target_url = req.url_or_path
            competitor_urls = req.competitors or [c.url_or_path for c in comp_audit.competitors]

            cluster_summary = QueryService.audit_cluster(
                seed_query=req.query.strip(),
                target_brand_url=target_url,
                competitors=competitor_urls,
                auto_discover_competitors=False,
                client=client,
            )
            comparative_report = ScoringService.calculate_comparative_report(cluster_summary)

            # Map brand scores
            brand_query_scores: Dict[str, Dict[str, Any]] = {}
            tb = comparative_report.target_brand
            brand_query_scores[comp_audit.target_brand.lower()] = {
                "brand_name": comp_audit.target_brand,
                "mention_rate": round(tb.mention_rate, 1),
                "citation_rate": round(tb.citation_rate, 1),
                "share_of_voice": round(tb.share_of_voice, 1),
                "query_score": round(tb.composite_visibility_score, 1),
            }

            for cb in comparative_report.competitors:
                brand_query_scores[cb.brand_name.lower()] = {
                    "brand_name": cb.brand_name,
                    "mention_rate": round(cb.mention_rate, 1),
                    "citation_rate": round(cb.citation_rate, 1),
                    "share_of_voice": round(cb.share_of_voice, 1),
                    "query_score": round(cb.composite_visibility_score, 1),
                }

            res_dict["query"] = req.query.strip()
            res_dict["cluster_summary"] = cluster_summary.to_dict()
            res_dict["comparative_report"] = comparative_report.to_dict()
            res_dict["brand_query_scores"] = brand_query_scores

            # Top-level executive scores
            res_dict["ai_visibility_score"] = round(tb.composite_visibility_score, 1)
            res_dict["share_of_voice"] = round(tb.share_of_voice, 1)
            res_dict["geo_score"] = round(comp_audit.target_audit.overall_score, 1)
            res_dict["seo_score"] = round(comp_audit.target_audit.seo_score, 1)

            # Enrich action bullets with AI search query findings
            if tb.mention_rate < 50:
                res_dict["actionable_bullet_points"].append(
                    f"AI Search Discovery Gap: {comp_audit.target_brand} was mentioned in only {round(tb.mention_rate)}% of search queries for '{req.query}'. Incorporate natural comparative keywords and direct-answer Q&A sections answering this query."
                )
            if tb.citation_rate < 30:
                res_dict["actionable_bullet_points"].append(
                    f"Citation Authority Gap: AI search models did not cite {comp_audit.target_brand} as a linked source. Ensure robots.txt grants access to GPTBot/PerplexityBot and embed verified empirical benchmarks."
                )
        else:
            res_dict["ai_visibility_score"] = comp_audit.ai_visibility_score
            res_dict["share_of_voice"] = comp_audit.share_of_voice
            res_dict["geo_score"] = round(comp_audit.target_audit.overall_score, 1)
            res_dict["seo_score"] = round(comp_audit.target_audit.seo_score, 1)

        return res_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audit/cluster")
def audit_cluster_endpoint(req: ClusterAuditRequest):
    """Executes a full human query cluster audit in parallel with competitive comparison."""
    try:
        client = get_llm_client(req.provider)
        summary = QueryService.audit_cluster(
            seed_query=req.query,
            target_brand_url=req.brand_url,
            competitors=req.competitors,
            auto_discover_competitors=req.auto_discover_competitors,
            client=client,
        )
        comparative = ScoringService.calculate_comparative_report(summary)
        return {
            "cluster_summary": summary.to_dict(),
            "comparative_report": comparative.to_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audit/full")
def full_audit_endpoint(req: FullAuditRequest):
    """
    Executes a complete closed-loop audit:
    1. On-Page GEO factors audit (if on_page_target provided)
    2. Query cluster expansion & parallel LLM response analysis
    3. AI Visibility score, Share of Voice, and competitive benchmark report.
    """
    try:
        client = get_llm_client(req.provider)
        
        # 1. On-page GEO audit
        page_audit_dict = None
        if req.on_page_target:
            page_audit = CrawlerService.audit_page(req.on_page_target)
            page_audit_dict = page_audit.to_dict()

        # 2. Query cluster LLM audit
        summary = QueryService.audit_cluster(
            seed_query=req.query,
            target_brand_url=req.brand_url,
            competitors=req.competitors,
            auto_discover_competitors=req.auto_discover_competitors,
            client=client,
        )

        # 3. Comparative report & Share of Voice
        comparative = ScoringService.calculate_comparative_report(summary)

        return {
            "target_brand": summary.target_brand_name,
            "target_domain": summary.target_brand_domain,
            "page_audit": page_audit_dict,
            "cluster_summary": summary.to_dict(),
            "comparative_report": comparative.to_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/competitors/discover")
def discover_competitors_endpoint(req: DiscoverCompetitorsRequest):
    """Auto-discovers top competing brands and domains."""
    try:
        client = get_llm_client(req.provider)
        comps = CompetitorService.discover(
            brand_url_or_topic=req.brand_or_topic,
            client=client,
            limit=req.limit,
        )
        return {"competitors": [c.to_dict() for c in comps]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/queries/expand")
def expand_queries_endpoint(req: ExpandQueriesRequest):
    """Expands a natural user search query into diverse human variations."""
    try:
        client = get_llm_client(req.provider)
        variations = QueryService.expand_human_queries(
            seed_query=req.query,
            target_brand_url=req.brand_url,
            competitors=req.competitors,
            client=client,
            count=req.count,
        )
        return {"variations": [v.to_dict() for v in variations]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# Module 4: Citation Gap Analysis
# ──────────────────────────────────────────────────────────────────────────────

class CitationGapRequest(BaseModel):
    query: str = Field(..., example="best project management software")
    brand_url: str = Field(..., example="https://pulsetask.io")
    competitors: Optional[List[str]] = None
    auto_discover_competitors: bool = Field(default=True)
    count: int = Field(default=5, ge=3, le=10)
    provider: str = Field(default="Gemini")


@router.post("/citation-gap/analyse")
def citation_gap_endpoint(req: CitationGapRequest):
    """
    Module 4: Citation Gap Analysis.
    Runs a query cluster audit, then analyses which third-party sources
    AI assistants cite when competitors win and the target brand is absent.
    Returns ranked observed gaps and suggested industry listings.
    """
    try:
        client = get_llm_client(req.provider)
        summary = QueryService.audit_cluster(
            seed_query=req.query,
            target_brand_url=req.brand_url,
            competitors=req.competitors,
            auto_discover_competitors=req.auto_discover_competitors,
            client=client,
        )

        # Build cluster result dicts for the gap service
        cluster_dicts = [r.to_dict() for r in summary.results]

        # Competitor URLs from discovered competitors
        competitor_urls = list(summary.competitor_mentions.keys()) if summary.competitor_mentions else []
        if req.competitors:
            competitor_urls = req.competitors + competitor_urls

        gap_report = CitationGapService.analyse(
            cluster_results=cluster_dicts,
            target_brand_url=req.brand_url,
            competitor_urls=competitor_urls,
        )

        return {
            "brand_url": req.brand_url,
            "query": req.query,
            "gap_report": gap_report.to_dict(),
            "cluster_summary": summary.to_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# Module 5: Evidence-Grounded AI Advisor
# ──────────────────────────────────────────────────────────────────────────────

class EvidenceAdvisorRequest(BaseModel):
    query: str = Field(..., example="best agile sprint software")
    brand_url: str = Field(..., example="https://pulsetask.io")
    on_page_target: Optional[str] = Field(default=None)
    competitors: Optional[List[str]] = None
    auto_discover_competitors: bool = Field(default=True)
    count: int = Field(default=5, ge=3, le=10)
    provider: str = Field(default="Gemini")


def _build_evidence_list(
    summary, comp_audit, gap_report
) -> List[Dict[str, Any]]:
    """
    Assembles structured evidence items E1..En from:
    - Query cluster results (mention, citation, SOV gaps)
    - On-page GEO/SEO audit findings
    - Citation gap observations
    """
    evidence = []
    eid = 1

    # Evidence from mention rate
    if summary:
        m_rate = summary.mention_rate_pct
        c_rate = summary.citation_rate_pct
        if m_rate < 50:
            evidence.append({
                "id": f"E{eid}",
                "finding": f"Brand mentioned in only {round(m_rate)}% of AI queries for '{summary.seed_query}'",
                "category": "mention_gap",
                "severity": "high" if m_rate < 25 else "medium",
            })
            eid += 1
        if c_rate < 30:
            evidence.append({
                "id": f"E{eid}",
                "finding": f"Brand cited as a source URL in only {round(c_rate)}% of answers — AI assistants don't trust the domain enough to link it",
                "category": "citation_gap",
                "severity": "high",
            })
            eid += 1

    # Evidence from on-page audit
    if comp_audit:
        target = comp_audit.get("target_audit", {})
        factors = target.get("factors", {})
        for factor_name, factor_data in factors.items():
            if isinstance(factor_data, dict):
                st = factor_data.get("status")
                f_name = factor_data.get("name", factor_name.replace("_", " ").title())
                f_summary = factor_data.get("summary", "")
                if st in ("FAILED", "WARNING"):
                    evidence.append({
                        "id": f"E{eid}",
                        "finding": f"On-page GEO factor {st}: {f_name} scored {factor_data.get('score', 0):.0f}/100 — {f_summary}",
                        "category": "geo_factor",
                        "severity": "high" if st == "FAILED" else "medium",
                    })
                    eid += 1
                elif st == "PASSED" and eid <= 6:
                    evidence.append({
                        "id": f"E{eid}",
                        "finding": f"Verified On-Page Strength: {f_name} passed ({factor_data.get('score', 0):.0f}/100) — {f_summary}",
                        "category": "strength",
                        "severity": "low",
                    })
                    eid += 1

    # Evidence from citation gaps
    if gap_report and gap_report.get("observed"):
        for gap_entry in gap_report["observed"][:5]:
            dom = gap_entry["domain"]
            n = gap_entry["gap_citation_count"]
            comps = ", ".join(gap_entry.get("competitors_seen_with", [])[:2])
            evidence.append({
                "id": f"E{eid}",
                "finding": f"{dom} was cited {n} times in answers where {comps or 'competitors'} were recommended and target was missing",
                "category": "citation_source_gap",
                "severity": "high" if n >= 3 else "medium",
                "domain": dom,
                "action": gap_entry.get("action", ""),
            })
            eid += 1

    return evidence


def _generate_advisor_recommendations(
    evidence: List[Dict], client, provider: str
) -> List[Dict[str, Any]]:
    """
    Calls LLM to generate evidence-grounded recommendations.
    Each recommendation must cite evidence IDs.
    Falls back to rule-based if LLM fails.
    """
    if not evidence:
        return []

    evidence_text = "\n".join(
        f"{e['id']} ({e['category']}, {e['severity']}): {e['finding']}"
        for e in evidence
    )

    prompt = f"""You are an AI visibility strategy advisor.
Below are measured evidence items (E-codes) from an analysis run.
Generate exactly 5 JSON recommendations. Each MUST cite at least one evidence ID.

EVIDENCE:
{evidence_text}

Return ONLY a valid JSON array like:
[
  {{
    "priority": "HIGH",
    "title": "Short action title",
    "recommendation": "Concrete 1-2 sentence action",
    "evidence_ids": ["E1", "E3"],
    "impact": "Expected outcome"
  }}
]
No extra text. No markdown code block. Just the JSON array."""

    try:
        import json
        resp = client.query(prompt)
        text = resp.answer if hasattr(resp, "answer") else resp.text
        # Strip markdown fences if present
        text = text.strip()
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:])
        if text.endswith("```"):
            text = "\n".join(text.split("\n")[:-1])
        recs = json.loads(text.strip())
        # Validate evidence IDs
        valid_ids = {e["id"] for e in evidence}
        for r in recs:
            r["evidence_ids"] = [eid for eid in r.get("evidence_ids", []) if eid in valid_ids]
        return recs[:5]
    except Exception:
        # Rule-based fallback
        return _rule_based_recommendations(evidence)


def _rule_based_recommendations(evidence: List[Dict]) -> List[Dict[str, Any]]:
    """Generates deterministic rule-based recommendations as fallback."""
    recs = []
    seen_cats: set = set()
    priority_map = {"high": "HIGH", "medium": "MEDIUM", "low": "LOW"}

    for e in evidence:
        cat = e["category"]
        if cat in seen_cats:
            continue
        seen_cats.add(cat)
        p = priority_map.get(e["severity"], "MEDIUM")

        if cat == "mention_gap":
            recs.append({
                "priority": p,
                "title": "Boost organic AI mentions with intent-matching content",
                "recommendation": "Create dedicated comparison and best-of pages that directly answer the lost queries. Structure each page with a TL;DR answer at the top.",
                "evidence_ids": [e["id"]],
                "impact": "Increase mention rate by appearing in direct-answer sections of AI responses.",
            })
        elif cat == "citation_gap":
            recs.append({
                "priority": p,
                "title": "Unlock AI source citations by opening crawler access",
                "recommendation": "Add GPTBot, PerplexityBot, and ClaudeBot to robots.txt. Add FAQPage JSON-LD and verified statistics that AI models can quote.",
                "evidence_ids": [e["id"]],
                "impact": "Make the brand domain citable as a source URL in AI answers.",
            })
        elif cat == "geo_factor":
            recs.append({
                "priority": p,
                "title": "Fix on-page GEO factor",
                "recommendation": e["finding"],
                "evidence_ids": [e["id"]],
                "impact": "Improve GEO score and AI readability of the page.",
            })
        elif cat == "citation_source_gap":
            recs.append({
                "priority": p,
                "title": f"Get listed on {e.get('domain', 'key third-party platform')}",
                "recommendation": e.get("action", f"Claim a profile on {e.get('domain', 'this platform')} — AI cites it when recommending competitors."),
                "evidence_ids": [e["id"]],
                "impact": "Appear in the sources AI uses when making recommendations.",
            })
        if len(recs) >= 5:
            break

    return recs


@router.post("/advisor/evidence")
def evidence_advisor_endpoint(req: EvidenceAdvisorRequest):
    """
    Module 5: Evidence-Grounded AI Advisor.
    Runs a full audit pipeline and returns recommendations each linked
    to specific measured evidence items (E-codes).
    """
    try:
        client = get_llm_client(req.provider)

        # 1. Query cluster audit
        summary = QueryService.audit_cluster(
            seed_query=req.query,
            target_brand_url=req.brand_url,
            competitors=req.competitors,
            auto_discover_competitors=req.auto_discover_competitors,
            client=client,
        )

        # 2. On-page audit (auto-targets brand_url if on_page_target not provided)
        comp_audit_dict = None
        target_page = req.on_page_target or req.brand_url
        if target_page:
            try:
                comp_audit = CrawlerService.compare_with_competitors(target_page, req.competitors)
                comp_audit_dict = comp_audit.to_dict()
            except Exception:
                pass

        # 3. Citation gap
        competitor_urls = list(summary.competitor_mentions.keys()) if summary.competitor_mentions else []
        if req.competitors:
            competitor_urls = req.competitors + competitor_urls

        gap_report = CitationGapService.analyse(
            cluster_results=[r.to_dict() for r in summary.results],
            target_brand_url=req.brand_url,
            competitor_urls=competitor_urls,
        )
        gap_dict = gap_report.to_dict()

        # 4. Build evidence list
        evidence = _build_evidence_list(summary, comp_audit_dict, gap_dict)

        # 5. Generate recommendations
        recommendations = _generate_advisor_recommendations(evidence, client, req.provider)

        return {
            "brand_url": req.brand_url,
            "query": req.query,
            "evidence": evidence,
            "recommendations": recommendations,
            "cluster_summary": summary.to_dict(),
            "gap_report": gap_dict,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
