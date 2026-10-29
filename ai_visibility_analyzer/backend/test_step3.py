"""
Step 3 Test Runner: Controlled Experiment (Before vs After GEO Audit).
Demonstrates:
1. Crawling & Auditing Baseline V1 (Low GEO Score ~3.8/100, Grade F)
2. Crawling & Auditing Optimized V2 (High GEO Score 100/100, Grade A)
3. Side-by-side Factor Comparison and Evidence Breakdown (+96.2 Point Score Jump)
4. Comparative Visibility Scoring & Share of Voice Calculation
"""
import os
import sys
from pathlib import Path

# Fix Windows console UTF-8 encoding
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.crawler_service import CrawlerService
from services.scoring_service import ScoringService
from models.query_models import ClusterSummary, QueryAuditResult


def run_controlled_experiment():
    print("=" * 80)
    print("AI VISIBILITY & GEO ANALYZER - STEP 3 CONTROLLED EXPERIMENT")
    print("Closed-Loop Optimization: Baseline (V1) vs Optimized (V2)")
    print("=" * 80)

    base_dir = backend_dir / "sample_site"
    v1_path = base_dir / "v1_baseline" / "index.html"
    v2_path = base_dir / "v2_optimized" / "index.html"

    # -------------------------------------------------------------------------
    # PART 1: Audit V1 Baseline
    # -------------------------------------------------------------------------
    print("\n[PART 1] Auditing Baseline Website (V1 - Unoptimized)...")
    print(f"Path: {v1_path}")
    v1_result = CrawlerService.audit_page(str(v1_path))

    print(f"\n--- V1 BASELINE AUDIT RESULTS ---")
    print(f"Overall GEO Score: {v1_result.overall_score:.1f} / 100  (Grade: {v1_result.grade})")
    print(f"Page Title: {v1_result.page_title}")
    print(f"Word Count: {v1_result.stats_summary.get('word_count')} words")
    print(f"Direct Answers: {v1_result.stats_summary.get('direct_answers_count')}")
    print(f"Schemas Found: {v1_result.stats_summary.get('schemas_detected')}")
    print(f"Statistics Found: {v1_result.stats_summary.get('statistics_detected_count')}")

    print("\nDetailed Factor Breakdown (V1):")
    for key, factor in v1_result.factors.items():
        status_marker = "[FAIL]" if factor.status == "FAILED" else ("[WARN]" if factor.status == "WARNING" else "[PASS]")
        print(f"  {status_marker} {factor.name:<40} Score: {factor.score:>5.1f} (Weight: {factor.weight*100:.0f}%)")
        for ev in factor.evidence:
            print(f"       Evidence: {ev}")

    print("\nTop Diagnostic Recommendations for V1:")
    for i, rec in enumerate(v1_result.key_recommendations[:4], 1):
        print(f"  {i}. {rec}")

    # -------------------------------------------------------------------------
    # PART 2: Audit V2 Optimized
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("[PART 2] Auditing Optimized Website (V2 - GEO Enhanced)...")
    print(f"Path: {v2_path}")
    v2_result = CrawlerService.audit_page(str(v2_path))

    print(f"\n--- V2 OPTIMIZED AUDIT RESULTS ---")
    print(f"Overall GEO Score: {v2_result.overall_score:.1f} / 100  (Grade: {v2_result.grade})")
    print(f"Page Title: {v2_result.page_title}")
    print(f"Word Count: {v2_result.stats_summary.get('word_count')} words")
    print(f"Direct Answers: {v2_result.stats_summary.get('direct_answers_count')}")
    print(f"Schemas Found: {v2_result.stats_summary.get('schemas_detected')}")
    print(f"Statistics Found: {v2_result.stats_summary.get('statistics_detected_count')}")

    print("\nDetailed Factor Breakdown (V2):")
    for key, factor in v2_result.factors.items():
        status_marker = "[FAIL]" if factor.status == "FAILED" else ("[WARN]" if factor.status == "WARNING" else "[PASS]")
        print(f"  {status_marker} {factor.name:<40} Score: {factor.score:>5.1f} (Weight: {factor.weight*100:.0f}%)")
        for ev in factor.evidence:
            print(f"       Evidence: {ev}")

    # -------------------------------------------------------------------------
    # PART 3: Side-by-Side Comparison (Before vs After)
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("[PART 3] SIDE-BY-SIDE GEO COMPARISON (BEFORE vs AFTER)")
    print("=" * 80)
    print(f"{'GEO Evaluation Factor':<42} | {'V1 Baseline':<15} | {'V2 Optimized':<15} | {'Delta':<10}")
    print("-" * 90)

    for key in v1_result.factors:
        f1 = v1_result.factors[key]
        f2 = v2_result.factors[key]
        delta = f2.score - f1.score
        delta_str = f"+{delta:.1f}" if delta > 0 else f"{delta:.1f}"
        print(f"{f1.name:<42} | {f1.score:>5.1f} ({f1.status:<7}) | {f2.score:>5.1f} ({f2.status:<7}) | {delta_str:>7}")

    print("-" * 90)
    overall_delta = v2_result.overall_score - v1_result.overall_score
    print(f"{'TOTAL OVERALL GEO SCORE':<42} | {v1_result.overall_score:>5.1f} (Grade {v1_result.grade}) | {v2_result.overall_score:>5.1f} (Grade {v2_result.grade}) | +{overall_delta:.1f} PTS")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # PART 4: Share of Voice & Comparative Visibility Benchmark
    # -------------------------------------------------------------------------
    print("\n[PART 4] Running Comparative Benchmark & Share of Voice Engine...")

    mock_results = [
        QueryAuditResult(
            query="best agile sprint app",
            intent="Discovery",
            target_mentioned=True,
            target_position="Early",
            target_cited=True,
            competitors_mentioned=["Jira"],
            citations_count=1,
            raw_response_snippet="PulseTask and Jira are top picks for agile sprint tracking.",
        ),
        QueryAuditResult(
            query="PulseTask vs Jira speed comparison",
            intent="Comparison",
            target_mentioned=True,
            target_position="Early",
            target_cited=True,
            competitors_mentioned=["Jira"],
            citations_count=1,
            raw_response_snippet="PulseTask delivers 240ms sync compared to Jira 820ms.",
        ),
        QueryAuditResult(
            query="free sprint tracking for 10 developers",
            intent="Pricing",
            target_mentioned=True,
            target_position="Early",
            target_cited=False,
            competitors_mentioned=["ClickUp"],
            citations_count=1,
            raw_response_snippet="PulseTask offers 10 free developer seats. ClickUp has a limited free tier.",
        ),
        QueryAuditResult(
            query="fast alternatives to Jira Cloud",
            intent="Switching",
            target_mentioned=True,
            target_position="Mid",
            target_cited=False,
            competitors_mentioned=["Jira", "Linear"],
            citations_count=1,
            raw_response_snippet="Linear and PulseTask are popular high-speed agile alternatives.",
        ),
    ]

    cluster_summary = ClusterSummary(
        seed_query="best agile sprint management software",
        target_brand="PulseTask",
        total_queries=len(mock_results),
        mentions_count=4,
        mention_rate_pct=100.0,
        citations_count=2,
        citation_rate_pct=50.0,
        competitor_mentions={"Jira": 3, "ClickUp": 1, "Linear": 1},
        results=mock_results,
    )

    comp_report = ScoringService.calculate_comparative_report(cluster_summary)

    print(f"\nSeed Query: '{comp_report.seed_query}' ({comp_report.total_queries_tested} queries tested)")
    print(f"Winner Brand: {comp_report.winner_brand}")
    print("\nCompetitive Benchmark Table:")
    print(f"{'Brand Name':<16} | {'Mentions':<9} | {'Mention %':<10} | {'Citations':<10} | {'Citation %':<11} | {'Avg Rank':<9} | {'Score / 100':<12} | {'Share of Voice':<15}")
    print("-" * 105)

    all_brands = [comp_report.target_brand] + comp_report.competitors
    for b in all_brands:
        target_flag = " (Target)" if b.is_target else ""
        brand_label = f"{b.brand_name}{target_flag}"
        rank_str = f"#{b.average_rank:.1f}" if b.average_rank else "N/A"
        print(
            f"{brand_label:<16} | {b.mention_count:>8} | {b.mention_rate:>9.1f}% | "
            f"{b.citation_count:>9} | {b.citation_rate:>10.1f}% | {rank_str:>8} | "
            f"{b.composite_visibility_score:>11.1f} | {b.share_of_voice:>13.1f}%"
        )

    print("-" * 105)
    print("\nStrategic AI Gap Analysis:")
    for gap in comp_report.gap_analysis:
        print(f"  [+] {gap}")

    print("\n" + "=" * 80)
    print("[SUCCESS] STEP 3 CONTROLLED EXPERIMENT COMPLETED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    run_controlled_experiment()
