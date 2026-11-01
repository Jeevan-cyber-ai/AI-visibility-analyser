"""
Citation Gap Analysis Service (Module 4).

Algorithm:
1. Collect all cited URLs from each AI answer in the cluster
2. Filter out target + competitor domains
3. Flag gaps: answers where a competitor appeared but target didn't
4. Classify source type: platform, community, publisher, video, listing
5. Rank by priority = 2 * gap_citations + total_citations
6. Suggest additional industry-standard sources not observed
"""
from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from typing import Dict, List, Optional

from utils.domain_utils import extract_root_domain


# ────────────────────── Source classifier ────────────────────────────────────

PLATFORM_PATTERNS = {
    "platform": re.compile(
        r"(g2\.com|capterra\.com|trustradius\.com|getapp\.com|softwareadvice\.com)", re.I
    ),
    "community": re.compile(
        r"(reddit\.com|producthunt\.com|hackernews|dev\.to|stackoverflow\.com|quora\.com|indiehackers\.com)", re.I
    ),
    "publisher": re.compile(
        r"(forbes\.com|techcrunch\.com|wired\.com|zdnet\.com|cnet\.com|venturebeat\.com|businessinsider\.com|tomsguide\.com)", re.I
    ),
    "video": re.compile(
        r"(youtube\.com|youtu\.be|vimeo\.com)", re.I
    ),
    "listing": re.compile(
        r"(alternativeto\.net|slashdot\.org|sourceforge\.net|betalist\.com|f6s\.com|crunchbase\.com)", re.I
    ),
}

# Industry-wide suggested sources that are commonly cited by AI assistants
SUGGESTED_SOURCES = [
    {"domain": "g2.com", "type": "platform", "action": "Claim and collect reviews on G2"},
    {"domain": "capterra.com", "type": "platform", "action": "List product on Capterra"},
    {"domain": "producthunt.com", "type": "community", "action": "Launch / update your Product Hunt page"},
    {"domain": "reddit.com", "type": "community", "action": "Participate in relevant subreddits"},
    {"domain": "trustradius.com", "type": "platform", "action": "Claim TrustRadius profile"},
    {"domain": "alternativeto.net", "type": "listing", "action": "Add product on AlternativeTo"},
    {"domain": "youtube.com", "type": "video", "action": "Publish tutorial / review videos"},
    {"domain": "techcrunch.com", "type": "publisher", "action": "Pitch a story or press release"},
    {"domain": "forbes.com", "type": "publisher", "action": "Get mentioned in Forbes listicles"},
]


def _classify_source_type(domain: str) -> str:
    for src_type, pattern in PLATFORM_PATTERNS.items():
        if pattern.search(domain):
            return src_type
    return "publisher"


# ────────────────────── Data models ──────────────────────────────────────────

@dataclass
class CitationGapEntry:
    domain: str
    source_type: str          # platform | community | publisher | video | listing
    gap_citation_count: int   # times cited when we were missing
    total_citation_count: int # times cited across all answers
    priority: int             # 2 * gap + total
    competitors_seen_with: List[str] = field(default_factory=list)
    example_queries: List[str] = field(default_factory=list)
    action: str = ""
    is_observed: bool = True

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class CitationGapReport:
    target_domain: str
    observed: List[CitationGapEntry]    # Sources found in real AI answers where target was missing
    suggested: List[CitationGapEntry]   # Industry sources not observed
    total_answers_analysed: int
    gap_answers_count: int              # answers where competitor appeared but not target

    def to_dict(self) -> Dict:
        return {
            "target_domain": self.target_domain,
            "observed": [e.to_dict() for e in self.observed],
            "suggested": [e.to_dict() for e in self.suggested],
            "total_answers_analysed": self.total_answers_analysed,
            "gap_answers_count": self.gap_answers_count,
        }


# ────────────────────── Main service ─────────────────────────────────────────

