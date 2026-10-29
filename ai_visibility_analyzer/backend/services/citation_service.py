"""
Citation and Brand Mention Analysis Service.
Handles entity matching, position tracking, sentiment scoring, and citation classification.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional

from models.competitor_models import BrandMentionResult
from utils.domain_utils import (
    build_brand_regex,
    classify_platform_type,
    extract_brand_name,
    extract_root_domain,
)

POSITIVE_TERMS = re.compile(
    r"\b(best|top|recommended|leading|strong|reliable|popular|great|fast|clean|intuitive|powerful)\b",
    re.I
)
NEGATIVE_TERMS = re.compile(
    r"\b(expensive|lacks|limited|slow|difficult|outdated|complicated|buggy|steep|poor)\b",
    re.I
)


class CitationService:
    @staticmethod
    def is_brand_mentioned(text: str, brand_url: str, citations: Optional[List[str]] = None) -> bool:
        """Determines if the brand is mentioned in the text or referenced in citations."""
        pat = build_brand_regex(brand_url)
        if pat.search(text):
            return True
        if citations:
            dom = extract_root_domain(brand_url)
            if any(dom == extract_root_domain(c) for c in citations):
                return True
        return False

    @staticmethod
    def get_first_mention_index(text: str, brand_url: str) -> int:
        pat = build_brand_regex(brand_url)
        m = pat.search(text)
        return m.start() if m else -1

    @classmethod
    def get_mention_position(cls, text: str, brand_url: str) -> Optional[str]:
        """Classifies mention position as 'Early' (<33%), 'Mid' (33-66%), or 'Late' (>66%)."""
        idx = cls.get_first_mention_index(text, brand_url)
        if idx < 0 or len(text) == 0:
            return None
        ratio = idx / len(text)
        if ratio < 0.33:
            return "Early"
        elif ratio < 0.66:
            return "Mid"
        return "Late"

    @staticmethod
    def is_brand_cited(brand_url: str, citations: List[str]) -> bool:
        """Checks if the brand's root domain is explicitly cited in the source list."""
        target_dom = extract_root_domain(brand_url)
        return any(target_dom == extract_root_domain(c) for c in citations)

    @classmethod
    def analyze_sentiment(cls, text: str, brand_url: str) -> Optional[str]:
        """Analyzes sentence context around the brand mention for sentiment."""
        idx = cls.get_first_mention_index(text, brand_url)
        if idx < 0:
            return None
        start = max(text.rfind(".", 0, idx), 0)
        end = text.find(".", idx)
        sentence = text[start : end if end > 0 else len(text)]

        pos = len(POSITIVE_TERMS.findall(sentence))
        neg = len(NEGATIVE_TERMS.findall(sentence))
        if pos > neg:
            return "Positive"
        elif neg > pos:
            return "Negative"
        return "Neutral"

    @staticmethod
    def categorize_citations(citations: List[str], target_brand_url: str) -> Dict[str, List[str]]:
        """Separates citations into target brand, review platforms, communities, and publishers."""
        target_dom = extract_root_domain(target_brand_url)
        grouped: Dict[str, List[str]] = {
            "target_brand": [],
            "review_platforms": [],
            "communities": [],
            "other_sources": [],
        }
        for c in citations:
            dom = extract_root_domain(c)
            if dom == target_dom:
                grouped["target_brand"].append(c)
            else:
                cat = classify_platform_type(dom)
                if cat == "review_platform":
                    grouped["review_platforms"].append(c)
                elif cat == "community":
                    grouped["communities"].append(c)
                else:
                    grouped["other_sources"].append(c)
        return grouped

    @classmethod
    def evaluate_brand(cls, text: str, brand_url: str, citations: List[str]) -> BrandMentionResult:
        """Comprehensive evaluation of a single brand within an answer."""
        brand_name = extract_brand_name(brand_url)
        mentioned = cls.is_brand_mentioned(text, brand_url, citations)
        position = cls.get_mention_position(text, brand_url) if mentioned else None
        cited = cls.is_brand_cited(brand_url, citations)
        sentiment = cls.analyze_sentiment(text, brand_url) if mentioned else None

        return BrandMentionResult(
            brand=brand_name,
            url=brand_url,
            is_mentioned=mentioned,
            position=position,
            is_cited=cited,
            sentiment=sentiment,
        )
