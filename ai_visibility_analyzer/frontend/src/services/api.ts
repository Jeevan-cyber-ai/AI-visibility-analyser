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

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '';
const BASE_URL = RAW_BASE.replace(/\/+$/, '');
const API_BASE = `${BASE_URL}/api`;

async function parseJsonResponse<T>(res: Response, fallbackMsg: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
      throw new Error(
        'Backend not connected. Received HTML from Vercel instead of API response. Please set VITE_API_BASE_URL in Vercel Settings -> Environment Variables to your Render backend URL (e.g. https://your-backend.onrender.com) and Redeploy.'
      );
    }
    throw new Error(`${fallbackMsg}: Expected JSON but received ${contentType || 'non-JSON'}`);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || fallbackMsg);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  return parseJsonResponse<HealthResponse>(res, 'Health check failed');
}

export async function auditPage(urlOrPath: string): Promise<PageAuditResult> {
  const res = await fetch(`${API_BASE}/crawler/audit-page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url_or_path: urlOrPath }),
  });
  return parseJsonResponse<PageAuditResult>(res, 'Failed to audit page');
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
  return parseJsonResponse<ComparativePageAudit>(res, 'Failed to benchmark competitors');
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
  return parseJsonResponse<{ cluster_summary: ClusterSummary; comparative_report: ComparativeAuditReport }>(
    res,
    'Failed to audit query cluster'
  );
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
  return parseJsonResponse<FullAuditResponse>(res, 'Failed to run full audit');
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
  return parseJsonResponse<{ competitors: CompetitorInfo[] }>(res, 'Failed to discover competitors');
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
  return parseJsonResponse<{ queries: QueryVariation[] }>(res, 'Failed to expand queries');
}

export async function generateContentDraft(req: ContentDraftRequest): Promise<ContentDraftResponse> {
  const res = await fetch(`${API_BASE}/content/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return parseJsonResponse<ContentDraftResponse>(res, 'Failed to generate content draft');
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
  return parseJsonResponse<CitationGapResponse>(res, 'Failed to fetch citation gap analysis');
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
  return parseJsonResponse<EvidenceAdvisorResponse>(res, 'Failed to fetch evidence advisor analysis');
}
