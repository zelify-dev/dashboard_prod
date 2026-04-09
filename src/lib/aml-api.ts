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
export async function getAMLListsCatalog(
  params: { page?: number; search?: string; limit?: number } = {},
  options: RequestInit = {}
): Promise<AMLCatalogResponse> {
  const queryObj: Record<string, string> = {
    page: (params.page || 1).toString(),
  };

  if (params.search) {
    queryObj.search = params.search;
  }

  if (params.limit) {
    queryObj.limit = params.limit.toString();
  }

  const query = new URLSearchParams(queryObj).toString();

  const res = await fetchWithAuth(`/api/aml/lists?${query}`, {
    method: "GET",
    ...options,
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
/**
 * Interface for an AML Validation Group.
 */
export interface AMLGroup {
  id: string;
  name: string;
  description?: string;
  sources: string[]; // Array of short_names (e.g., ["sdn", "pep"])
  min_score: number; // Confidence threshold (0.0 - 1.0)
  organization_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for creating/updating a group.
 */
export interface AMLGroupRequest {
  name: string;
  description?: string;
  sources: string[];
  min_score: number;
}

/**
 * Fetches all AML groups for the current organization.
 * GET /api/aml/groups
 */
export async function getAMLGroups(): Promise<AMLGroup[]> {
  const org = getStoredOrganization();
  if (!org?.id) throw new Error("Organization ID not found in session.");

  const res = await fetchWithAuth("/api/aml/groups", {
    method: "GET",
    headers: {
      "x-org-id": org.id,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch AML groups");
  }

  return res.json();
}

/**
 * Creates a new AML validation group.
 * POST /api/aml/groups
 */
export async function createAMLGroup(data: AMLGroupRequest): Promise<AMLGroup> {
  const org = getStoredOrganization();
  if (!org?.id) throw new Error("Organization ID not found in session.");

  const res = await fetchWithAuth("/api/aml/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-org-id": org.id,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create AML group");
  }

  return res.json();
}

/**
 * Updates an existing AML validation group.
 * PATCH /api/aml/groups/{id}
 */
export async function updateAMLGroup(groupId: string, data: Partial<AMLGroupRequest>): Promise<AMLGroup> {
  const org = getStoredOrganization();
  if (!org?.id) throw new Error("Organization ID not found in session.");

  const res = await fetchWithAuth(`/api/aml/groups/${groupId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-org-id": org.id,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update AML group");
  }

  return res.json();
}

/**
 * Deletes an AML validation group.
 * DELETE /api/aml/groups/{id}
 */
export async function deleteAMLGroup(groupId: string): Promise<void> {
  const org = getStoredOrganization();
  if (!org?.id) throw new Error("Organization ID not found in session.");

  const res = await fetchWithAuth(`/api/aml/groups/${groupId}`, {
    method: "DELETE",
    headers: {
      "x-org-id": org.id,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete AML group");
  }
}

/**
 * Triggers a new AML screening search.
 * POST /api/aml/screening
 */
export async function createAMLScreening(data: { 
  name: string; 
  validation_group_id?: string; 
  data_source?: string; 
  min_score?: number;
  entity_type?: string;
  date_of_birth?: string;
  nationality?: string;
  country?: string;
  identifier?: string;
}): Promise<{ screening_id: string; [key: string]: any }> {
  const org = getStoredOrganization();
  if (!org?.id) throw new Error("Organization ID not found in session.");

  const res = await fetchWithAuth("/api/aml/screening", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-org-id": org.id,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to start AML screening");
  }

  return res.json();
}
