"""
Competitor Discovery Service.
Provides automatic competitor discovery using LLM intelligence with domain heuristic fallbacks.
"""
from __future__ import annotations

import json
import re
from typing import List, Optional

from models.competitor_models import CompetitorInfo
from services.llm_service import BaseLLMClient, get_llm_client
from utils.domain_utils import extract_brand_name


class CompetitorService:
    @classmethod
    def discover(
        cls,
        brand_url_or_topic: str,
        client: Optional[BaseLLMClient] = None,
        limit: int = 4,
    ) -> List[CompetitorInfo]:
        """
        Auto-discovers the top direct competing brands and their domains.
        """
        client = client or get_llm_client("Gemini")
        brand_or_topic = (
            extract_brand_name(brand_url_or_topic)
            if "://" in brand_url_or_topic or "." in brand_url_or_topic
            else brand_url_or_topic
        )

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
                    results: List[CompetitorInfo] = []
                    for c in comps[:limit]:
                        if isinstance(c, dict) and "brand" in c and "domain" in c:
                            dom = (
                                c["domain"]
                                .lower()
                                .replace("https://", "")
                                .replace("http://", "")
                                .removeprefix("www.")
                                .split("/")[0]
                            )
                            url = c.get("url") or f"https://{dom}"
                            if not url.startswith("http"):
                                url = f"https://{url}"
                            results.append(CompetitorInfo(brand=c["brand"], domain=dom, url=url))
                    if results:
                        return results
        except Exception:
            pass

        # Domain heuristic fallback
        return cls._fallback_competitors(brand_or_topic, limit)

    @staticmethod
    def _fallback_competitors(topic: str, limit: int) -> List[CompetitorInfo]:
        t_lower = topic.lower()
        if any(w in t_lower for w in ["antivirus", "security", "bitdefender"]):
            presets = [
                ("Norton", "norton.com", "https://norton.com"),
                ("McAfee", "mcafee.com", "https://mcafee.com"),
                ("Malwarebytes", "malwarebytes.com", "https://malwarebytes.com"),
                ("Avast", "avast.com", "https://avast.com"),
            ]
        elif any(w in t_lower for w in ["linear", "agile", "project", "jira"]):
            presets = [
                ("ClickUp", "clickup.com", "https://clickup.com"),
                ("Jira", "atlassian.com", "https://jira.atlassian.com"),
                ("Asana", "asana.com", "https://asana.com"),
                ("Monday.com", "monday.com", "https://monday.com"),
            ]
        else:
            presets = [
                ("Competitor 1", "competitor1.com", "https://competitor1.com"),
                ("Competitor 2", "competitor2.com", "https://competitor2.com"),
            ]
        return [CompetitorInfo(brand=b, domain=d, url=u) for b, d, u in presets[:limit]]
