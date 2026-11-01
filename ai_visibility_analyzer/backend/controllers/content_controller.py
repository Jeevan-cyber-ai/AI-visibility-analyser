"""
Content Studio Controller / Router.
Handles AI-powered GEO-optimised article drafting with a GEO checklist evaluation.
"""
from __future__ import annotations

import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.llm_service import get_llm_client

router = APIRouter(prefix="/api/content", tags=["content_studio"])


# ─────────────────────────── Request / Response models ───────────────────────

class ContentDraftRequest(BaseModel):
    question: str = Field(..., example="How do I choose the right team knowledge base?")
    website: Optional[str] = Field(default="", example="https://www.notion.so")
    keywords: Optional[str] = Field(default="", example="team knowledge base, collaborative workspace")
    audience: Optional[str] = Field(default="general", example="small teams")
    tone: Optional[str] = Field(default="helpful and expert", example="helpful and expert")
    word_count: Optional[int] = Field(default=800, ge=300, le=3000)
    provider: str = Field(default="Gemini")


class GeoChecklist(BaseModel):
    direct_answer_at_top: bool = False
    headings_as_questions: bool = False
    comparison_table: bool = False
    scannable_list: bool = False
    faq_section: bool = False
    word_count_700_plus: bool = False
    data_points_or_stats: bool = False
    score: int = 0   # 0–100


class KeywordPlacement(BaseModel):
    keyword: str
    in_title: bool = False
    in_first_100_words: bool = False
    in_at_least_one_h2: bool = False
    density_pct: float = 0.0
    density_status: str = "warning"  # "passed" (0.5-2.5%) | "warning"


class SecondaryKeywordCount(BaseModel):
    keyword: str
    count: int


class ContentDraftResponse(BaseModel):
    article_markdown: str
    article_html: str
    geo_checklist: GeoChecklist
    facts_to_confirm: List[str]
    suggested_schema: str
    word_count: int
    geo_score: int
    meta_title: str = ""
    meta_description: str = ""
    page_url: str = ""
    primary_keyword_analysis: Optional[KeywordPlacement] = None
    secondary_keywords: List[SecondaryKeywordCount] = Field(default_factory=list)


# ─────────────────────────── Helper: GEO checklist evaluator ─────────────────

def _evaluate_geo_checklist(markdown: str, word_count: int) -> GeoChecklist:
    """Analyses the generated article markdown against the 7 GEO criteria."""
    lower = markdown.lower()

    direct_answer = any(p in lower for p in [
        "quick answer", "short answer", "in short", "**answer**", "**quick answer**",
        "the answer is", "here's the answer", "to directly answer"
    ])

    # Count headings that end with "?" 
    question_headings = len(re.findall(r"^#{1,3}.+\?", markdown, re.MULTILINE))
    headings_as_questions = question_headings >= 2

    # Presence of markdown table
    has_table = bool(re.search(r"\|.+\|.+\|", markdown))

    # Bullet/numbered lists
    list_items = len(re.findall(r"^\s*[-*•]\s+.+", markdown, re.MULTILINE))
    numbered_items = len(re.findall(r"^\s*\d+\.\s+.+", markdown, re.MULTILINE))
    has_scannable_list = (list_items + numbered_items) >= 3

    # FAQ block
    faq_count = len(re.findall(r"(^#{1,4}.*(faq|frequently|common questions|q:|question))", lower, re.MULTILINE))
    faq_count += len(re.findall(r"\*\*q[:\s]", lower))
    has_faq = faq_count >= 3 or "faq" in lower

    # Stats / data points
    stat_matches = len(re.findall(r"\d+[\.,]?\d*\s*(%|percent|billion|million|thousand|times|x\b|hrs|hours|minutes|days|weeks)", lower))
    has_stats = stat_matches >= 2

    word_ok = word_count >= 700

    criteria = [direct_answer, headings_as_questions, has_table, has_scannable_list, has_faq, word_ok, has_stats]
    score = round((sum(criteria) / len(criteria)) * 100)

    return GeoChecklist(
        direct_answer_at_top=direct_answer,
        headings_as_questions=headings_as_questions,
        comparison_table=has_table,
        scannable_list=has_scannable_list,
        faq_section=has_faq,
        word_count_700_plus=word_ok,
        data_points_or_stats=has_stats,
        score=score,
    )


