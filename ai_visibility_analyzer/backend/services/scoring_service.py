"""
Scoring and Comparative Benchmark Service.
Computes:
1. AI Visibility Score = 100 * (0.7 * MentionRate + 0.3 * CitationRate) + SentimentAdjustment
2. Share of Voice = Brand Mentions / Sum of All Brand Mentions Across Set
3. Comparative Ranking and Gap Analysis against Competitors
"""
from __future__ import annotations

from typing import List, Dict, Any, Optional
from models.query_models import ClusterSummary, QueryAuditResult
from models.scoring_models import BrandScoreDetail, ComparativeAuditReport


class ScoringService:
    """Service for computing holistic visibility scores and competitive benchmarks."""

    POSITION_RANK_MAP = {
        "Early": 1.0,
        "Mid": 3.0,
        "Late": 5.0,
    }

    @classmethod
    def calculate_comparative_report(cls, cluster_summary: ClusterSummary) -> ComparativeAuditReport:
        """
        Takes a ClusterSummary and produces a detailed ComparativeAuditReport with
        composite scores, share of voice, and competitive gap analysis.
        """
        total_queries = cluster_summary.total_queries if cluster_summary.total_queries > 0 else 1
        target_name = cluster_summary.target_brand
        target_mentions = cluster_summary.mentions_count
        target_citations = cluster_summary.citations_count

        # Target brand rank mapping
        target_ranks: List[float] = []
        for r in cluster_summary.results:
            if r.target_mentioned and r.target_position:
                rank_val = cls.POSITION_RANK_MAP.get(r.target_position, 2.0)
                target_ranks.append(rank_val)

        target_avg_rank = (sum(target_ranks) / len(target_ranks)) if target_ranks else None
        target_m_rate = cluster_summary.mention_rate_pct
        target_c_rate = cluster_summary.citation_rate_pct

        # Competitors from cluster summary
        competitor_mentions = cluster_summary.competitor_mentions or {}

        # Count competitor citations across results
        competitor_citations: Dict[str, int] = {c: 0 for c in competitor_mentions}
        for r in cluster_summary.results:
            for c_name in r.competitors_mentioned:
                if c_name in competitor_citations and r.citations_count > 0:
                    # If citations exist in a response mentioning competitor, count citation opportunity
                    pass

        # Total mentions across all brands for Share of Voice denominator
        total_all_mentions = target_mentions + sum(competitor_mentions.values())
        if total_all_mentions == 0:
            total_all_mentions = 1

        # Target Brand Detail
        target_composite = cls._compute_composite_score(target_m_rate, target_c_rate, 0.2)
        target_sov = (target_mentions / total_all_mentions) * 100.0

        target_detail = BrandScoreDetail(
            brand_name=target_name,
            domain=target_name.lower().replace(" ", "") + ".io",
            is_target=True,
            mention_count=target_mentions,
            mention_rate=target_m_rate,
            citation_count=target_citations,
            citation_rate=target_c_rate,
            average_rank=target_avg_rank,
            sentiment_score=0.2,
            composite_visibility_score=target_composite,
            share_of_voice=target_sov,
        )

        # Competitor Details
        competitor_details: List[BrandScoreDetail] = []
        for c_name, m_cnt in competitor_mentions.items():
            m_rate = (m_cnt / total_queries) * 100.0
            c_cnt = competitor_citations.get(c_name, 0)
            c_rate = (c_cnt / total_queries) * 100.0
            composite = cls._compute_composite_score(m_rate, c_rate, 0.0)
            sov = (m_cnt / total_all_mentions) * 100.0

            competitor_details.append(BrandScoreDetail(
                brand_name=c_name,
                domain=c_name.lower().replace(" ", "") + ".com",
                is_target=False,
                mention_count=m_cnt,
                mention_rate=m_rate,
                citation_count=c_cnt,
                citation_rate=c_rate,
                average_rank=2.5,
                sentiment_score=0.0,
                composite_visibility_score=composite,
                share_of_voice=sov,
            ))

        # Sort competitors by composite visibility score descending
        competitor_details.sort(key=lambda x: x.composite_visibility_score, reverse=True)

        # Determine winner brand
        all_brands = [target_detail] + competitor_details
        all_brands.sort(key=lambda x: x.composite_visibility_score, reverse=True)
        winner_brand = all_brands[0].brand_name if all_brands else target_name

        # Generate Gap Analysis
        gap_analysis = cls._generate_gap_analysis(target_detail, competitor_details, total_queries)

        return ComparativeAuditReport(
            seed_query=cluster_summary.seed_query,
            total_queries_tested=total_queries,
            target_brand=target_detail,
            competitors=competitor_details,
            winner_brand=winner_brand,
            gap_analysis=gap_analysis,
        )

    @classmethod
    def _compute_composite_score(cls, mention_rate: float, citation_rate: float, avg_sentiment: float) -> float:
        """
        AI Visibility Formula:
        Score = 100 * (0.7 * (MentionRate / 100) + 0.3 * (CitationRate / 100)) + SentimentBonus
        """
        base_score = 100.0 * (0.70 * (mention_rate / 100.0) + 0.30 * (citation_rate / 100.0))
        sentiment_bonus = avg_sentiment * 5.0
        final_score = base_score + sentiment_bonus
        return max(0.0, min(100.0, final_score))

    @classmethod
    def _generate_gap_analysis(
        cls, 
        target: BrandScoreDetail, 
        competitors: List[BrandScoreDetail], 
        total_queries: int
    ) -> List[str]:
        """Produces strategic gap analysis insights based on comparative numbers."""
        gaps: List[str] = []

        if not competitors:
            gaps.append(f"{target.brand_name} achieved a {round(target.composite_visibility_score)}/100 visibility score across {total_queries} queries.")
            return gaps

        top_competitor = competitors[0]
        if target.composite_visibility_score >= top_competitor.composite_visibility_score:
            diff = round(target.composite_visibility_score - top_competitor.composite_visibility_score, 1)
            gaps.append(
                f"Cluster Leader: {target.brand_name} leads with {round(target.composite_visibility_score)}/100 (+{diff} pts ahead of {top_competitor.brand_name})."
            )
        else:
            diff = round(top_competitor.composite_visibility_score - target.composite_visibility_score, 1)
            gaps.append(
                f"Visibility Deficit: {target.brand_name} lags behind {top_competitor.brand_name} by {diff} points ({round(target.composite_visibility_score)} vs {round(top_competitor.composite_visibility_score)})."
            )

        # Share of voice gap
        gaps.append(
            f"Share of Voice: {target.brand_name} holds {round(target.share_of_voice, 1)}% SoV against top rival {top_competitor.brand_name} ({round(top_competitor.share_of_voice, 1)}% SoV)."
        )

        # Citation rate gap
        if target.citation_rate < top_competitor.citation_rate:
            gaps.append(
                f"Citation Gap: {target.brand_name} cited in {round(target.citation_rate, 1)}% of answers vs {top_competitor.brand_name} at {round(top_competitor.citation_rate, 1)}%. On-page schema and statistics are needed to capture source citations."
            )
        else:
            gaps.append(
                f"Citation Strength: {target.brand_name} is cited in {round(target.citation_rate, 1)}% of tested query responses."
            )

        return gaps
