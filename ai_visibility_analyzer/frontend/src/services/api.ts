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

// Normalize BASE_URL: trim whitespace, strip trailing slashes, strip duplicate /api
let rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
if (rawBase.endsWith('/api')) {
  rawBase = rawBase.slice(0, -4);
}

export const BASE_URL = rawBase;
export const API_BASE = `${BASE_URL}/api`;

// Visual gateway banner in Developer Console
console.log(
  '%c[GEO Analyzer API Gateway]',
  'background: #4f46e5; color: #fff; padding: 3px 8px; border-radius: 4px; font-weight: bold;',
  {
    target_mode: BASE_URL ? 'Cloud Production (Render/External)' : 'Localhost / Relative Proxy',
    raw_env_setting: import.meta.env.VITE_API_BASE_URL || '(empty / not set)',
    computed_api_base: API_BASE,
  }
);

/**
 * Universal JSON fetcher with colored console logging for every API request and response.
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackMsg: string = 'API request failed'
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE}${cleanEndpoint}`;
  const method = options.method || 'GET';
  const startTime = performance.now();

  let bodyPayload: any = null;
  if (options.body && typeof options.body === 'string') {
    try {
      bodyPayload = JSON.parse(options.body);
    } catch {
      bodyPayload = options.body;
    }
  }

  // Log outgoing request
  console.log(
    `%c[API Request] %c${method} %c${fullUrl}`,
    'color: #38bdf8; font-weight: bold;',
    'color: #fbbf24; font-weight: bold;',
    'color: #94a3b8;',
    bodyPayload || '(no body)'
  );

  try {
    const res = await fetch(fullUrl, options);
    const durationMs = Math.round(performance.now() - startTime);
    const contentType = res.headers.get('content-type') || '';

    // Check if server returned HTML (common when proxying or when backend 404s to index.html)
    if (!contentType.includes('application/json')) {
      const rawText = await res.text();
      if (rawText.trim().toLowerCase().startsWith('<!doctype') || rawText.trim().toLowerCase().startsWith('<html')) {
        const errAlert = `Backend Not Connected: Request to "${fullUrl}" returned HTML instead of JSON. Ensure VITE_API_BASE_URL in Vercel is set to your Render URL (without /api) and redeployed.`;
        console.error(
          `%c[API 404 / HTML Error] %c${fullUrl} %c(${durationMs}ms)`,
          'color: #f43f5e; font-weight: bold;',
          'color: #fca5a5;',
          'color: #64748b; font-size: 0.85em;',
          errAlert
        );
        throw new Error(errAlert);
      }
      throw new Error(`${fallbackMsg}: Server returned non-JSON (${contentType || 'empty'})`);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      const msg = errData.detail || errData.message || `${fallbackMsg} (Status ${res.status})`;
      console.error(
        `%c[API Error ${res.status}] %c${fullUrl} %c(${durationMs}ms)`,
        'color: #f43f5e; font-weight: bold;',
        'color: #fca5a5;',
        'color: #64748b; font-size: 0.85em;',
        errData
      );
      throw new Error(msg);
    }

    const data = await res.json();
    console.log(
      `%c[API Success ${res.status}] %c${fullUrl} %c(${durationMs}ms)`,
      'color: #10b981; font-weight: bold;',
      'color: #a7f3d0;',
      'color: #64748b; font-size: 0.85em;',
      data
    );
    return data;
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error(
      `%c[API Failed] %c${fullUrl} %c(${durationMs}ms)`,
      'color: #ef4444; font-weight: bold;',
      'color: #fca5a5;',
      'color: #64748b; font-size: 0.85em;',
      err.message
    );
    throw err;
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health', { method: 'GET' }, 'Health check failed');
}

export async function auditPage(urlOrPath: string): Promise<PageAuditResult> {
  return apiFetch<PageAuditResult>(
    '/crawler/audit-page',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url_or_path: urlOrPath }),
    },
    'Failed to audit page'
  );
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

  return apiFetch<ComparativePageAudit>(
    '/crawler/compare',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Failed to benchmark competitors'
  );
}

export async function auditCluster(params: {
  query: string;
  brandUrl: string;
  competitors?: string[];
  autoDiscover?: boolean;
  count?: number;
  provider?: string;
}): Promise<{ cluster_summary: ClusterSummary; comparative_report: ComparativeAuditReport }> {
  return apiFetch<{ cluster_summary: ClusterSummary; comparative_report: ComparativeAuditReport }>(
    '/audit/cluster',
    {
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
    },
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
  return apiFetch<FullAuditResponse>(
    '/audit/full',
    {
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
    },
    'Failed to run full audit'
  );
}

export async function discoverCompetitors(
  brandOrTopic: string,
  limit: number = 4,
  provider: string = 'Gemini'
): Promise<{ competitors: CompetitorInfo[] }> {
  return apiFetch<{ competitors: CompetitorInfo[] }>(
    '/competitors/discover',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_or_topic: brandOrTopic,
        limit,
        provider,
      }),
    },
    'Failed to discover competitors'
  );
}

export async function expandQueries(
  query: string,
  brandUrl: string,
  competitors?: string[],
  count: number = 5,
  provider: string = 'Gemini'
): Promise<{ queries: QueryVariation[] }> {
  return apiFetch<{ queries: QueryVariation[] }>(
    '/queries/expand',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        brand_url: brandUrl,
        competitors,
        count,
        provider,
      }),
    },
    'Failed to expand queries'
  );
}

export async function generateContentDraft(req: ContentDraftRequest): Promise<ContentDraftResponse> {
  return apiFetch<ContentDraftResponse>(
    '/content/draft',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    },
    'Failed to generate content draft'
  );
}

export async function fetchCitationGaps(params: {
  query: string;
  brandUrl: string;
  competitors?: string[];
  provider?: string;
}): Promise<CitationGapResponse> {
  return apiFetch<CitationGapResponse>(
    '/citation-gap/analyse',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        brand_url: params.brandUrl,
        competitors: params.competitors,
        provider: params.provider || 'Gemini',
      }),
    },
    'Failed to fetch citation gap analysis'
  );
}

export async function fetchEvidenceAdvisor(params: {
  query: string;
  brandUrl: string;
  onPageTarget?: string;
  competitors?: string[];
  provider?: string;
}): Promise<EvidenceAdvisorResponse> {
  return apiFetch<EvidenceAdvisorResponse>(
    '/advisor/evidence',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        brand_url: params.brandUrl,
        on_page_target: params.onPageTarget,
        competitors: params.competitors,
        provider: params.provider || 'Gemini',
      }),
    },
    'Failed to fetch evidence advisor analysis'
  );
}
