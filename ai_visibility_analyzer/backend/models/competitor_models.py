"""
Competitor and Brand Domain Models.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Dict, Optional


@dataclass
class CompetitorInfo:
    brand: str
    domain: str
    url: str

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)


@dataclass
class BrandMentionResult:
    brand: str
    url: str
    is_mentioned: bool
    position: Optional[str] = None  # "Early" | "Mid" | "Late" | None
    is_cited: bool = False
    sentiment: Optional[str] = None  # "Positive" | "Neutral" | "Negative" | None
