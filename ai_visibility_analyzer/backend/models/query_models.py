"""
Query and Cluster Audit Data Models.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Dict, List, Optional


@dataclass
class QueryVariation:
    query: str
    intent: str
    family: str = "discovery"  # "discovery" | "branded"

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)


@dataclass
class QueryAuditResult:
    query: str
    intent: str
    target_mentioned: bool
    target_position: Optional[str]
    target_cited: bool
    competitors_mentioned: List[str]
    citations_count: int
    raw_response_snippet: str
    assistant: str = "Gemini"
    sentiment: Optional[str] = None      # "Positive" | "Neutral" | "Negative" | None
    rank: Optional[str] = None           # "#1", "#2", etc.
    stability: Optional[int] = None      # Agreement % e.g. 84
    citations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ClusterSummary:
    seed_query: str
    target_brand: str
    total_queries: int
    mentions_count: int
    mention_rate_pct: float
    citations_count: int
    citation_rate_pct: float
    competitor_mentions: Dict[str, int]
    results: List[QueryAuditResult]

    def to_dict(self) -> Dict:
        d = asdict(self)
        d["results"] = [r.to_dict() for r in self.results]
        return d
