"""
Dynamic Query Generation & Parallel Multi-Query Audit Engine.
Features:
1. Human Semantic Expander: Takes any seed query (e.g. "tell me the best antivirus softwares in 2026")
   and generates natural, diverse human variations (free/budget, casual, feature-specific, alternatives).
2. Parallel Dispatcher: Executes all human query variations simultaneously in parallel via ThreadPoolExecutor.
3. Cluster Score Aggregator: Calculates mention rate, citation rate, and competitor share across all variations.
"""
from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Dict, List, Optional

from .citation_checker import (
    brand_name_from_domain,
    get_mention_position,
    is_brand_cited,
    is_brand_mentioned,
)
from .llm_client import BaseLLMClient, LLMResponse, get_llm_client


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


@dataclass
class CompetitorInfo:
    brand: str
    domain: str
    url: str

    def to_dict(self) -> Dict[str, str]:
        return {"brand": self.brand, "domain": self.domain, "url": self.url}


def discover_competitors(
    brand_url_or_topic: str,
    client: Optional[BaseLLMClient] = None,
    limit: int = 4,
) -> List[Dict[str, str]]:
    """
    Auto-discovers top direct competing brands and domains.
    Returns: [{"brand": "Norton", "domain": "norton.com", "url": "https://norton.com"}, ...]
    """
    client = client or get_llm_client("Gemini")
    brand_or_topic = brand_name_from_domain(brand_url_or_topic) if "://" in brand_url_or_topic or "." in brand_url_or_topic else brand_url_or_topic

    prompt = f"""Identify the top {limit} direct competing brands and their official website domains for: "{brand_or_topic}".
Respond ONLY with a valid JSON array of objects with keys: "brand", "domain", "url".
Example:
[
  {{"brand": "Norton", "domain": "norton.com", "url": "https://norton.com"}},
  {{"brand": "McAfee", "domain": "mcafee.com", "url": "https://mcafee.com"}}
]
"""

    try:
        resp = client.query(prompt)
        text = resp.text.strip()
        if "```" in text:
            text = re.sub(r"^```(?:json)?", "", text, flags=re.MULTILINE)
            text = text.replace("```", "").strip()

        m = re.search(r"\[.*\]", text, re.DOTALL)
        if m:
            comps = json.loads(m.group(0))
            if isinstance(comps, list) and len(comps) > 0:
                results = []
                for c in comps[:limit]:
                    if isinstance(c, dict) and "brand" in c and "domain" in c:
                        dom = c["domain"].lower().replace("https://", "").replace("http://", "").removeprefix("www.").split("/")[0]
                        url = c.get("url") or f"https://{dom}"
                        if not url.startswith("http"):
                            url = f"https://{url}"
                        results.append({"brand": c["brand"], "domain": dom, "url": url})
                if results:
                    return results
    except Exception:
        pass

    
    b_lower = brand_or_topic.lower()
    if any(w in b_lower for w in ["antivirus", "security", "bitdefender"]):
        return [
            {"brand": "Norton", "domain": "norton.com", "url": "https://norton.com"},
            {"brand": "McAfee", "domain": "mcafee.com", "url": "https://mcafee.com"},
            {"brand": "Malwarebytes", "domain": "malwarebytes.com", "url": "https://malwarebytes.com"},
            {"brand": "Avast", "domain": "avast.com", "url": "https://avast.com"},
        ][:limit]
    elif any(w in b_lower for w in ["linear", "agile", "project", "jira"]):
        return [
            {"brand": "ClickUp", "domain": "clickup.com", "url": "https://clickup.com"},
            {"brand": "Jira", "domain": "atlassian.com", "url": "https://jira.atlassian.com"},
            {"brand": "Asana", "domain": "asana.com", "url": "https://asana.com"},
            {"brand": "Monday.com", "domain": "monday.com", "url": "https://monday.com"},
        ][:limit]
    return [
        {"brand": "Competitor 1", "domain": "competitor1.com", "url": "https://competitor1.com"},
        {"brand": "Competitor 2", "domain": "competitor2.com", "url": "https://competitor2.com"},
    ][:limit]


