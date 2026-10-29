"""
LLM Service Layer.
Manages provider adapters for Gemini (with Google Search Grounding), Perplexity, OpenAI, and Mock.
"""
from __future__ import annotations

import json
import random
import re
import time
from typing import List, Optional

import requests
from config.settings import settings
from models.llm_models import LLMResponse

SYSTEM_PROMPT = (
    "Answer the user's question helpfully, concisely, and objectively. "
    "Name specific products, companies, tools, or websites where relevant."
)


class BaseLLMClient:
    def query(self, prompt: str) -> LLMResponse:
        raise NotImplementedError


class GeminiClient(BaseLLMClient):
    """
    Google Gemini Client with Google Search Grounding for live citation discovery.
    Supports AI Studio and Vertex Express endpoints.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.models = settings.GEMINI_MODELS

    def query(self, prompt: str) -> LLMResponse:
        if not self.api_key:
            return MockClient("Gemini").query(prompt)

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

        # Try Google AI Studio first (supports AIza and AQ keys)
        for model in self.models:
            url = settings.GEMINI_AI_STUDIO_URL.format(model=model)
            payload = {
                "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\nUser Question: {prompt}"}]}],
                "tools": [{"google_search": {}}],  # Google Search Grounding
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1200},
            }
            try:
                r = requests.post(url, headers=headers, json=payload, timeout=35)
                # Rate limit retry (429)
                if r.status_code == 429:
                    time.sleep(3.5)
                    r = requests.post(url, headers=headers, json=payload, timeout=35)

                if r.status_code in (404, 400):
                    # Try without grounding tools if model doesn't support search
                    payload.pop("tools", None)
                    r = requests.post(url, headers=headers, json=payload, timeout=30)

                if r.ok:
                    data = r.json()
                    candidate = data.get("candidates", [{}])[0]
                    text_parts = candidate.get("content", {}).get("parts", [])
                    text = "".join(p.get("text", "") for p in text_parts)

                    # Extract grounded citation links
                    citations: List[str] = []
                    grounding = candidate.get("groundingMetadata", {})
                    for chunk in grounding.get("groundingChunks", []):
                        uri = chunk.get("web", {}).get("uri")
                        if uri and uri not in citations:
                            citations.append(uri)

                    if text:
                        return LLMResponse(provider="Gemini", query=prompt, text=text, citations=citations, is_mock=False)
            except Exception:
                continue

        # Fallback to Mock if all endpoints/retries fail
        return MockClient("Gemini").query(prompt)


class PerplexityClient(BaseLLMClient):
    """Perplexity Sonar client - returns live answers and web citation URLs."""
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.PERPLEXITY_API_KEY

    def query(self, prompt: str) -> LLMResponse:
        if not self.api_key:
            return MockClient("Perplexity").query(prompt)

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": settings.PERPLEXITY_MODEL,
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
        self.api_key = api_key or settings.OPENAI_API_KEY

    def query(self, prompt: str) -> LLMResponse:
        if not self.api_key:
            return MockClient("ChatGPT").query(prompt)

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": settings.OPENAI_MODEL,
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
    Topic-aware deterministic simulated LLM for testing without API keys.
    Dynamically adjusts candidates based on domain (security, saas, consumer, etc.).
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


class GroqClient(BaseLLMClient):
    """
    Groq High-Speed LLM client.
    Supports llama-3.3-70b-versatile, llama-3.1-8b-instant, etc.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.models = settings.GROQ_MODELS

    def query(self, prompt: str) -> LLMResponse:
        if not self.api_key:
            return MockClient("Groq").query(prompt)

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        for model in self.models:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
            }
            try:
                r = requests.post(settings.GROQ_API_URL, headers=headers, json=payload, timeout=30)
                if r.ok:
                    data = r.json()
                    text = data["choices"][0]["message"]["content"]
                    return LLMResponse(provider="Groq", query=prompt, text=text, citations=[], is_mock=False)
            except Exception:
                continue
        return MockClient("Groq").query(prompt)


class MistralClient(BaseLLMClient):
    """
    Mistral AI client.
    Supports mistral-small-latest, open-mistral-7b, etc.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.MISTRAL_API_KEY
        self.models = settings.MISTRAL_MODELS

    def query(self, prompt: str) -> LLMResponse:
        if not self.api_key:
            return MockClient("Mistral").query(prompt)

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        for model in self.models:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
            }
            try:
                r = requests.post(settings.MISTRAL_API_URL, headers=headers, json=payload, timeout=30)
                if r.ok:
                    data = r.json()
                    text = data["choices"][0]["message"]["content"]
                    return LLMResponse(provider="Mistral", query=prompt, text=text, citations=[], is_mock=False)
            except Exception:
                continue
        return MockClient("Mistral").query(prompt)


def get_llm_client(provider: str = "Gemini") -> BaseLLMClient:
    """Factory helper to obtain the requested LLM client."""
    provider_lower = provider.lower()
    if "gemini" in provider_lower or "google" in provider_lower:
        return GeminiClient()
    elif "groq" in provider_lower:
        return GroqClient()
    elif "mistral" in provider_lower:
        return MistralClient()
    elif "perplexity" in provider_lower:
        return PerplexityClient()
    elif "chatgpt" in provider_lower or "openai" in provider_lower:
        return OpenAIClient()
    return MockClient(provider)
