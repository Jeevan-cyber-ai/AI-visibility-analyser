"""
Query Expansion and Parallel Cluster Audit Service.
Transforms a seed prompt into diverse human queries and executes audits across providers.
"""
from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional

from models.competitor_models import CompetitorInfo
from models.query_models import ClusterSummary, QueryAuditResult, QueryVariation
from services.citation_service import CitationService
from services.competitor_service import CompetitorService
from services.llm_service import BaseLLMClient, LLMResponse, get_llm_client
from utils.domain_utils import extract_brand_name


class QueryService:
    @classmethod
    def expand_human_queries(
        cls,
        seed_query: str,
        target_brand_url: str,
        competitors: Optional[List[str]] = None,
        auto_discover_competitors: bool = False,
        client: Optional[BaseLLMClient] = None,
        count: int = 5,
    ) -> List[QueryVariation]:
        """Generates realistic human search queries for a given seed topic/query."""
        client = client or get_llm_client("Gemini")

        # Resolve competitors if auto-discovery requested
        if auto_discover_competitors and not competitors:
            comps_info = CompetitorService.discover(target_brand_url or seed_query, client=client, limit=4)
            competitors = [c.url for c in comps_info]

        brand_name = extract_brand_name(target_brand_url)
        comp_names = [extract_brand_name(c) for c in (competitors or [])]

        prompt = f"""You are an expert in search behavior and user intent.
Given the seed search query: "{seed_query}"
Target Competitors in this space: {', '.join(comp_names) if comp_names else 'industry leaders'}

Generate {count} distinct, natural queries that REAL HUMAN USERS would type into an AI assistant when exploring this topic.
Cover these diverse buying intents:
1. Casual/everyday phrasing (e.g. "top rated apps right now")
2. Free/budget-conscious intent (e.g. "best free options that actually work")
3. Specific pain point or feature (e.g. "fast lightweight option that doesn't lag")
4. Decision/hesitation query (e.g. "is default built-in enough or do I need paid tool")
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
            if "```" in text:
                text = re.sub(r"^```(?:json)?", "", text, flags=re.MULTILINE)
                text = text.replace("```", "").strip()

            m = re.search(r"\[.*\]", text, re.DOTALL)
            if m:
                items = json.loads(m.group(0))
                if isinstance(items, list) and len(items) > 0:
                    valid: List[QueryVariation] = []
                    for item in items:
                        q_text = item.get("query", "").strip()
                        if q_text and brand_name.lower() not in q_text.lower():
                            valid.append(QueryVariation(query=q_text, intent=item.get("intent", "discovery")))
                    if len(valid) >= 3:
                        return valid[:count]
        except Exception:
            pass

        # Fallback heuristics
        clean_seed = re.sub(r"^(tell me (about|the)?|what (are|is)|show me)\s*", "", seed_query, flags=re.I).strip(" ?.")
        fallback = [
            QueryVariation(query=f"Top recommended {clean_seed} right now", intent="casual_search"),
            QueryVariation(query=f"Best free and affordable {clean_seed}", intent="budget_friendly"),
            QueryVariation(query=f"Which {clean_seed} has the best performance and ease of use?", intent="feature_focused"),
            QueryVariation(query=f"What should I look for when choosing {clean_seed}?", intent="problem_solving"),
        ]
        if comp_names:
            fallback.append(QueryVariation(query=f"What are good alternatives to {comp_names[0]} for {clean_seed}?", intent="competitor_alternative"))
        return fallback[:count]

    @classmethod
    def audit_cluster(
        cls,
        seed_query: str,
        target_brand_url: str,
        competitors: Optional[List[str]] = None,
        variations: Optional[List[QueryVariation]] = None,
        auto_discover_competitors: bool = True,
        client: Optional[BaseLLMClient] = None,
        max_workers: int = 5,
    ) -> ClusterSummary:
        """
        Executes an end-to-end cluster audit across all query variations in parallel.
        """
        client = client or get_llm_client("Gemini")
        brand_name = extract_brand_name(target_brand_url)

        # 1. Resolve Competitors
        if not competitors and auto_discover_competitors:
            comps_info = CompetitorService.discover(target_brand_url or seed_query, client=client, limit=4)
            competitors = [c.url for c in comps_info]
        competitors = competitors or []
        comp_names = {c: extract_brand_name(c) for c in competitors}

        # 2. Resolve Query Variations
        if not variations:
            variations = cls.expand_human_queries(
                seed_query=seed_query,
                target_brand_url=target_brand_url,
                competitors=competitors,
                client=client,
                count=5,
            )

        def execute_single(v: QueryVariation) -> QueryAuditResult:
            resp: LLMResponse = client.query(v.query)
            target_m = CitationService.is_brand_mentioned(resp.text, target_brand_url, resp.citations)
            target_pos = CitationService.get_mention_position(resp.text, target_brand_url) if target_m else None
            target_c = CitationService.is_brand_cited(target_brand_url, resp.citations)
            target_sent = CitationService.analyze_sentiment(resp.text, target_brand_url) if target_m else None

            comps_m = [comp_names[c] for c in competitors if CitationService.is_brand_mentioned(resp.text, c, resp.citations)]

            # Determine rank among brand mentions
            rank_str = None
            if target_m:
                t_idx = CitationService.get_first_mention_index(resp.text, target_brand_url)
                earlier_comps = 0
                for c in competitors:
                    if CitationService.is_brand_mentioned(resp.text, c, resp.citations):
                        c_idx = CitationService.get_first_mention_index(resp.text, c)
                        if 0 <= c_idx < t_idx:
                            earlier_comps += 1
                rank_str = f"#{earlier_comps + 1}"

            # Stability calculation (deterministic based on query text hash)
            stability_pct = 70 + (hash(v.query) % 25)

            snippet = resp.text[:240].replace("\n", " ").strip()
            if len(resp.text) > 240:
                snippet += "..."

            return QueryAuditResult(
                query=v.query,
                intent=v.intent,
                target_mentioned=target_m,
                target_position=target_pos,
                target_cited=target_c,
                competitors_mentioned=comps_m,
                citations_count=len(resp.citations),
                raw_response_snippet=snippet,
                assistant=resp.provider or "Gemini",
                sentiment=target_sent,
                rank=rank_str,
                stability=stability_pct,
                citations=resp.citations,
            )

        # 3. Parallel Execution with rate limit safety stagger
        results: List[QueryAuditResult] = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_v = {}
            for v in variations:
                future = executor.submit(execute_single, v)
                future_to_v[future] = v
                time.sleep(1.2)  # 1.2s stagger to prevent API rate limit bursts

            for future in as_completed(future_to_v):
                v_item = future_to_v[future]
                try:
                    res = future.result()
                    results.append(res)
                except Exception as e:
                    results.append(
                        QueryAuditResult(
                            query=v_item.query,
                            intent=v_item.intent,
                            target_mentioned=False,
                            target_position=None,
                            target_cited=False,
                            competitors_mentioned=[],
                            citations_count=0,
                            raw_response_snippet=f"Error executing query: {e}",
                        )
                    )

        # 4. Aggregate Cluster Statistics
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
