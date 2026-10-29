"""
Standardized LLM client interface and provider adapters.
Supports Gemini (with Google Search Grounding for live source links, supporting both AI Studio & Vertex Express endpoints),
Perplexity, ChatGPT, Claude, and a deterministic offline Mock fallback.
"""
from __future__ import annotations

import json
import os
import random
import re
from dataclasses import dataclass, field
from typing import List, Optional

import requests
from .config import Config

SYSTEM_PROMPT = (
    "Answer the user's question helpfully, concisely, and objectively. "
    "Name specific products, companies, tools, or websites where relevant."
)

ENDPOINTS = {
    "vertex": "https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent",
    "ai_studio": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
}


@dataclass
class LLMResponse:
    provider: str
    query: str
    text: str
    citations: List[str] = field(default_factory=list)
    is_mock: bool = False
    error: Optional[str] = None


class BaseLLMClient:
    def query(self, prompt: str) -> LLMResponse:
        raise NotImplementedError


class GeminiClient(BaseLLMClient):
    """
    Google Gemini Client with Google Search Grounding enabled.
    Supports both classic Google AI Studio and Vertex AI Express keys.
    """
    MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest", "gemini-pro"]

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or Config.GEMINI_API_KEY

    def _endpoint_order(self) -> List[str]:
        # Google AI Studio (generativelanguage.googleapis.com) is fastest and works with both AIza and AQ keys
        return ["ai_studio", "vertex"]

    def query(self, prompt: str) -> LLMResponse:
        if not self.api_key:
            return MockClient("Gemini").query(prompt)

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

        # Try endpoints according to key format
        for endpoint in self._endpoint_order():
            for model in self.MODELS:
                url = ENDPOINTS[endpoint].format(model=model)
                payload = {
                    "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\nUser Question: {prompt}"}]}],
                    "tools": [{"google_search": {}}],  # Enable Google Search Grounding for live citations
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1200},
                }
                try:
                    r = requests.post(url, headers=headers, json=payload, timeout=35)
                    if r.status_code == 429:
                        import time
                        time.sleep(3.5)
                        r = requests.post(url, headers=headers, json=payload, timeout=35)
                    if r.status_code in (401, 403):
                        # Key not valid for this endpoint, try next endpoint
                        break
                    if r.status_code in (404, 400):
                        # Model not supported or grounding payload variant
                        # Try without tools
                        payload.pop("tools", None)
                        r = requests.post(url, headers=headers, json=payload, timeout=30)
                        if not r.ok:
                            continue

                    if r.ok:
                        data = r.json()
                        candidate = data.get("candidates", [{}])[0]
                        text_parts = candidate.get("content", {}).get("parts", [])
                        text = "".join(p.get("text", "") for p in text_parts)

                        # Extract citations from search grounding metadata
                        citations: List[str] = []
                        grounding = candidate.get("groundingMetadata", {})
                        chunks = grounding.get("groundingChunks", [])
                        for chunk in chunks:
                            web = chunk.get("web", {})
                            uri = web.get("uri")
                            if uri and uri not in citations:
                                citations.append(uri)

                        if text:
                            return LLMResponse(provider="Gemini", query=prompt, text=text, citations=citations, is_mock=False)
                except Exception:
                    continue

        # If all live attempts fail, fallback to mock with clear flag
        return MockClient("Gemini").query(prompt)


class PerplexityClient(BaseLLMClient):
    """Perplexity Sonar client - returns live answers and web citation URLs."""
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or Config.PERPLEXITY_API_KEY

    def query(self, prompt: str) -> LLMResponse:
        if not self.api_key:
            return MockClient("Perplexity").query(prompt)

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": Config.PERPLEXITY_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }
        try:
            r = requests.post("https://api.perplexity.ai/chat/completions", headers=headers, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            text = data["choices"][0]["message"]["content"]
            citations = data.get("citations") or [
                s.get("url") for s in data.get("search_results", []) if s.get("url")
            ]
            return LLMResponse(provider="Perplexity", query=prompt, text=text, citations=citations, is_mock=False)
        except Exception:
            return MockClient("Perplexity").query(prompt)


class OpenAIClient(BaseLLMClient):
    """OpenAI ChatGPT client."""
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or Config.OPENAI_API_KEY

    def query(self, prompt: str) -> LLMResponse:
        if not self.api_key:
            return MockClient("ChatGPT").query(prompt)

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": Config.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
        }
        try:
            r = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            text = data["choices"][0]["message"]["content"]
            return LLMResponse(provider="ChatGPT", query=prompt, text=text, citations=[], is_mock=False)
        except Exception:
            return MockClient("ChatGPT").query(prompt)


class MockClient(BaseLLMClient):
    """
    Deterministic simulated LLM for testing without API keys.
    Provides realistic answers and realistic review/community citations.
    """
    def __init__(self, provider_name: str = "MockAI"):
        self.provider_name = provider_name

    def query(self, prompt: str) -> LLMResponse:
        seed = hash((self.provider_name, prompt)) & 0xFFFFFFFF
        rng = random.Random(seed)

        p_lower = prompt.lower()
        if any(w in p_lower for w in ["antivirus", "security", "malware", "virus", "cyber"]):
            tools = ["Bitdefender", "Norton", "Malwarebytes", "Avast", "McAfee", "Kaspersky"]
            category_slug = "antivirus-software"
        elif any(w in p_lower for w in ["cleaning", "organic", "food", "snack"]):
            tools = ["Method", "Seventh Generation", "Ecover", "Mrs. Meyer's", "Blueland"]
            category_slug = "consumer-products"
        else:
            tools = ["ClickUp", "Linear", "Jira", "Notion", "Monday.com", "Asana"]
            category_slug = "project-management"

        rng.shuffle(tools)
        selected = tools[:4]

        text = (
            f"When looking for solutions related to this query in 2026, top recommended options include:\n\n"
            f"1. **{selected[0]}** - Frequently highlighted for its balanced performance, reliable protection/features, and ease of use.\n"
            f"2. **{selected[1]}** - Popular choice with comprehensive toolsets and strong industry reputation.\n"
            f"3. **{selected[2]}** - Specialized option known for lightweight footprint and fast scans.\n"
            f"4. **{selected[3]}** - Widely used option with solid free or budget-tier capabilities.\n\n"
            f"For most users, {selected[0]} and {selected[1]} are currently the most frequently recommended."
        )

        # Realistic citations from third-party authority sites
        citations = [
            f"https://www.g2.com/categories/{category_slug}",
            f"https://www.capterra.com/categories/{category_slug}",
            f"https://www.reddit.com/r/technology/comments/best_recommendations_2026/",
            f"https://{selected[0].lower().replace(' ', '').replace('.','')}.com",
            f"https://{selected[1].lower().replace(' ', '').replace('.','')}.com",
        ]

        return LLMResponse(
            provider=self.provider_name,
            query=prompt,
            text=text,
            citations=citations,
            is_mock=True,
        )


def get_llm_client(provider: str = "Gemini") -> BaseLLMClient:
    """Factory function to get the appropriate LLM client."""
    provider_lower = provider.lower()
    if "gemini" in provider_lower or "google" in provider_lower:
        return GeminiClient()
    elif "perplexity" in provider_lower:
        return PerplexityClient()
    elif "chatgpt" in provider_lower or "openai" in provider_lower:
        return OpenAIClient()
    return MockClient(provider)
