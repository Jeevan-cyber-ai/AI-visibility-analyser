"""
Configuration module for the AI Visibility & GEO Analyzer.
Loads environment variables from .env and tracks available LLM provider keys.
"""
from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    PERPLEXITY_MODEL = os.getenv("PERPLEXITY_MODEL", "sonar")
    CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-5-5")

    @classmethod
    def available_providers(cls) -> dict[str, bool]:
        return {
            "Gemini": bool(cls.GEMINI_API_KEY),
            "ChatGPT": bool(cls.OPENAI_API_KEY),
            "Perplexity": bool(cls.PERPLEXITY_API_KEY),
            "Claude": bool(cls.ANTHROPIC_API_KEY),
        }

    @classmethod
    def has_any_key(cls) -> bool:
        return any(cls.available_providers().values())
