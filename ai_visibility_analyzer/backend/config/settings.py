"""
Application Settings and Configuration.
Loads environment variables and tracks available LLM provider keys.
"""
from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


class Settings:
    # API Keys
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
    MISTRAL_API_KEY: str | None = os.getenv("MISTRAL_API_KEY")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    PERPLEXITY_API_KEY: str | None = os.getenv("PERPLEXITY_API_KEY")
    ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")

    # Default Models
    GEMINI_MODELS: list[str] = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"]
    GROQ_MODELS: list[str] = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
    MISTRAL_MODELS: list[str] = ["mistral-small-latest", "open-mistral-7b", "mistral-large-latest"]
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    PERPLEXITY_MODEL: str = os.getenv("PERPLEXITY_MODEL", "sonar")
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-haiku-5-5")

    # Endpoints
    GEMINI_AI_STUDIO_URL: str = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    GEMINI_VERTEX_URL: str = "https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent"
    GROQ_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    MISTRAL_API_URL: str = "https://api.mistral.ai/v1/chat/completions"

    @classmethod
    def get_available_providers(cls) -> dict[str, bool]:
        return {
            "Gemini": bool(cls.GEMINI_API_KEY),
            "Groq": bool(cls.GROQ_API_KEY),
            "Mistral": bool(cls.MISTRAL_API_KEY),
            "ChatGPT": bool(cls.OPENAI_API_KEY),
            "Perplexity": bool(cls.PERPLEXITY_API_KEY),
            "Claude": bool(cls.ANTHROPIC_API_KEY),
        }

    @classmethod
    def has_any_key(cls) -> bool:
        return any(cls.get_available_providers().values())


settings = Settings()
