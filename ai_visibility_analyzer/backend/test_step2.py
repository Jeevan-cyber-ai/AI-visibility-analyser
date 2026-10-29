"""
Milestone 2 Test Script: Human Semantic Query Expansion & Parallel Audit.
Cleanly refactored to use MVC Services and Models.

Features:
- Competitor Auto-Discovery Mode: Enter only your brand URL/query; AI discovers top rivals.
- Manual Mode: Pass custom rival URLs for direct benchmarking.
- Parallel Execution: All human query variations dispatched concurrently.

Run this script:
    python test_step2.py
"""
import sys
import time
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
from services.competitor_service import CompetitorService
from services.query_service import QueryService
from utils.domain_utils import extract_brand_name


def run_test():
    print("=" * 75)
    print("[*] AI VISIBILITY ANALYZER - MILESTONE 2: CLUSTER AUDIT (MVC)")
    print("=" * 75)

    # 1. Configuration & Mode Toggle
    seed_query = "tell me the best antivirus softwares in 2026"
    target_url = "https://bitdefender.com"
    target_name = extract_brand_name(target_url)

    # TOGGLE: Set to True for AI Auto-Discovery, or False for manual
    AUTO_DISCOVER_COMPETITORS = True

    # Manual list (only used if AUTO_DISCOVER_COMPETITORS = False)
    manual_competitors = ["https://norton.com", "https://mcafee.com"]

    providers = settings.get_available_providers()
    active_provider = "Gemini" if providers["Gemini"] else "MockAI"
    client = get_llm_client(active_provider)

    print(f"\n[1] Setup & Mode Selection:")
    print(f"    - Target Brand    : {target_name} ({target_url})")
    print(f"    - User Query      : \"{seed_query}\"")
    print(f"    - Active Engine   : {active_provider} ({'[LIVE API]' if providers['Gemini'] else '[MOCK]'})")
    print(f"    - Competitor Mode : {'[AUTO-DISCOVERY]' if AUTO_DISCOVER_COMPETITORS else '[MANUAL]'}")

    # 2. Resolve Competitors (Auto vs Manual via CompetitorService)
    if AUTO_DISCOVER_COMPETITORS:
        print(f"\n[2] Auto-Discovering competitors for '{target_name}' using {active_provider}...")
        discovered = CompetitorService.discover(target_url, client=client, limit=4)
        competitors = [c.url for c in discovered]
        print(f"    [+] Auto-Discovered {len(discovered)} direct rivals:")
        for c in discovered:
            print(f"        * {c.brand:<14} -> {c.url}")
    else:
        competitors = manual_competitors
        print(f"\n[2] Using Manual Competitor List:")
        for c in competitors:
            print(f"        * {extract_brand_name(c):<14} -> {c}")

    # 3. Expand into Human Query Variations via QueryService
    print(f"\n[3] Expanding '{seed_query}' into human alternative variations...")
    t0 = time.time()
    variations = QueryService.expand_human_queries(
        seed_query=seed_query,
        target_brand_url=target_url,
        competitors=competitors,
        client=client,
        count=5,
    )
    print(f"    [+] Generated {len(variations)} human variations in {time.time() - t0:.1f}s:")
    for i, v in enumerate(variations, 1):
        print(f"        {i}. [{v.intent:<18}] \"{v.query}\"")

    # 4. Execute Parallel Cluster Audit via QueryService
    print(f"\n[4] Dispatching ALL {len(variations)} queries to {active_provider}...")
    t1 = time.time()
    cluster = QueryService.audit_cluster(
        seed_query=seed_query,
        target_brand_url=target_url,
        competitors=competitors,
        variations=variations,
        client=client,
        max_workers=5,
    )
    total_time = time.time() - t1
    print(f"    [+] All {len(variations)} queries processed in {total_time:.2f} seconds!")

    # 5. Display Consolidated Report
    print("\n" + "=" * 75)
    print(f"[REPORT] CLUSTER VISIBILITY FOR: {target_name.upper()}")
    print("=" * 75)

    print(f"\n>> OVERALL VISIBILITY SCORE:")
    print(f"  * Mention Rate     : {cluster.mention_rate_pct}% ({cluster.mentions_count}/{cluster.total_queries} queries mentioned {target_name})")
    print(f"  * Citation Rate    : {cluster.citation_rate_pct}% ({cluster.citations_count}/{cluster.total_queries} queries directly cited {target_url})")

    print(f"\n>> COMPETITOR SHARE OF VOICE (Mentions across the {cluster.total_queries} queries):")
    for comp, count in sorted(cluster.competitor_mentions.items(), key=lambda x: -x[1]):
        bar = "█" * (count * 3)
        print(f"  * {comp:<14}: {count}/{cluster.total_queries} {bar}")

    print("\n" + "-" * 75)
    print(">> QUERY-BY-QUERY DETAILED BREAKDOWN:")
    print("-" * 75)
    for idx, r in enumerate(cluster.results, 1):
        m_str = "[MENTIONED]" if r.target_mentioned else "[MISSED]   "
        pos_str = f"({r.target_position})" if r.target_position else ""
        print(f"\nQuery #{idx}: \"{r.query}\"")
        print(f"  Intent: {r.intent}")
        print(f"  {target_name:<12} : {m_str} {pos_str}")
        print(f"  Competitors  : {', '.join(r.competitors_mentioned) if r.competitors_mentioned else 'None'}")
        print(f"  Sources Cited: {r.citations_count} URLs")
        print(f"  AI Snippet   : \"{r.raw_response_snippet}\"")

    print("\n" + "=" * 75)
    print("[SUCCESS] Milestone 2 complete: MVC QueryService & CompetitorService verified!")
    print("=" * 75)


if __name__ == "__main__":
    run_test()
