"""
Scoring and Comparative Benchmark Data Models.
"""
from __future__ import annotations

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class BrandScoreDetail(BaseModel):
    """Holistic visibility metrics for a single brand across a query cluster."""
    brand_name: str
    domain: str
    is_target: bool = False
    mention_count: int = 0
    mention_rate: float = Field(0.0, ge=0.0, le=100.0)
    citation_count: int = 0
    citation_rate: float = Field(0.0, ge=0.0, le=100.0)
    average_rank: Optional[float] = None
    sentiment_score: float = Field(0.0, ge=-1.0, le=1.0)
    composite_visibility_score: float = Field(0.0, ge=0.0, le=100.0)
    share_of_voice: float = Field(0.0, ge=0.0, le=100.0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "brand_name": self.brand_name,
            "domain": self.domain,
            "is_target": self.is_target,
            "mention_count": self.mention_count,
            "mention_rate": round(self.mention_rate, 1),
            "citation_count": self.citation_count,
            "citation_rate": round(self.citation_rate, 1),
            "average_rank": round(self.average_rank, 1) if self.average_rank else None,
            "sentiment_score": round(self.sentiment_score, 2),
            "composite_visibility_score": round(self.composite_visibility_score, 1),
            "share_of_voice": round(self.share_of_voice, 1),
        }


class ComparativeAuditReport(BaseModel):
    """Comparative report combining target brand and discovered competitors."""
    seed_query: str
    total_queries_tested: int
    target_brand: BrandScoreDetail
    competitors: List[BrandScoreDetail] = Field(default_factory=list)
    winner_brand: str
    gap_analysis: List[str] = Field(default_factory=list)
    formula_explanation: str = (
        "AI Visibility Score = 100 * (0.7 * MentionRate + 0.3 * CitationRate) + SentimentAdjustment (-10 to +5). "
        "Share of Voice = Target Brand Mentions / Total Mentions Across Brands."
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "seed_query": self.seed_query,
            "total_queries_tested": self.total_queries_tested,
            "target_brand": self.target_brand.to_dict(),
            "competitors": [c.to_dict() for c in self.competitors],
            "winner_brand": self.winner_brand,
            "gap_analysis": self.gap_analysis,
            "formula_explanation": self.formula_explanation,
        }