def _extract_facts_to_confirm(markdown: str) -> List[str]:
    """
    Extracts placeholders [STAT:...], [SOURCE:...], [FACT:...]
    and unverified numeric claims requiring human editorial validation.
    """
    facts = []

    # 1. Bracketed placeholders (Slide 14)
    placeholders = re.findall(r"\[(STAT|SOURCE|FACT|METRIC|BENCHMARK):?\s*([^\]]+)\]", markdown, re.IGNORECASE)
    for tag, desc in placeholders:
        facts.append(f"{tag.upper()}: {desc.strip()}")

    # 2. Sentences with concrete statistics / claims
    sentences = re.split(r'(?<=[.!?])\s+', markdown)
    patterns = [
        r"\d+[\.,]?\d*\s*(%|percent|billion|million|thousand|x\b)",
        r"\b(according to|research shows|studies show|survey|report|found that|data shows)\b",
    ]
    combined = re.compile("|".join(patterns), re.IGNORECASE)
    for sentence in sentences:
        clean = sentence.strip().lstrip("#* \t")
        if combined.search(clean) and len(clean) > 25 and not clean.startswith("["):
            facts.append(clean[:160])
        if len(facts) >= 10:
            break

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for f in facts:
        if f.lower() not in seen:
            seen.add(f.lower())
            deduped.append(f)

    # Fallback placeholders if LLM generated plain text
    if not deduped:
        deduped = [
            "SOURCE: authoritative definition",
            "STAT: time employees spend searching for information",
            "FACT: best-known strength",
            "FACT: pricing model",
            "STAT: typical monthly price range in this market"
        ]

    return deduped


def _markdown_to_html(markdown: str) -> str:
    """Markdown → HTML preview with gold badges for facts to confirm."""
    html = markdown

    # Replace [STAT:...], [SOURCE:...], [FACT:...] with styled inline badges
    html = re.sub(
        r"\[(STAT|SOURCE|FACT|METRIC|BENCHMARK):?\s*([^\]]+)\]",
        r'<mark class="fact-badge fact-\1"><strong>\1:</strong> \2</mark>',
        html,
        flags=re.IGNORECASE
    )

    # H1-H4
    html = re.sub(r"^#### (.+)$", r"<h4>\1</h4>", html, flags=re.MULTILINE)
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold / italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Tables
    def table_replace(m):
        rows = [r.strip() for r in m.group(0).strip().split("\n") if r.strip() and not re.match(r"^\|[-| ]+\|$", r.strip())]
        if not rows:
            return ""
        header = rows[0]
        body_rows = rows[1:]
        cells_h = [f"<th>{c.strip()}</th>" for c in header.split("|") if c.strip()]
        thead = f"<thead><tr>{''.join(cells_h)}</tr></thead>"
        tbody_rows = ""
        for row in body_rows:
            cells = [f"<td>{c.strip()}</td>" for c in row.split("|") if c.strip()]
            tbody_rows += f"<tr>{''.join(cells)}</tr>"
        return f'<div class="table-wrap"><table>{thead}<tbody>{tbody_rows}</tbody></table></div>'
    html = re.sub(r"(\|.+\|\n?)+", table_replace, html)

    # Unordered lists
    html = re.sub(r"((?:^[-*] .+\n?)+)", lambda m: "<ul>" + re.sub(r"^[-*] (.+)$", r"<li>\1</li>", m.group(0), flags=re.MULTILINE) + "</ul>", html, flags=re.MULTILINE)
    # Ordered lists
    html = re.sub(r"((?:^\d+\. .+\n?)+)", lambda m: "<ol>" + re.sub(r"^\d+\. (.+)$", r"<li>\1</li>", m.group(0), flags=re.MULTILINE) + "</ol>", html, flags=re.MULTILINE)
    # Paragraphs
    html = re.sub(r"\n\n+", "</p><p>", html)
    html = f"<p>{html}</p>"
    html = re.sub(r"<p>\s*(<h[1-4]>)", r"\1", html)
    html = re.sub(r"(</h[1-4]>)\s*</p>", r"\1", html)
    html = re.sub(r"<p>\s*(<[uot][lo]>)", r"\1", html)
    html = re.sub(r"(</[uot][lo]>)\s*</p>", r"\1", html)
    html = re.sub(r"<p>\s*(<div class=\"table-wrap\">)", r"\1", html)
    html = re.sub(r"(</div>)\s*</p>", r"\1", html)
    return html.strip()


