"""
Crawler and On-Page GEO Audit Data Models.
"""
from __future__ import annotations

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class FactorDetail(BaseModel):
    """Represents the evaluation of a specific on-page GEO factor."""
    name: str
    weight: float = Field(..., ge=0.0, le=1.0)
    score: float = Field(..., ge=0.0, le=100.0)
    status: str = Field(..., example="PASSED")  #"PASSED" | "WARNING" | "FAILED"
    summary: str
    evidence: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    suggested_snippet: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "weight": self.weight,
            "score": round(self.score, 1),
            "weighted_score": round(self.score * self.weight, 1),
            "status": self.status,
            "summary": self.summary,
            "evidence": self.evidence,
            "recommendations": self.recommendations,
            "suggested_snippet": self.suggested_snippet,
        }


class PageAuditResult(BaseModel):
    """Aggregate result of an on-page GEO crawl and audit."""
    url_or_path: str
    brand_name: str = Field(default="", example="Notion")
    page_title: Optional[str] = None
    meta_description: Optional[str] = None
    overall_score: float = Field(default=0.0)
    seo_score: float = Field(default=70.0)
    grade: str = Field(..., example="A")
    factors: Dict[str, FactorDetail] = Field(default_factory=dict)
    seo_details: Dict[str, Any] = Field(default_factory=dict)
    stats_summary: Dict[str, Any] = Field(default_factory=dict)
    key_recommendations: List[str] = Field(default_factory=list)

    @staticmethod
    def calculate_grade(score: float) -> str:
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 55:
            return "D"
        return "F"

    def to_dict(self) -> Dict[str, Any]:
        clamped_overall = round(min(100.0, max(0.0, self.overall_score)), 1)
        clamped_seo = round(min(100.0, max(0.0, self.seo_score)), 1)
        return {
            "url_or_path": self.url_or_path,
            "brand_name": self.brand_name,
            "page_title": self.page_title,
            "meta_description": self.meta_description,
            "overall_score": clamped_overall,
            "geo_score": clamped_overall,
            "seo_score": clamped_seo,
            "grade": self.grade,
            "factors": {k: v.to_dict() for k, v in self.factors.items()},
            "seo_details": self.seo_details,
            "stats_summary": self.stats_summary,
            "key_recommendations": self.key_recommendations,
        }


class ComparativePageAudit(BaseModel):
    """Side-by-side on-page GEO comparison of target brand against competitors."""
    target_brand: str
    target_audit: PageAuditResult
    competitors: List[PageAuditResult] = Field(default_factory=list)
    rank_position: int = 1
    total_sites: int = 1
    winner_brand: str = ""
    competitive_gap_summary: str = ""
    actionable_bullet_points: List[str] = Field(default_factory=list)
    ai_visibility_score: Optional[float] = None
    share_of_voice: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "target_brand": self.target_brand,
            "target_audit": self.target_audit.to_dict(),
            "competitors": [c.to_dict() for c in self.competitors],
            "rank_position": self.rank_position,
            "total_sites": self.total_sites,
            "winner_brand": self.winner_brand,
            "competitive_gap_summary": self.competitive_gap_summary,
            "actionable_bullet_points": self.actionable_bullet_points,
            "ai_visibility_score": round(self.ai_visibility_score, 1) if self.ai_visibility_score is not None else None,
            "share_of_voice": round(self.share_of_voice, 1) if self.share_of_voice is not None else None,
        }
