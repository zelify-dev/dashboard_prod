import { fetchWithAuth, getStoredOrganization } from "./auth-api";

/**
 * Interface for a screening item in the global audit list.
 */
export interface AMLScreeningItem {
  screening_id: string;
  name: string;
  data_source: string;
  match_count: number;
  has_matches: boolean;
  created_at: string;
  provider_search_id?: string;
}

/**
 * Interface for the paginated response of screenings.
 */
export interface AMLScreeningsResponse {
  items: AMLScreeningItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Interface for the detailed radiography of a screening.
 * Based on real sample with multiple results and confidence scores.
 */
export interface AMLScreeningDetail {
  screening_id: string;
  organization_id: string;
  provider_search_id: string;
  created_at: string;
  updated_at: string;
  request: {
    name: string;
    page: number;
    data_source: string;
    entity_type?: string;
    [key: string]: any;
  };
  response: {
    count: number;
    results: Array<{
      name: string;
      title?: string;
      gender?: string;
      confidence_score: number;
      program: string[];
      position?: Array<{
        title: string;
        organization?: string;
        start_date?: string;
        end_date?: string;
        country?: string;
      }>;
      data_source: {
        name: string;
        short_name: string;
      };
      entity_type: string;
      date_of_birth?: string[];
      place_of_birth?: string[];
      si_identifier: string;
      additional_information?: {
        web_source?: string;
        [key: string]: any;
      };
      source_information_url?: string;
      [key: string]: any;
    }>;
    previous?: string | null;
  };
}

/**
 * Item from the global lists catalog (Catalog).
 */
export interface AMLCatalogItem {
  short_name: string;
  name: string;
  country: string;
  number_of_entries?: number;
  first_import?: string;
  last_update_info?: {
    timestamp: string;
    created_entries: number;
    deleted_entries: number;
    updated_entries: number;
  };
}

export interface AMLCatalogResponse {
  count: number;
  results: AMLCatalogItem[];
  has_more: boolean;
  page: number;
  next_page: number | null;
  previous_page: number | null;
}

/**
 * Fetches the global catalog of AML data sources.
 */
export async function getAMLListsCatalog(params: { page?: number } = {}): Promise<AMLCatalogResponse> {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
  }).toString();

  const res = await fetchWithAuth(`/api/aml/lists?${query}`, {
    method: "GET",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch AML catalog");
  }

  return res.json();
}

/**
 * Fetches the global audit list of AML screenings.
 */
export async function getAMLScreenings(params: { page?: number; limit?: number } = {}): Promise<AMLScreeningsResponse> {
  const org = getStoredOrganization();
  if (!org?.id) throw new Error("Organization ID not found in session.");

  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 25).toString(),
  }).toString();

  const res = await fetchWithAuth(`/api/aml/screenings?${query}`, {
    method: "GET",
    headers: {
      "x-org-id": org.id,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch AML screenings");
  }

  return res.json();
}

/**
 * Fetches the detailed radiography of a specific screening match.
 */
export async function getAMLScreeningDetail(screeningId: string): Promise<AMLScreeningDetail> {
  const org = getStoredOrganization();
  if (!org?.id) throw new Error("Organization ID not found in session.");

  const res = await fetchWithAuth(`/api/aml/screenings/${screeningId}`, {
    method: "GET",
    headers: {
      "x-org-id": org.id,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch AML screening detail");
  }

  return res.json();
}
