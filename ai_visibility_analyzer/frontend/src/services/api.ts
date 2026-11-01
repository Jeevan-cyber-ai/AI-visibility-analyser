import type {
  HealthResponse,
  PageAuditResult,
  ComparativePageAudit,
  ClusterSummary,
  ComparativeAuditReport,
  FullAuditResponse,
  CompetitorInfo,
  QueryVariation,
  CitationGapResponse,
  EvidenceAdvisorResponse,
  ContentDraftRequest,
  ContentDraftResponse,
} from '../types/api';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function auditPage(urlOrPath: string): Promise<PageAuditResult> {
  const res = await fetch(`${API_BASE}/crawler/audit-page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url_or_path: urlOrPath }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to audit page');
  }
  return res.json();
}

export async function compareCompetitors(
  urlOrPath: string,
  competitors?: string[],
  query?: string,
  provider?: string
): Promise<ComparativePageAudit> {
  const payload: {
    url_or_path: string;
    competitors?: string[];
    query?: string;
    provider?: string;
  } = {
    url_or_path: urlOrPath,
  };
  if (competitors && competitors.length > 0) {
    payload.competitors = competitors;
  }
  if (query && query.trim()) {
    payload.query = query.trim();
  }
  if (provider) {
    payload.provider = provider;
  }

  const res = await fetch(`${API_BASE}/crawler/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to benchmark competitors');
  }
  return res.json();
}

export async function auditCluster(params: {
  query: string;
  brandUrl: string;
  competitors?: string[];
  autoDiscover?: boolean;
  count?: number;
  provider?: string;
}): Promise<{ cluster_summary: ClusterSummary; comparative_report: ComparativeAuditReport }> {
  const res = await fetch(`${API_BASE}/audit/cluster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: params.query,
      brand_url: params.brandUrl,
      competitors: params.competitors,
      auto_discover_competitors: params.autoDiscover ?? true,
      count: params.count ?? 5,
      provider: params.provider || 'Gemini',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to audit query cluster');
  }
  return res.json();
}

export async function runFullAudit(params: {
  query: string;
  brandUrl: string;
  onPageTarget?: string;
  competitors?: string[];
  autoDiscover?: boolean;
  count?: number;
  provider?: string;
}): Promise<FullAuditResponse> {
  const res = await fetch(`${API_BASE}/audit/full`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: params.query,
      brand_url: params.brandUrl,
      on_page_target: params.onPageTarget,
      competitors: params.competitors,
      auto_discover_competitors: params.autoDiscover ?? true,
      count: params.count ?? 5,
      provider: params.provider || 'Gemini',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to run full audit');
  }
  return res.json();
}

export async function discoverCompetitors(
  brandOrTopic: string,
  limit: number = 4,
  provider: string = 'Gemini'
): Promise<{ competitors: CompetitorInfo[] }> {
  const res = await fetch(`${API_BASE}/competitors/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_or_topic: brandOrTopic,
      limit,
      provider,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to discover competitors');
  }
  return res.json();
}

export async function expandQueries(
  query: string,
  brandUrl: string,
  competitors?: string[],
  count: number = 5,
  provider: string = 'Gemini'
): Promise<{ queries: QueryVariation[] }> {
  const res = await fetch(`${API_BASE}/queries/expand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      brand_url: brandUrl,
      competitors,
      count,
      provider,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to expand queries');
  }
  return res.json();
}

export async function generateContentDraft(req: ContentDraftRequest): Promise<ContentDraftResponse> {
  const res = await fetch(`${API_BASE}/content/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to generate content draft');
  }
  return res.json();
}

export async function fetchCitationGaps(params: {
  query: string;
  brandUrl: string;
  competitors?: string[];
  provider?: string;
}): Promise<CitationGapResponse> {
  const res = await fetch(`${API_BASE}/citation-gap/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: params.query,
      brand_url: params.brandUrl,
      competitors: params.competitors,
      provider: params.provider || 'Gemini',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch citation gap analysis');
  }
  return res.json();
}

export async function fetchEvidenceAdvisor(params: {
  query: string;
  brandUrl: string;
  onPageTarget?: string;
  competitors?: string[];
  provider?: string;
}): Promise<EvidenceAdvisorResponse> {
  const res = await fetch(`${API_BASE}/advisor/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: params.query,
      brand_url: params.brandUrl,
      on_page_target: params.onPageTarget,
      competitors: params.competitors,
      provider: params.provider || 'Gemini',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch evidence advisor analysis');
  }
  return res.json();
}
