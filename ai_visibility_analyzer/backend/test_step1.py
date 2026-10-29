"""
Milestone 1 Test Script: Single Query LLM Calling & Citation Verification.
Cleanly refactored to use MVC Services and Models.

Run this script:
    python test_step1.py
"""
import sys
from pathlib import Path

# Force utf-8 stdout encoding for Windows compatibility
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from config import settings
from services.llm_service import get_llm_client
from services.citation_service import CitationService
from utils.domain_utils import extract_brand_name


def run_test():
    print("=" * 70)
    print("[*] AI VISIBILITY ANALYZER - MILESTONE 1: CITATION CHECKER (MVC)")
    print("=" * 70)

    # 1. Check API Keys via Config Settings
    providers = settings.get_available_providers()
    print("\n[1] Environment & Provider Status:")
    for name, has_key in providers.items():
        status = "[+] Key Detected" if has_key else "[-] No Key (Will use Mock Mode)"
        print(f"    - {name:<12}: {status}")

    active_provider = "Gemini" if providers["Gemini"] else "MockAI"
    print(f"\n[2] Active LLM Client: {active_provider}")

    # 2. Define Test Query & Target Brand
    target_url = "https://linear.app"
    competitors = ["https://clickup.com", "https://notion.so", "https://asana.com", "https://monday.com"]
    query = "What are the top 5 agile project management tools for software engineering teams in 2026?"

    print(f"\n[3] Test Configuration:")
    print(f"    - Target Brand : {extract_brand_name(target_url)} ({target_url})")
    print(f"    - Competitors  : {', '.join(extract_brand_name(c) for c in competitors)}")
    print(f"    - Query        : \"{query}\"")

    # 3. Call LLM Service
    print("\n[4] Querying LLM...")
    client = get_llm_client(active_provider)
    response = client.query(query)

    print(f"    - Status       : Received {len(response.text)} characters")
    print(f"    - Source Mode  : {'[SIMULATED MOCK]' if response.is_mock else '[LIVE API]'}")
    print(f"    - Citations    : {len(response.citations)} URLs found")

    # 4. Analyze Results via CitationService
    target_result = CitationService.evaluate_brand(response.text, target_url, response.citations)

    competitor_results = {}
    for c in competitors:
        c_name = extract_brand_name(c)
        c_res = CitationService.evaluate_brand(response.text, c, response.citations)
        competitor_results[c_name] = c_res

    grouped_citations = CitationService.categorize_citations(response.citations, target_url)

    # 5. Output Formatted Report
    print("\n" + "=" * 70)
    print("[REPORT] CITATION & VISIBILITY ANALYSIS")
    print("=" * 70)

    print("\n>> TARGET BRAND AUDIT:")
    print(f"  * Brand Name       : {target_result.brand}")
    print(f"  * Mentioned in text: {'[YES]' if target_result.is_mentioned else '[NO]'}")
    print(f"  * Position         : {target_result.position or 'N/A'}")
    print(f"  * Directly Cited   : {'[YES] (Official site referenced)' if target_result.is_cited else '[NO]'}")
    print(f"  * Sentiment        : {target_result.sentiment or 'N/A'}")

    print("\n>> COMPETITOR BENCHMARK:")
    for c_name, c_res in competitor_results.items():
        m_str = "[YES]" if c_res.is_mentioned else "[NO] "
        c_str = "[CITED]" if c_res.is_cited else "[NOT CITED]"
        print(f"  * {c_name:<12}: Mentioned: {m_str} | Citation: {c_str}")

    print("\n>> THIRD-PARTY CITATION ECOSYSTEM:")
    if grouped_citations["review_platforms"]:
        print("  * Review Platforms :")
        for url in grouped_citations["review_platforms"]:
            print(f"    - [Review] {url}")
    if grouped_citations["communities"]:
        print("  * Communities & Forums:")
        for url in grouped_citations["communities"]:
            print(f"    - [Community] {url}")
    if grouped_citations["other_sources"]:
        print("  * Other Sources:")
        for url in grouped_citations["other_sources"][:3]:
            print(f"    - {url}")

    print("\n>> AI RESPONSE SNIPPET:")
    snippet = response.text[:400].replace("\n", " ")
    print(f"  \"{snippet}...\"")
    print("\n" + "=" * 70)
    print("[SUCCESS] Milestone 1 verification complete! Clean MVC services working.")
    print("=" * 70)


if __name__ == "__main__":
    run_test()
