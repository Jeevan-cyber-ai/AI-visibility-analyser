"""
Citation and Brand Mention Analysis Engine.
Extracts root domains, identifies brand mentions with spacing/hyphen variants,
detects mention position (Early/Mid/Late), matches citations, and categorizes source types.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional
from urllib.parse import urlparse

TWO_PART_TLDS = {"co.uk", "co.in", "com.au", "org.uk", "gov.in", "ac.in", "com.br"}

KNOWN_PLATFORMS = {
    "review_platform": [
        "g2.com", "capterra.com", "trustradius.com", "getapp.com",
        "producthunt.com", "trustpilot.com", "clutch.co", "softwareadvice.com"
    ],
    "community": [
        "reddit.com", "quora.com", "stackoverflow.com", "news.ycombinator.com",
        "medium.com", "dev.to"
    ],
    "reference": [
        "wikipedia.org", "wikidata.org", "crunchbase.com", "github.com"
    ],
    "marketplace": [
        "amazon.com", "amazon.in", "flipkart.com"
    ],
    "video": [
        "youtube.com"
    ],
}

POSITIVE_TERMS = re.compile(
    r"\b(best|top|recommended|leading|strong|reliable|popular|great|fast|clean|intuitive|powerful)\b",
    re.I
)
NEGATIVE_TERMS = re.compile(
    r"\b(expensive|lacks|limited|slow|difficult|outdated|complicated|buggy|steep|poor)\b",
    re.I
)


def extract_root_domain(url_or_host: str) -> str:
    """Extracts root domain cleanly (e.g. 'https://www.clickup.com/pricing' -> 'clickup.com')."""
    if "://" not in url_or_host:
        url_or_host = f"https://{url_or_host}"
    host = urlparse(url_or_host).netloc.lower().split(":")[0].removeprefix("www.")
    parts = host.split(".")
    if len(parts) >= 3 and ".".join(parts[-2:]) in TWO_PART_TLDS:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:]) if len(parts) >= 2 else host


def brand_name_from_domain(url_or_domain: str) -> str:
    """Derives brand name from domain (e.g., 'pulsetask.io' -> 'PulseTask', 'slurrpfarm.com' -> 'Slurrp Farm')."""
    domain = extract_root_domain(url_or_domain)
    name = domain.split(".")[0]
    known = {
        "clickup": "ClickUp", "notion": "Notion", "monday": "Monday.com",
        "jira": "Jira", "asana": "Asana", "linear": "Linear",
        "pulsetask": "PulseTask", "slurrpfarm": "Slurrp Farm"
    }
    return known.get(name, name.replace("-", " ").title())


def _brand_regex(url_or_domain: str) -> re.Pattern:
    """Builds regex that matches the domain name or brand name with flexible spacing/hyphens."""
    dom = extract_root_domain(url_or_domain)
    brand = brand_name_from_domain(dom)
    clean = re.sub(r"[^a-z0-9]", "", brand.lower())
    # Match domain directly or brand name with optional space/hyphen between characters
    if len(clean) <= 4:
        pat = rf"\b{re.escape(dom)}\b|\b{re.escape(brand)}\b"
    else:
        spaced = r"[\s\-]?".join(re.escape(c) for c in clean)
        pat = rf"\b{re.escape(dom)}\b|\b{spaced}\b|\b{re.escape(brand)}\b"
    return re.compile(pat, re.I)


def is_brand_mentioned(text: str, brand_url: str, citations: Optional[List[str]] = None) -> bool:
    """Returns True if the brand is mentioned in the response text or in the citation links."""
    pat = _brand_regex(brand_url)
    if pat.search(text):
        return True
    if citations:
        dom = extract_root_domain(brand_url)
        if any(dom == extract_root_domain(c) for c in citations):
            return True
    return False


def get_first_mention_index(text: str, brand_url: str) -> int:
    """Returns the character index of the first brand mention, or -1 if not found."""
    pat = _brand_regex(brand_url)
    m = pat.search(text)
    return m.start() if m else -1


def get_mention_position(text: str, brand_url: str) -> Optional[str]:
    """Classifies mention position as 'Early' (<33%), 'Mid' (33-66%), or 'Late' (>66%)."""
    idx = get_first_mention_index(text, brand_url)
    if idx < 0 or len(text) == 0:
        return None
    ratio = idx / len(text)
    if ratio < 0.33:
        return "Early"
    elif ratio < 0.66:
        return "Mid"
    return "Late"


def is_brand_cited(brand_url: str, citations: List[str]) -> bool:
    """Returns True if the brand's root domain appears in the model's citation list."""
    target_dom = extract_root_domain(brand_url)
    return any(target_dom == extract_root_domain(c) for c in citations)


def classify_source_type(domain: str) -> str:
    """Classifies a domain into review_platform, community, reference, marketplace, or publisher."""
    for category, domains in KNOWN_PLATFORMS.items():
        if any(domain == d or domain.endswith("." + d) for d in domains):
            return category
    return "publisher"


def categorize_citations(citations: List[str], target_brand_url: str) -> Dict[str, List[str]]:
    """Groups citations into target site, review platforms, communities, and publishers."""
    target_dom = extract_root_domain(target_brand_url)
    grouped: Dict[str, List[str]] = {
        "target_brand": [],
        "review_platforms": [],
        "communities": [],
        "other_sources": [],
    }

    for c in citations:
        dom = extract_root_domain(c)
        if dom == target_dom:
            grouped["target_brand"].append(c)
        else:
            cat = classify_source_type(dom)
            if cat == "review_platform":
                grouped["review_platforms"].append(c)
            elif cat == "community":
                grouped["communities"].append(c)
            else:
                grouped["other_sources"].append(c)

    return grouped


def analyze_sentiment(text: str, brand_url: str) -> Optional[str]:
    """Analyzes the context sentence containing the brand mention."""
    idx = get_first_mention_index(text, brand_url)
    if idx < 0:
        return None
    start = max(text.rfind(".", 0, idx), 0)
    end = text.find(".", idx)
    sentence = text[start : end if end > 0 else len(text)]

    pos = len(POSITIVE_TERMS.findall(sentence))
    neg = len(NEGATIVE_TERMS.findall(sentence))
    if pos > neg:
        return "Positive"
    elif neg > pos:
        return "Negative"
    return "Neutral"
