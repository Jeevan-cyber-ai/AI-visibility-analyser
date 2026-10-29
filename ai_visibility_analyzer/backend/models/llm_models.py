"""
LLM Data Models and DTOs.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class LLMResponse:
    provider: str
    query: str
    text: str
    citations: List[str] = field(default_factory=list)
    is_mock: bool = False
    error: Optional[str] = None