class CitationGapService:
    """
    Analyses AI query cluster results to find third-party sources
    where competitors are being cited but the target brand is missing.
    """

    @classmethod
    def analyse(
        cls,
        cluster_results: List[Dict],
        target_brand_url: str,
        competitor_urls: List[str],
    ) -> CitationGapReport:
        """
        Parameters
        ----------
        cluster_results : list of QueryAuditResult.to_dict() dicts
        target_brand_url : the brand being analysed
        competitor_urls  : list of competitor URLs/domains
        """
        target_dom = extract_root_domain(target_brand_url)
        competitor_doms = {extract_root_domain(u) for u in competitor_urls}
        all_own_doms = {target_dom} | competitor_doms

        # domain → { gap_count, total_count, competitors_seen, queries }
        domain_stats: Dict[str, Dict] = defaultdict(lambda: {
            "gap": 0, "total": 0, "competitors": set(), "queries": []
        })

        total_answers = len(cluster_results)
        gap_answers = 0

        for result in cluster_results:
            target_mentioned = result.get("target_mentioned", False)
            competitors_mentioned = result.get("competitors_mentioned", [])
            citations = result.get("citations", [])
            query_text = result.get("query", "")

            # Only analyse answers where target was NOT mentioned but competitor WAS
            is_gap_answer = (not target_mentioned) and len(competitors_mentioned) > 0
            if is_gap_answer:
                gap_answers += 1

            # Analyse all citations in the answer
            for url in citations:
                dom = extract_root_domain(url)
                if not dom or dom in all_own_doms:
                    continue  # skip own/competitor domains
                domain_stats[dom]["total"] += 1
                if is_gap_answer:
                    domain_stats[dom]["gap"] += 1
                    for c in competitors_mentioned:
                        domain_stats[dom]["competitors"].add(str(c))
                    if query_text and query_text not in domain_stats[dom]["queries"]:
                        domain_stats[dom]["queries"].append(query_text[:120])

        # Build observed entries (only domains that appeared at least once in a gap)
        observed: List[CitationGapEntry] = []
        observed_domains: set = set()

        for dom, stats in domain_stats.items():
            if stats["gap"] == 0:
                continue
            priority = 2 * stats["gap"] + stats["total"]
            action = cls._suggest_action(dom)
            entry = CitationGapEntry(
                domain=dom,
                source_type=_classify_source_type(dom),
                gap_citation_count=stats["gap"],
                total_citation_count=stats["total"],
                priority=priority,
                competitors_seen_with=list(stats["competitors"])[:3],
                example_queries=stats["queries"][:2],
                action=action,
                is_observed=True,
            )
            observed.append(entry)
            observed_domains.add(dom)

        # Sort by priority desc
        observed.sort(key=lambda e: e.priority, reverse=True)

        # Build suggested entries (industry sources not observed)
        suggested: List[CitationGapEntry] = []
        for s in SUGGESTED_SOURCES:
            if s["domain"] not in observed_domains:
                suggested.append(CitationGapEntry(
                    domain=s["domain"],
                    source_type=s["type"],
                    gap_citation_count=0,
                    total_citation_count=0,
                    priority=0,
                    action=s["action"],
                    is_observed=False,
                ))

        return CitationGapReport(
            target_domain=target_dom,
            observed=observed,
            suggested=suggested,
            total_answers_analysed=total_answers,
            gap_answers_count=gap_answers,
        )

    @staticmethod
    def _suggest_action(domain: str) -> str:
        """Returns a concrete action suggestion for a third-party source domain."""
        for s in SUGGESTED_SOURCES:
            if s["domain"] in domain:
                return s["action"]
        src_type = _classify_source_type(domain)
        actions = {
            "platform": f"Claim and build a profile on {domain}",
            "community": f"Engage and contribute content on {domain}",
            "publisher": f"Pitch an article or press mention on {domain}",
            "video": f"Publish a product walkthrough on {domain}",
            "listing": f"List your product on {domain}",
        }
        return actions.get(src_type, f"Get featured on {domain}")