def _build_schema(question: str, website: str, title: str, description: str) -> str:
    """Generates schema with Article and FAQPage graph."""
    q_clean = question.replace('"', "'")
    t_clean = (title or question).replace('"', "'")
    d_clean = (description or "Detailed guide and comparative overview.").replace('"', "'")
    site = website.strip().rstrip("/") if website else "https://www.yoursite.com"
    slug = re.sub(r"[^\w\s-]", "", question.lower()).strip().replace(" ", "-")[:45]
    return f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "Article",
      "headline": "{t_clean}",
      "description": "{d_clean}",
      "datePublished": "2026-10-21",
      "dateModified": "2026-10-21",
      "author": {{
        "@type": "Organization",
        "name": "{website.split('//')[-1].split('/')[0] if website else 'Your Brand'}",
        "url": "{site}"
      }}
    }},
    {{
      "@type": "FAQPage",
      "mainEntity": [
        {{
          "@type": "Question",
          "name": "{q_clean}",
          "acceptedAnswer": {{
            "@type": "Answer",
            "text": "{d_clean}"
          }}
        }}
      ]
    }}
  ],
  "url": "{site}/blog/{slug}"
}}
</script>"""


def _build_prompt(req: ContentDraftRequest) -> str:
    kw_section = f"\nPrimary keyword: {req.keywords.split(',')[0].strip() if req.keywords else ''}\nSecondary keywords: {req.keywords}" if req.keywords else ""
    site_section = f"\nThe article should help establish '{req.website}' as an authoritative choice." if req.website else ""
    return f"""You are an expert GEO (Generative Engine Optimization) content writer.
Write a {req.word_count}-word article that directly answers this question for AI assistants and LLMs to cite:

QUESTION: {req.question}

AUDIENCE: {req.audience}
TONE: {req.tone}{kw_section}{site_section}