def expand_human_queries(
    seed_query: str,
    target_brand_url: str,
    competitors: Optional[List[str]] = None,
    auto_discover_competitors: bool = False,
    client: Optional[BaseLLMClient] = None,
    count: int = 5,
) -> List[Dict[str, str]]:
    """
    Takes any natural query and generates diverse human phrasing variations.
    If auto_discover_competitors=True and competitors is empty, automatically finds rivals.
    """
    client = client or get_llm_client("Gemini")

    if auto_discover_competitors and not competitors:
        discovered = discover_competitors(target_brand_url or seed_query, client=client, limit=4)
        competitors = [c["url"] for c in discovered]
    brand_name = brand_name_from_domain(target_brand_url)
    comp_names = [brand_name_from_domain(c) for c in (competitors or [])]

    client = client or get_llm_client("Gemini")

    # Prompt LLM to act as a human search behavior simulator
    prompt = f"""You are an expert in search behavior and user intent.
Given the seed search query: "{seed_query}"
Target Competitors in this space: {', '.join(comp_names) if comp_names else 'industry leaders'}

Generate {count} distinct, natural queries that REAL HUMAN USERS would type into an AI assistant when exploring this topic.
Cover these diverse buying intents:
1. Casual/everyday phrasing (e.g. "best security app for windows")
2. Free/budget-conscious intent (e.g. "free virus protection tools that actually work")
3. Specific pain point or feature (e.g. "lightweight antivirus that doesn't slow down gaming")
4. Decision/hesitation query (e.g. "is built-in defender enough or do I need third-party antivirus")
5. Alternatives query (e.g. "top alternatives to {comp_names[0] if comp_names else 'the big brands'}")

CRITICAL RULE: Do NOT include the brand name "{brand_name}" in these queries, because these are discovery queries to test if the AI recommends it organically.

Respond ONLY with a valid JSON array of objects with keys "query" and "intent".
Example format:
[
  {{"query": "example human question here", "intent": "casual_search"}},
  {{"query": "another human question", "intent": "budget_friendly"}}
]
"""
    try:
        resp = client.query(prompt)
        text = resp.text.strip()
        # Clean any markdown code blocks
        if "```" in text:
            text = re.sub(r"^```(?:json)?", "", text, flags=re.MULTILINE)
            text = text.replace("```", "").strip()

        # Find JSON array
        m = re.search(r"\[.*\]", text, re.DOTALL)
        if m:
            variations = json.loads(m.group(0))
            if isinstance(variations, list) and len(variations) > 0:
                # Filter out any accidental target brand leaks
                valid = []
                for item in variations:
                    q_text = item.get("query", "")
                    if q_text and brand_name.lower() not in q_text.lower():
                        valid.append({"query": q_text, "intent": item.get("intent", "discovery")})
                if len(valid) >= 3:
                    return valid[:count]
    except Exception:
        pass

    # Heuristic fallback if LLM expansion was unavailable
    clean_seed = re.sub(r"^(tell me (about|the)?|what (are|is)|show me)\s*", "", seed_query, flags=re.I).strip(" ?.")
    fallback = [
        {"query": f"Top recommended {clean_seed} right now", "intent": "casual_search"},
        {"query": f"Best free and affordable {clean_seed}", "intent": "budget_friendly"},
        {"query": f"Which {clean_seed} has the best performance and ease of use?", "intent": "feature_focused"},
        {"query": f"What should I look for when choosing {clean_seed}?", "intent": "problem_solving"},
    ]
    if comp_names:
        fallback.append({"query": f"What are good alternatives to {comp_names[0]} for {clean_seed}?", "intent": "competitor_alternative"})
    return fallback[:count]


def audit_query_cluster(
    seed_query: str,
    target_brand_url: str,
    competitors: Optional[List[str]] = None,
    variations: Optional[List[Dict[str, str]]] = None,
    auto_discover_competitors: bool = True,
    client: Optional[BaseLLMClient] = None,
    max_workers: int = 5,
) -> ClusterSummary:
    """
    Sends all human query variations to the LLM via ThreadPoolExecutor.
    If competitors is empty and auto_discover_competitors=True, discovers competitors dynamically.
    """
    client = client or get_llm_client("Gemini")
    brand_name = brand_name_from_domain(target_brand_url)

    # 1. Resolve competitors: manual vs auto-discovery
    if not competitors and auto_discover_competitors:
        discovered = discover_competitors(target_brand_url or seed_query, client=client, limit=4)
        competitors = [c["url"] for c in discovered]
    competitors = competitors or []
    comp_names = {c: brand_name_from_domain(c) for c in competitors}

    # 2. Resolve variations: generate if not supplied
    if not variations:
        variations = expand_human_queries(
            seed_query=seed_query,
            target_brand_url=target_brand_url,
            competitors=competitors,
            client=client,
            count=5,
        )

    def execute_single(item: Dict[str, str]) -> QueryAuditResult:
        query_text = item["query"]
        intent = item["intent"]
        resp: LLMResponse = client.query(query_text)

        target_m = is_brand_mentioned(resp.text, target_brand_url, resp.citations)
        target_pos = get_mention_position(resp.text, target_brand_url) if target_m else None
        target_c = is_brand_cited(target_brand_url, resp.citations)

        comps_m = [comp_names[c] for c in competitors if is_brand_mentioned(resp.text, c, resp.citations)]

        snippet = resp.text[:240].replace("\n", " ").strip()
        if len(resp.text) > 240:
            snippet += "..."

        return QueryAuditResult(
            query=query_text,
            intent=intent,
            target_mentioned=target_m,
            target_position=target_pos,
            target_cited=target_c,
            competitors_mentioned=comps_m,
            citations_count=len(resp.citations),
            raw_response_snippet=snippet,
        )

    # Execute queries with slight stagger to respect API free-tier rate limits (15 RPM)
    results: List[QueryAuditResult] = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        for item in variations:
            futures.append(executor.submit(execute_single, item))
            import time
            time.sleep(1.2)  # Avoid burst 429 on free tier
        for future in as_completed(futures):
            try:
                res = future.result()
                results.append(res)
            except Exception as e:
                item = future_to_item[future]
                results.append(
                    QueryAuditResult(
                        query=item["query"],
                        intent=item["intent"],
                        target_mentioned=False,
                        target_position=None,
                        target_cited=False,
                        competitors_mentioned=[],
                        citations_count=0,
                        raw_response_snippet=f"Error executing query: {e}",
                    )
                )

    # Aggregate cluster statistics
    total = len(results)
    mentions = sum(r.target_mentioned for r in results)
    citations = sum(r.target_cited for r in results)
    mention_rate = round((mentions / total) * 100, 1) if total > 0 else 0.0
    citation_rate = round((citations / total) * 100, 1) if total > 0 else 0.0

    comp_counts: Dict[str, int] = {c_name: 0 for c_name in comp_names.values()}
    for r in results:
        for c in r.competitors_mentioned:
            comp_counts[c] = comp_counts.get(c, 0) + 1

    return ClusterSummary(
        seed_query=seed_query,
        target_brand=brand_name,
        total_queries=total,
        mentions_count=mentions,
        mention_rate_pct=mention_rate,
        citations_count=citations,
        citation_rate_pct=citation_rate,
        competitor_mentions=comp_counts,
        results=results,
    )
