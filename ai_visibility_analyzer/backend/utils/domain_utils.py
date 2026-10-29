"""
Domain and URL Utility Functions.
Handles root domain extraction, brand name normalization, and platform categorization.
"""
from __future__ import annotations

import re
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

KNOWN_BRAND_NAMES = {
    "clickup": "ClickUp", "notion": "Notion", "monday": "Monday.com",
    "jira": "Jira", "asana": "Asana", "linear": "Linear",
    "pulsetask": "PulseTask", "slurrpfarm": "Slurrp Farm",
    "bitdefender": "Bitdefender", "norton": "Norton", "mcafee": "McAfee",
    "malwarebytes": "Malwarebytes", "avast": "Avast", "kaspersky": "Kaspersky",
    "eset": "ESET", "sophos": "Sophos"
}


def extract_root_domain(url_or_host: str) -> str:
    """Extracts root domain cleanly (e.g. 'https://www.clickup.com/pricing' -> 'clickup.com')."""
    if not url_or_host:
        return ""
    if "://" not in url_or_host:
        url_or_host = f"https://{url_or_host}"
    host = urlparse(url_or_host).netloc.lower().split(":")[0].removeprefix("www.")
    parts = host.split(".")
    if len(parts) >= 3 and ".".join(parts[-2:]) in TWO_PART_TLDS:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:]) if len(parts) >= 2 else host


def extract_brand_name(url_or_domain: str) -> str:
    """Derives clean brand name from domain (e.g. 'bitdefender.com' -> 'Bitdefender')."""
    domain = extract_root_domain(url_or_domain)
    name = domain.split(".")[0] if domain else url_or_domain
    return KNOWN_BRAND_NAMES.get(name.lower(), name.replace("-", " ").title())


def build_brand_regex(url_or_domain: str) -> re.Pattern:
    """Builds regex that matches the domain name or brand name with flexible spacing/hyphens."""
    dom = extract_root_domain(url_or_domain)
    brand = extract_brand_name(dom)
    clean = re.sub(r"[^a-z0-9]", "", brand.lower())
    if len(clean) <= 4:
        pat = rf"\b{re.escape(dom)}\b|\b{re.escape(brand)}\b"
    else:
        spaced = r"[\s\-]?".join(re.escape(c) for c in clean)
        pat = rf"\b{re.escape(dom)}\b|\b{spaced}\b|\b{re.escape(brand)}\b"
    return re.compile(pat, re.I)


def classify_platform_type(domain: str) -> str:
    """Classifies a domain into review_platform, community, reference, marketplace, or publisher."""
    dom = extract_root_domain(domain)
    for category, domains in KNOWN_PLATFORMS.items():
        if any(dom == d or dom.endswith("." + d) for d in domains):
            return category
    return "publisher"