MANDATORY GEO STRUCTURE (follow exactly):
1. Quick answer paragraph at the very top starting with "**Quick answer:**" (2-3 sentences answering directly)
2. H1 title (# How to...)
3. H2 section headings phrased as questions (## What is X?, ## Why does choosing the right one matter?, ## How do you compare the options?)
4. A 4-column comparison table comparing 3-4 options (Features, Pricing, Best For, Rating)
5. Scannable bulleted checklist of decision criteria
6. FAQ section with at least 3 Q&A pairs (### Frequently Asked Questions)
7. Concrete data points and statistics

CRITICAL RULE — NO INVENTED FACTS (Slide 14):
Where a statistic, source or specific quote would help, insert a placeholder instead of guessing:
[SOURCE: authoritative definition]
[STAT: time employees spend searching for information]
[FACT: best-known strength]
[FACT: pricing model]
[STAT: typical monthly price range in this market]

FORMAT: Pure Markdown only. Start directly with "**Quick answer:**". No preamble.
"""


@router.post("/draft", response_model=ContentDraftResponse)
def draft_article(req: ContentDraftRequest):
    """Generates a GEO-optimised article draft with SERP preview and keyword analysis."""
    try:
        client = get_llm_client(req.provider)
        prompt = _build_prompt(req)
        llm_response = client.query(prompt)
        article_md = getattr(llm_response, "text", "") or getattr(llm_response, "answer", "")

        if not article_md:
            article_md = f"**Quick answer:** The right solution depends on your team size, budget, and integration requirements. This guide compares the leading tools with objective benchmarks.\n\n# {req.question}\n\n## What should you consider?\n\nWhen evaluating options, focus on integration depth and collaboration capabilities. [SOURCE: authoritative definition]\n\n## Comparison\n\n| Tool | Best For | Pricing | Rating |\n|---|---|---|---|\n| Solution A | Enterprise | $15/mo | 4.8/5 |\n| Solution B | Startups | $8/mo | 4.6/5 |\n| Solution C | Freelancers | Free | 4.4/5 |\n\n## Frequently Asked Questions\n\n**Q: What is the most cost-effective option?**\nOpen source or self-hosted alternatives offer the lowest total cost of ownership.\n\n**Q: How steep is the learning curve?**\nMost modern teams onboard within [STAT: typical onboarding days] days."

        words = article_md.split()
        wc = len(words)

        # Extract H1 title
        h1_match = re.search(r"^#\s+(.+)$", article_md, re.MULTILINE)
        meta_title = h1_match.group(1).strip() if h1_match else req.question
        if len(meta_title) > 60:
            meta_title = meta_title[:57] + "..."

        # Extract meta description from Quick answer
        qa_match = re.search(r"\*\*Quick answer:\*\*\s*(.+?)(?=\n\n|#|$)", article_md, re.DOTALL)
        meta_desc = qa_match.group(1).replace("\n", " ").strip() if qa_match else article_md[:140]
        if len(meta_desc) > 155:
            meta_desc = meta_desc[:152] + "..."

        # Slug & URL
        site = req.website.strip().rstrip("/") if req.website else "https://www.notion.so"
        slug = re.sub(r"[^\w\s-]", "", req.question.lower()).strip().replace(" ", "-")[:40]
        page_url = f"{site}/blog/{slug}"

        # Keyword analysis
        kw_list = [k.strip() for k in req.keywords.split(",") if k.strip()] if req.keywords else []
        primary_kw = kw_list[0] if kw_list else req.question.split()[:3]
        primary_kw_str = primary_kw if isinstance(primary_kw, str) else " ".join(primary_kw)

        in_title = primary_kw_str.lower() in meta_title.lower()
        first_100_words = " ".join(words[:100]).lower()
        in_first_100 = primary_kw_str.lower() in first_100_words

        h2_headings = re.findall(r"^##\s+(.+)$", article_md, re.MULTILINE)
        in_h2 = any(primary_kw_str.lower() in h.lower() for h in h2_headings)

        kw_matches = len(re.findall(re.escape(primary_kw_str), article_md, re.IGNORECASE))
        kw_density = round((kw_matches * len(primary_kw_str.split()) / max(wc, 1)) * 100, 2)
        kw_status = "passed" if 0.5 <= kw_density <= 2.5 else "warning"

        primary_kw_analysis = KeywordPlacement(
            keyword=primary_kw_str,
            in_title=in_title,
            in_first_100_words=in_first_100,
            in_at_least_one_h2=in_h2,
            density_pct=kw_density,
            density_status=kw_status,
        )

        secondary_kw_counts = []
        for sk in kw_list[1:]:
            cnt = len(re.findall(re.escape(sk), article_md, re.IGNORECASE))
            secondary_kw_counts.append(SecondaryKeywordCount(keyword=sk, count=cnt))

        geo = _evaluate_geo_checklist(article_md, wc)
        facts = _extract_facts_to_confirm(article_md)
        html = _markdown_to_html(article_md)
        schema = _build_schema(req.question, req.website or "", meta_title, meta_desc)

        return ContentDraftResponse(
            article_markdown=article_md,
            article_html=html,
            geo_checklist=geo,
            facts_to_confirm=facts,
            suggested_schema=schema,
            word_count=wc,
            geo_score=geo.score,
            meta_title=meta_title,
            meta_description=meta_desc,
            page_url=page_url,
            primary_keyword_analysis=primary_kw_analysis,
            secondary_keywords=secondary_kw_counts,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

