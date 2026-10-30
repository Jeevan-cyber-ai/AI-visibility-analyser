/**
 * TypeScript Data Models for AI Visibility & GEO Analyzer.
 * Matches backend Pydantic models.
 */

export type FactorStatus = "PASSED" | "WARNING" | "FAILED";

export interface FactorDetail {
  name: string;
  weight: number;
  score: number;
  weighted_score: number;
  status: FactorStatus;
  summary: string;
  evidence: string[];
  recommendations: string[];
}

export interface StatsSummary {
  word_count?: number;
  schemas_detected?: string[];
  direct_answers_count?: number;
  statistics_detected_count?: number;
  has_robots_txt?: boolean;
}

export interface PageAuditResult {
  url_or_path: string;
  brand_name: string;
  page_title?: string;
  meta_description?: string;
  overall_score: number;
  geo_score?: number;
  seo_score?: number;
  grade: string;
  factors: Record<string, FactorDetail>;
  seo_details?: Record<string, any>;
  stats_summary: StatsSummary;
  key_recommendations: string[];
}

export interface BrandQueryScore {
  brand_name: string;
  mention_rate: number;
  citation_rate: number;
  share_of_voice: number;
  query_score: number;
}

export interface ComparativePageAudit {
  target_brand: string;
  target_audit: PageAuditResult;
  competitors: PageAuditResult[];
  rank_position: number;
  total_sites: number;
  winner_brand: string;
  competitive_gap_summary: string;
  actionable_bullet_points: string[];
  ai_visibility_score?: number;
  share_of_voice?: number;
  geo_score?: number;
  seo_score?: number;
  // Integrated query cluster fields
  query?: string;
  cluster_summary?: ClusterSummary;
  comparative_report?: ComparativeAuditReport;
  brand_query_scores?: Record<string, BrandQueryScore>;
}

export interface QueryVariation {
  query: string;
  intent: string;
}

export interface QueryAuditResult {
  query: string;
  intent: string;
  target_mentioned: boolean;
  target_position?: "Early" | "Mid" | "Late" | null;
  target_cited: boolean;
  competitors_mentioned: string[];
  citations_count: number;
  raw_response_snippet: string;
}

export interface ClusterSummary {
  seed_query: string;
  target_brand: string;
  total_queries: number;
  mentions_count: number;
  mention_rate_pct: number;
  citations_count: number;
  citation_rate_pct: number;
  competitor_mentions: Record<string, number>;
  results: QueryAuditResult[];
}

export interface BrandScoreDetail {
  brand_name: string;
  domain: string;
  is_target: boolean;
  mention_count: number;
  mention_rate: number;
  citation_count: number;
  citation_rate: number;
  average_rank?: number | null;
  sentiment_score: number;
  composite_visibility_score: number;
  share_of_voice: number;
}

export interface ComparativeAuditReport {
  seed_query: string;
  total_queries_tested: number;
  target_brand: BrandScoreDetail;
  competitors: BrandScoreDetail[];
  winner_brand: string;
  gap_analysis: string[];
  formula_explanation: string;
}

export interface FullAuditResponse {
  target_brand: string;
  target_domain: string;
  page_audit?: PageAuditResult | null;
  cluster_summary: ClusterSummary;
  comparative_report: ComparativeAuditReport;
}

export interface CompetitorInfo {
  brand: string;
  domain: string;
  url: string;
}

export interface HealthResponse {
  status: string;
  providers: Record<string, boolean>;
  has_live_key: boolean;
}
