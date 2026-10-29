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

            # Enrich action bullets with AI search query findings
            if tb.mention_rate < 50:
                res_dict["actionable_bullet_points"].append(
                    f"AI Search Discovery Gap: {comp_audit.target_brand} was mentioned in only {round(tb.mention_rate)}% of search queries for '{req.query}'. Incorporate natural comparative keywords and direct-answer Q&A sections answering this query."
                )
            if tb.citation_rate < 30:
                res_dict["actionable_bullet_points"].append(
                    f"Citation Authority Gap: AI search models did not cite {comp_audit.target_brand} as a linked source. Ensure robots.txt grants access to GPTBot/PerplexityBot and embed verified empirical benchmarks."
                )

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
