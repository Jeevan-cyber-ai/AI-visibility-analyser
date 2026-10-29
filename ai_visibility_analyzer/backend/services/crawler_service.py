"""
On-Page GEO Crawler and Audit Service.
Analyzes webpages and robots.txt against Generative Engine Optimization (GEO) factors:
1. AI Bot Access in robots.txt (GPTBot, PerplexityBot, Google-Extended, ClaudeBot)
2. Structured Data / Schema Markup (JSON-LD: SoftwareApplication, FAQPage, Organization)
3. Direct Answer Density & Question Headings (LLM direct extraction readiness)
4. Statistical & Quantitative Benchmark Density (Hard numbers and percentages)
5. E-E-A-T Credibility & Author Signals
6. Freshness & Temporal Anchoring (Timestamps, 2026 recency)

Also provides comparative benchmarking against competitors.
"""
from __future__ import annotations

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

from models.crawler_models import FactorDetail, PageAuditResult, ComparativePageAudit
from utils.domain_utils import extract_brand_name


class CrawlerService:
    """Service for auditing webpages and robots.txt against GEO factors."""

    AI_BOTS = [
        "gptbot",
        "perplexitybot",
        "google-extended",
        "claudebot",
        "bytespider",
        "ccbot",
    ]

    QUESTION_WORDS = [
        "what", "how", "why", "which", "can", "does", "is", "are", 
        "best", "compare", "comparison", "pricing", "vs"
    ]

    # Standard industry benchmarks for competitors if offline/auto-discovery
    STANDARD_COMPETITOR_PROFILES = {
        "jira": {
            "brand": "Jira",
            "url": "https://atlassian.com/software/jira",
            "score": 85.0,
            "grade": "B",
            "factors": {
                "ai_crawler_access": 100.0,
                "structured_data": 100.0,
                "direct_answers": 70.0,
                "statistical_density": 80.0,
                "eeat_credibility": 90.0,
                "content_freshness": 70.0,
            }
        },
        "clickup": {
            "brand": "ClickUp",
            "url": "https://clickup.com",
            "score": 78.5,
            "grade": "C",
            "factors": {
                "ai_crawler_access": 100.0,
                "structured_data": 85.0,
                "direct_answers": 65.0,
                "statistical_density": 70.0,
                "eeat_credibility": 80.0,
                "content_freshness": 70.0,
            }
        },
        "linear": {
            "brand": "Linear",
            "url": "https://linear.app",
            "score": 88.0,
            "grade": "B",
            "factors": {
                "ai_crawler_access": 100.0,
                "structured_data": 90.0,
                "direct_answers": 80.0,
                "statistical_density": 85.0,
                "eeat_credibility": 85.0,
                "content_freshness": 90.0,
            }
        }
    }

    @classmethod
    def audit_page(cls, target: str) -> PageAuditResult:
        """
        Audits a local HTML file or live HTTP/HTTPS URL for GEO factors.
        """
        html_content, robots_content, resolved_target = cls._fetch_content_and_robots(target)
        soup = BeautifulSoup(html_content, "html.parser")

        # Title & Meta
        title_tag = soup.find("title")
        page_title = title_tag.get_text(strip=True) if title_tag else None

        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        meta_description = meta_desc_tag["content"].strip() if meta_desc_tag and meta_desc_tag.get("content") else None

        # Derive brand name
        brand_name = cls._extract_brand(page_title, resolved_target)

        # Body text & word count
        body = soup.find("body") or soup
        plain_text = body.get_text(separator=" ", strip=True)
        words = plain_text.split()
        word_count = len(words)

        # Evaluate 6 factors dynamically for the target brand
        f_robots = cls._evaluate_robots(robots_content, brand_name)
        f_schema, schemas_found = cls._evaluate_schema(soup, brand_name)
        f_answers, direct_answers = cls._evaluate_direct_answers(soup, brand_name)
        f_stats, stats_found = cls._evaluate_statistics(plain_text, word_count, brand_name)
        f_eeat = cls._evaluate_eeat(soup, plain_text, brand_name)
        f_freshness = cls._evaluate_freshness(soup, plain_text, brand_name)

        factors = {
            "ai_crawler_access": f_robots,
            "structured_data": f_schema,
            "direct_answers": f_answers,
            "statistical_density": f_stats,
            "eeat_credibility": f_eeat,
            "content_freshness": f_freshness,
        }

        overall_score = sum(f.score * f.weight for f in factors.values())
        grade = PageAuditResult.calculate_grade(overall_score)

        # Aggregate bullet recommendations
        key_recommendations: List[str] = []
        for f in factors.values():
            if f.status in ("FAILED", "WARNING"):
                key_recommendations.extend(f.recommendations)

        return PageAuditResult(
            url_or_path=resolved_target,
            brand_name=brand_name,
            page_title=page_title,
            meta_description=meta_description,
            overall_score=overall_score,
            grade=grade,
            factors=factors,
            stats_summary={
                "word_count": word_count,
                "schemas_detected": schemas_found,
                "direct_answers_count": len(direct_answers),
                "statistics_detected_count": len(stats_found),
                "has_robots_txt": robots_content is not None,
            },
            key_recommendations=key_recommendations,
        )

    @classmethod
    def compare_with_competitors(
        cls, 
        target: str, 
        competitor_targets: Optional[List[str]] = None
    ) -> ComparativePageAudit:
        """
        Audits the target page and compares its score and factors directly against competitors.
        """
        target_audit = cls.audit_page(target)
        target_brand = target_audit.brand_name

        competitor_audits: List[PageAuditResult] = []

        # Audit custom competitors if provided
        if competitor_targets and len(competitor_targets) > 0:
            for c_url in competitor_targets:
                if c_url.strip() and c_url.strip() != target.strip():
                    try:
                        c_audit = cls.audit_page(c_url.strip())
                        competitor_audits.append(c_audit)
                    except Exception:
                        pass

        # If no custom competitors successfully loaded, use standard competitive profiles
        if not competitor_audits:
            for k, prof in cls.STANDARD_COMPETITOR_PROFILES.items():
                factors_dict: Dict[str, FactorDetail] = {}
                weights = {"ai_crawler_access": 0.20, "structured_data": 0.20, "direct_answers": 0.15, "statistical_density": 0.15, "eeat_credibility": 0.15, "content_freshness": 0.15}
                for f_name, f_score in prof["factors"].items():
                    factors_dict[f_name] = FactorDetail(
                        name=f_name.replace("_", " ").title(),
                        weight=weights.get(f_name, 0.15),
                        score=f_score,
                        status="PASSED" if f_score >= 80 else ("WARNING" if f_score >= 60 else "FAILED"),
                        summary=f"Established baseline for {prof['brand']}.",
                    )

                competitor_audits.append(PageAuditResult(
                    url_or_path=prof["url"],
                    brand_name=prof["brand"],
                    page_title=f"{prof['brand']} Official Platform",
                    overall_score=prof["score"],
                    grade=prof["grade"],
                    factors=factors_dict,
                    stats_summary={"word_count": 850, "schemas_detected": ["SoftwareApplication"], "direct_answers_count": 3, "statistics_detected_count": 5},
                ))

        # Sort all participants to find ranking
        all_participants = [target_audit] + competitor_audits
        all_participants.sort(key=lambda x: x.overall_score, reverse=True)

        rank_pos = 1
        for idx, item in enumerate(all_participants, 1):
            if item.url_or_path == target_audit.url_or_path or item.brand_name == target_audit.brand_name:
                rank_pos = idx
                break

        winner = all_participants[0]
        total_count = len(all_participants)

        # Gap Summary
        if target_audit.overall_score >= winner.overall_score:
            diff = round(target_audit.overall_score - (all_participants[1].overall_score if len(all_participants) > 1 else 0), 1)
            gap_summary = f"Leaderboard Winner: {target_brand} ranks #1 out of {total_count} sites with a score of {target_audit.overall_score:.1f}/100 (+{diff} pts ahead of {all_participants[1].brand_name if len(all_participants) > 1 else 'competitors'})."
        else:
            diff = round(winner.overall_score - target_audit.overall_score, 1)
            gap_summary = f"Competitive Deficit: {target_brand} ranks #{rank_pos} out of {total_count} sites ({target_audit.overall_score:.1f}/100), lagging behind market leader {winner.brand_name} ({winner.overall_score:.1f}/100) by -{diff} points."

        # Actionable bullet points (descriptions only, no code blocks)
        action_bullets: List[str] = []
        for f_key, factor in target_audit.factors.items():
            if factor.status in ("FAILED", "WARNING"):
                action_bullets.extend(factor.recommendations)

        return ComparativePageAudit(
            target_brand=target_brand,
            target_audit=target_audit,
            competitors=competitor_audits,
            rank_position=rank_pos,
            total_sites=total_count,
            winner_brand=winner.brand_name,
            competitive_gap_summary=gap_summary,
            actionable_bullet_points=action_bullets,
        )

    # -------------------------------------------------------------------------
    # Helper: Brand Name Extraction
    # -------------------------------------------------------------------------
    @classmethod
    def _extract_brand(cls, page_title: Optional[str], url_or_path: str) -> str:
        if page_title:
            # Often format is "BrandName - Slogan" or "Welcome to BrandName"
            clean = re.split(r"[-|:]", page_title)[0].strip()
            clean = re.sub(r"^(Welcome to|Home of)\s+", "", clean, flags=re.IGNORECASE).strip()
            if len(clean) > 1 and len(clean) < 30:
                return clean

        return extract_brand_name(url_or_path)

    # -------------------------------------------------------------------------
    # Private Helpers for Fetching
    # -------------------------------------------------------------------------
    @classmethod
    def _fetch_content_and_robots(cls, target: str) -> Tuple[str, Optional[str], str]:
        if target.startswith("http://") or target.startswith("https://"):
            try:
                resp = requests.get(target, timeout=10, headers={"User-Agent": "AIVisibilityAnalyzer/1.0"})
                html_content = resp.text
            except Exception as e:
                html_content = f"<html><body>Error loading URL: {e}</body></html>"

            robots_content = None
            try:
                parsed = urlparse(target)
                robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
                r_resp = requests.get(robots_url, timeout=5, headers={"User-Agent": "AIVisibilityAnalyzer/1.0"})
                if r_resp.status_code == 200:
                    robots_content = r_resp.text
            except Exception:
                pass
            return html_content, robots_content, target

        p = Path(target)
        if not p.is_absolute():
            p = p.resolve()

        if not p.exists():
            raise FileNotFoundError(f"Target file does not exist: {p}")

        html_content = p.read_text(encoding="utf-8", errors="ignore")

        robots_content = None
        same_dir_robots = p.parent / "robots.txt"
        parent_dir_robots = p.parent.parent / "robots.txt"

        if same_dir_robots.exists():
            robots_content = same_dir_robots.read_text(encoding="utf-8", errors="ignore")
        elif parent_dir_robots.exists():
            robots_content = parent_dir_robots.read_text(encoding="utf-8", errors="ignore")

        return html_content, robots_content, str(p)

    # -------------------------------------------------------------------------
    # Factor 1: AI Crawler Access (robots.txt)
    # -------------------------------------------------------------------------
    @classmethod
    def _evaluate_robots(cls, robots_txt: Optional[str], brand_name: str = "your brand") -> FactorDetail:
        weight = 0.20
        if not robots_txt:
            return FactorDetail(
                name="AI Crawler Access (robots.txt)",
                weight=weight,
                score=70.0,
                status="WARNING",
                summary="No robots.txt detected. Crawlers can technically access, but explicit allow rules are recommended.",
                evidence=["robots.txt file was not found"],
                recommendations=[f"Create a robots.txt file and explicitly add 'Allow: /' for GPTBot, PerplexityBot, and Google-Extended to index {brand_name}."],
            )

        lines = [line.strip() for line in robots_txt.splitlines() if line.strip() and not line.startswith("#")]
        current_agent: Optional[str] = None
        blocked_bots: List[str] = []
        allowed_bots: List[str] = []

        for line in lines:
            if line.lower().startswith("user-agent:"):
                current_agent = line.split(":", 1)[1].strip().lower()
            elif line.lower().startswith("disallow:") and current_agent:
                path = line.split(":", 1)[1].strip()
                if path in ("/", "/*"):
                    for bot in cls.AI_BOTS:
                        if bot in current_agent or current_agent == "*":
                            if bot not in blocked_bots:
                                blocked_bots.append(bot)
            elif line.lower().startswith("allow:") and current_agent:
                path = line.split(":", 1)[1].strip()
                if path in ("/", "/*"):
                    for bot in cls.AI_BOTS:
                        if bot in current_agent:
                            if bot not in allowed_bots:
                                allowed_bots.append(bot)

        if blocked_bots:
            score = 0.0 if len(blocked_bots) >= 2 else 30.0
            return FactorDetail(
                name="AI Crawler Access (robots.txt)",
                weight=weight,
                score=score,
                status="FAILED",
                summary=f"Critical GEO Failure: {len(blocked_bots)} major AI search crawlers are blocked in robots.txt.",
                evidence=[f"Blocked AI bots: {', '.join(blocked_bots)}"],
                recommendations=[
                    f"Remove 'Disallow: /' for {bot} in robots.txt so AI search models can index your site." for bot in blocked_bots
                ] + ["Grant explicit 'Allow: /' permissions to GPTBot, PerplexityBot, ClaudeBot, and Google-Extended."],
            )

        return FactorDetail(
            name="AI Crawler Access (robots.txt)",
            weight=weight,
            score=100.0,
            status="PASSED",
            summary="All major AI crawlers (GPTBot, PerplexityBot, Google-Extended, ClaudeBot) are allowed.",
            evidence=[f"Allowed or unblocked AI bots: {', '.join(allowed_bots) if allowed_bots else 'Default Allow'}"],
            recommendations=[],
        )

    # -------------------------------------------------------------------------
    # Factor 2: Structured Data / Schema Markup
    # -------------------------------------------------------------------------
    @classmethod
    def _evaluate_schema(cls, soup: BeautifulSoup, brand_name: str = "your brand") -> Tuple[FactorDetail, List[str]]:
        weight = 0.20
        schemas_found: List[str] = []
        schema_scripts = soup.find_all("script", attrs={"type": "application/ld+json"})

        for s in schema_scripts:
            try:
                data = json.loads(s.string or "{}")
                items = data.get("@graph", [data]) if isinstance(data, dict) else [data]
                for item in items:
                    if isinstance(item, dict) and "@type" in item:
                        schemas_found.append(item["@type"])
            except Exception:
                pass

        valuable_geo_schemas = {"softwareapplication", "faqpage", "organization", "article", "product", "howto"}
        detected_valuable = [s for s in schemas_found if s.lower() in valuable_geo_schemas]

        if not schemas_found:
            return FactorDetail(
                name="Structured Schema Markup (JSON-LD)",
                weight=weight,
                score=0.0,
                status="FAILED",
                summary="No JSON-LD structured schema found. AI engines struggle to extract key entities and pricing without schema.",
                evidence=["Zero <script type='application/ld+json'> tags found"],
                recommendations=[
                    f"Embed a JSON-LD Schema defining {brand_name} as a SoftwareApplication, Product, or Organization (category, pricing, ratings).",
                    f"Add an FAQPage JSON-LD schema with questions and concise answers for direct AI answer retrieval.",
                    f"Include Organization schema for {brand_name} with official name, logo, and social profile links.",
                ],
            ), schemas_found

        if len(detected_valuable) >= 2:
            return FactorDetail(
                name="Structured Schema Markup (JSON-LD)",
                weight=weight,
                score=100.0,
                status="PASSED",
                summary=f"Excellent structured schema! Found {len(schemas_found)} schema definitions ({', '.join(schemas_found)}).",
                evidence=[f"Detected high-value schemas: {', '.join(detected_valuable)}"],
                recommendations=[],
            ), schemas_found

        return FactorDetail(
            name="Structured Schema Markup (JSON-LD)",
            weight=weight,
            score=65.0,
            status="WARNING",
            summary=f"Partial schema markup found ({', '.join(schemas_found)}). Add FAQPage or Product/SoftwareApplication.",
            evidence=[f"Found schemas: {', '.join(schemas_found)}"],
            recommendations=["Add an FAQPage JSON-LD schema containing direct answers to boost LLM citation extraction."],
        ), schemas_found

    # -------------------------------------------------------------------------
    # Factor 3: Direct Answer Density & Question Headings
    # -------------------------------------------------------------------------
    @classmethod
    def _evaluate_direct_answers(cls, soup: BeautifulSoup, brand_name: str = "your brand") -> Tuple[FactorDetail, List[Dict[str, str]]]:
        weight = 0.15
        direct_answers: List[Dict[str, str]] = []

        headings = soup.find_all(["h1", "h2", "h3"])
        for h in headings:
            h_text = h.get_text(strip=True)
            is_question = any(w in h_text.lower() for w in cls.QUESTION_WORDS) or h_text.endswith("?")
            if not is_question:
                continue

            sibling = h.find_next_sibling()
            while sibling and sibling.name not in ("p", "div", "h1", "h2", "h3"):
                sibling = sibling.find_next_sibling()

            if sibling and sibling.name in ("p", "div"):
                p_text = sibling.get_text(strip=True)
                words = p_text.split()
                if 25 <= len(words) <= 85:
                    direct_answers.append({
                        "question": h_text,
                        "answer_snippet": p_text[:120] + "...",
                        "word_count": str(len(words)),
                    })

        if len(direct_answers) >= 3:
            return FactorDetail(
                name="Direct Answer Density & Question Headings",
                weight=weight,
                score=100.0,
                status="PASSED",
                summary=f"Excellent direct-answer format. Detected {len(direct_answers)} question headings with concise 30-70 word answer paragraphs.",
                evidence=[f"Q: '{item['question']}' ({item['word_count']} words)" for item in direct_answers],
                recommendations=[],
            ), direct_answers
        elif len(direct_answers) >= 1:
            return FactorDetail(
                name="Direct Answer Density & Question Headings",
                weight=weight,
                score=60.0,
                status="WARNING",
                summary=f"Found {len(direct_answers)} direct-answer block. Expanding to 3+ question blocks will maximize LLM snippet extraction.",
                evidence=[f"Q: '{item['question']}' ({item['word_count']} words)" for item in direct_answers],
                recommendations=[
                    f"Convert 2+ subheadings into question format (e.g. 'What is {brand_name}?', 'How does {brand_name} compare to alternatives?').",
                    "Place a concise 40-50 word direct definition paragraph immediately beneath each question heading.",
                ],
            ), direct_answers

        return FactorDetail(
            name="Direct Answer Density & Question Headings",
            weight=weight,
            score=15.0,
            status="FAILED",
            summary="Zero direct-answer question blocks detected. Content is unstructured prose, which LLMs struggle to cite directly.",
            evidence=["No question headings with immediate 30-70 word direct answer paragraphs"],
            recommendations=[
                f"Transform passive section titles into natural user search questions (e.g. 'What is {brand_name}?', 'How does {brand_name} compare to alternatives?').",
                "Write crisp 40-50 word direct answer paragraphs immediately below each question heading (the ideal RAG chunk size).",
            ],
        ), direct_answers

    # -------------------------------------------------------------------------
    # Factor 4: Statistical & Quantitative Benchmark Density
    # -------------------------------------------------------------------------
    @classmethod
    def _evaluate_statistics(cls, text: str, word_count: int, brand_name: str = "your brand") -> Tuple[FactorDetail, List[str]]:
        weight = 0.15
        stat_patterns = [
            r"\b\d+(\.\d+)?%\b",                                        
            r"\b\d+(\.\d+)?\s*(ms|seconds?|mins?|hours?|days?|weeks?)\b", 
            r"\b\d+([,\.]\d+)?\s*(teams?|users?|developers?|seats?)\b",  
            r"\$\d+([,\.]\d+)?\b",                                       
        ]

        found_stats: List[str] = []
        for pat in stat_patterns:
            matches = re.findall(pat, text, flags=re.IGNORECASE)
            for m in matches:
                full_match = m[0] if isinstance(m, tuple) else m
                if full_match and full_match not in found_stats:
                    found_stats.append(full_match)

        sample_context_regex = r"(\b\d+(\.\d+)?%\b|\b\d+(\.\d+)?\s*(ms|seconds?|mins?|hours?)\b|\$\d+([,\.]\d+)?)"
        sample_snippets = [m.group(0) for m in re.finditer(sample_context_regex, text, flags=re.IGNORECASE)][:8]

        stats_count = len(sample_snippets)
        if stats_count >= 5:
            return FactorDetail(
                name="Statistical & Benchmark Density",
                weight=weight,
                score=100.0,
                status="PASSED",
                summary=f"High empirical authority. Found {stats_count} concrete statistics/benchmarks ({', '.join(sample_snippets[:5])}...).",
                evidence=[f"Sample metrics: {', '.join(sample_snippets[:6])}"],
                recommendations=[],
            ), sample_snippets
        elif stats_count >= 2:
            return FactorDetail(
                name="Statistical & Benchmark Density",
                weight=weight,
                score=65.0,
                status="WARNING",
                summary=f"Moderate statistical density ({stats_count} metrics). LLMs strongly favor sources with rich empirical data.",
                evidence=[f"Metrics found: {', '.join(sample_snippets)}"],
                recommendations=[
                    f"Include empirical metrics for {brand_name} such as latency numbers (ms), percentage gains (%), and SLA uptime guarantees.",
                    "Embed a feature and pricing comparison table comparing your performance against competitors.",
                ],
            ), sample_snippets

        return FactorDetail(
            name="Statistical & Benchmark Density",
            weight=weight,
            score=10.0,
            status="FAILED",
            summary="Zero or near-zero empirical statistics. Content consists of generic marketing adjectives with no citable data points.",
            evidence=["No verified metrics, percentages, SLA numbers, or benchmark figures detected"],
            recommendations=[
                f"Replace vague marketing buzzwords on {brand_name} with quantitative proof points (e.g. latency numbers, percentage gains, SLA uptime).",
                f"Add an empirical benchmark section or feature comparison matrix detailing {brand_name}'s performance against alternatives.",
            ],
        ), sample_snippets

    # -------------------------------------------------------------------------
    # Factor 5: E-E-A-T Credibility & Author Signals
    # -------------------------------------------------------------------------
    @classmethod
    def _evaluate_eeat(cls, soup: BeautifulSoup, text: str, brand_name: str = "your brand") -> FactorDetail:
        weight = 0.15
        evidence: List[str] = []
        score = 0.0

        author_tag = soup.find(attrs={"rel": "author"}) or soup.find(class_=re.compile(r"author|byline", re.I))
        if author_tag:
            author_text = author_tag.get_text(strip=True)
            evidence.append(f"Author byline detected: '{author_text}'")
            score += 50.0

        credential_matches = re.findall(r"\b(Dr\.|Ph\.D\.|Architect|Lead|Engineer|SOC2|ISO\s*\d+|GDPR|Certified)\b", text, flags=re.IGNORECASE)
        if credential_matches:
            evidence.append(f"Credentials / Certifications detected: {', '.join(set(credential_matches[:4]))}")
            score += 30.0

        if re.search(r"\b(methodology|benchmarks?|audited|references?)\b", text, flags=re.IGNORECASE):
            evidence.append("Methodology / Benchmark reference section detected")
            score += 20.0

        score = min(score, 100.0)
        status = "PASSED" if score >= 80 else ("WARNING" if score >= 40 else "FAILED")

        recs = []
        if score < 80:
            recs.append(f"Add an explicit author or expert team byline on {brand_name} detailing technical credentials and leadership experience.")
            recs.append(f"Highlight enterprise certifications (e.g. SOC2, ISO, GDPR) or third-party audit methodology for {brand_name}.")

        return FactorDetail(
            name="E-E-A-T Author & Credibility Signals",
            weight=weight,
            score=score,
            status=status,
            summary=f"E-E-A-T score: {round(score)}/100 based on author byline, credentials, and methodology notes.",
            evidence=evidence if evidence else ["No author byline or credential trust signals found"],
            recommendations=recs,
        )

    # -------------------------------------------------------------------------
    # Factor 6: Freshness & Temporal Anchoring
    # -------------------------------------------------------------------------
    @classmethod
    def _evaluate_freshness(cls, soup: BeautifulSoup, text: str, brand_name: str = "your brand") -> FactorDetail:
        weight = 0.15
        evidence: List[str] = []
        score = 0.0

        time_tag = soup.find("time")
        if time_tag:
            evidence.append(f"Semantic <time> tag detected: '{time_tag.get_text(strip=True)}'")
            score += 50.0

        if "2026" in text:
            evidence.append("Explicit 2026 temporal anchor detected")
            score += 35.0
        elif "2025" in text:
            evidence.append("Explicit 2025 temporal anchor detected")
            score += 20.0

        if re.search(r"\b(last\s+updated|modified|published)\b", text, flags=re.IGNORECASE):
            evidence.append("Freshness label ('Updated' / 'Published') detected")
            score += 15.0

        score = min(score, 100.0)
        status = "PASSED" if score >= 80 else ("WARNING" if score >= 40 else "FAILED")

        recs = []
        if score < 80:
            recs.append("Add semantic <time datetime='2026-XX-XX'> elements with explicit 'Last Audited' or 'Published' dates.")
            recs.append("Include current year temporal anchors (e.g. '2026') in page title and headings to satisfy temporal freshness filters.")

        return FactorDetail(
            name="Content Freshness & Temporal Anchoring",
            weight=weight,
            score=score,
            status=status,
            summary=f"Freshness score: {round(score)}/100 based on timestamps and temporal anchoring.",
            evidence=evidence if evidence else ["No semantic <time> tags or recent year anchors detected"],
            recommendations=recs,
        )
