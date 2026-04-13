import { fetchWithAuth, AuthError } from "@/lib/auth-api";

export type DiscountMerchant = {
  id: string;
  country_code: string;
  name: string;
  slug?: string;
  description?: string | null;
  logo_url?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type MerchantDiscount = {
  id: string;
  merchant_id: string;
  name: string;
  description?: string | null;
  discount_type: string;
  discount_value: string | number;
  min_purchase?: string | number | null;
  max_uses_total?: number | null;
  max_uses_per_user?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  available_days?: string[];
  restrict_by_hours?: boolean;
  available_hours_start?: string | null;
  available_hours_end?: string | null;
  timezone?: string | null;
  status: string;
  applicable_category_ids?: string[];
  applicable_product_ids?: string[];
  applicable_to?: {
    categories?: string[];
    products?: string[];
  };
  created_at?: string;
  updated_at?: string;
};

export type MerchantCoupon = {
  id: string;
  discount_id: string;
  code: string;
  share_token?: string;
  max_redemptions: number;
  redemptions_count: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  discount?: MerchantDiscount;
};

export type MerchantBranch = {
  id: string;
  merchant_id: string;
  city: string;
  address: string;
  lat?: number | string | null;
  lng?: number | string | null;
  name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type MerchantCategory = {
  id: string;
  merchant_id: string;
  name: string;
  slug: string;
  sort_order?: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type MerchantProduct = {
  id: string;
  merchant_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: string | number;
  currency: string;
  image_url?: string | null;
  sort_order?: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationClaim = {
  id: string;
  claim_code: string;
  status: string;
  used: boolean;
  canceled: boolean;
  expired: boolean;
  created_at?: string;
  redeemed_at?: string | null;
  merchant_visibility_status?: string;
  merchant_is_currently_visible?: boolean;
  can_retry?: boolean;
  coupon?: {
    id: string;
    code: string;
    status: string;
    discount?: {
      id: string;
      merchant_id: string;
      name: string;
      description?: string | null;
      discount_type: string;
      discount_value: string | number;
      status: string;
      valid_from?: string | null;
      valid_until?: string | null;
      applicable_to?: {
        categories?: string[];
        products?: string[];
      };
    };
  };
};

export type OrganizationRedemption = {
  id: string;
  coupon_id: string;
  user_id: string;
  organization_id: string;
  redeemed_at: string;
  metadata?: unknown;
  created_at?: string;
  updated_at?: string;
  coupon?: MerchantCoupon & {
    discount?: MerchantDiscount & {
      merchant?: DiscountMerchant;
    };
  };
};

export type MerchantDiscountSummary = {
  discount_id: string;
  discount_name: string;
  total_redemptions: number;
};

export type MerchantAnalytics = {
  merchant_id: string;
  total_discounts: number;
  active_discounts: number;
  total_coupons: number;
  active_coupons: number;
  total_claims: number;
  pending_claims: number;
  total_redemptions: number;
  unique_users: number;
  coupon_usage_rate: number;
  top_discounts?: MerchantDiscountSummary[];
};

export type DiscountAnalytics = {
  discount_id: string;
  merchant_id: string;
  discount_name: string;
  status: string;
  total_coupons: number;
  active_coupons: number;
  total_claims: number;
  pending_claims: number;
  total_redemptions: number;
  unique_users: number;
  coupon_usage_rate: number;
  top_organizations?: Array<{
    organization_id: string;
    organization_name: string;
    total_redemptions: number;
  }>;
};

export type OrganizationDiscountSummary = {
  merchant_id: string;
  merchant_name: string;
  total_redemptions: number;
};

export type AdminDiscountsDashboard = {
  overview_cards?: {
    total_merchants?: number;
    active_merchants?: number;
    total_client_organizations?: number;
    total_merchant_organizations?: number;
    total_discounts?: number;
    active_discounts?: number;
    total_coupons?: number;
    active_coupons?: number;
    total_claims?: number;
    pending_claims?: number;
    canceled_claims?: number;
    redeemed_claims?: number;
    total_redemptions?: number;
    unique_users?: number;
    conversion_rate?: number;
  };
  funnel?: Record<string, unknown>;
  charts?: {
    timeseries?: Array<{
      label?: string;
      date?: string;
      claims?: number;
      redemptions?: number;
      coupons?: number;
    }>;
    by_country?: Array<{
      country_code?: string;
      claims?: number;
      redemptions?: number;
    }>;
    by_merchant_type?: Array<{
      merchant_type?: string;
      claims?: number;
      redemptions?: number;
    }>;
  };
  rankings?: {
    top_merchants?: Array<{
      merchant_id?: string;
      merchant_name?: string;
      claims?: number;
      redemptions?: number;
    }>;
    top_organizations?: Array<{
      organization_id?: string;
      organization_name?: string;
      claims?: number;
      redemptions?: number;
    }>;
    top_discounts?: Array<{
      discount_id?: string;
      discount_name?: string;
      claims?: number;
      redemptions?: number;
    }>;
  };
  recent_activity?: Array<{
    id?: string;
    type?: string;
    happened_at?: string;
    merchant_name?: string;
    organization_name?: string;
    coupon_code?: string;
    discount_name?: string;
  }>;
  executive_comparisons?: Record<string, unknown>;
};

export type MerchantOnboardingPayload = {
  country_code: string;
  merchant_name: string;
  merchant_slug: string;
  merchant_description?: string;
  merchant_logo_url?: string;
  merchant_type?: string;
  organization_name?: string;
  admin_full_name: string;
  admin_email: string;
  admin_phone?: string;
  admin_username?: string;
  admin_password?: string;
};

export type MerchantOnboardingResponse = {
  merchant?: DiscountMerchant;
  organization?: {
    id: string;
    name: string;
    status?: string;
  };
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  temporary_password?: string;
  admin_password?: string;
  message?: string;
};

export async function listDiscountMerchants(params: {
  countryCode: string;
  search?: string;
  status?: string;
}): Promise<DiscountMerchant[]> {
  const query = new URLSearchParams({ country_code: params.countryCode });
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status?.trim()) query.set("status", params.status.trim());

  const res = await fetchWithAuth(`/api/discounts/merchants?${query.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar merchants",
      res.status,
      data
    );
  }

  const merchants = (data as { merchants?: DiscountMerchant[] }).merchants;
  return Array.isArray(merchants) ? merchants : [];
}

export async function listNetworkDiscountMerchants(params?: {
  countryCode?: string;
  search?: string;
  status?: string;
}): Promise<DiscountMerchant[]> {
  const query = new URLSearchParams();
  if (params?.countryCode?.trim()) query.set("country_code", params.countryCode.trim());
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.status?.trim()) query.set("status", params.status.trim());

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetchWithAuth(`/api/discounts/merchants${suffix}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar merchants",
      res.status,
      data
    );
  }

  const merchants = (data as { merchants?: DiscountMerchant[] }).merchants;
  return Array.isArray(merchants) ? merchants : [];
}

export async function getAdminDiscountsDashboard(params?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<AdminDiscountsDashboard> {
  const query = new URLSearchParams();
  if (params?.from?.trim()) query.set("from", params.from.trim());
  if (params?.to?.trim()) query.set("to", params.to.trim());
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetchWithAuth(`/api/discounts/admin/analytics/dashboard${suffix}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener analytics globales",
      res.status,
      data
    );
  }
  return data as AdminDiscountsDashboard;
}

export async function updateDiscount(
  discountId: string,
  payload: {
    name?: string;
    description?: string;
    discount_type?: "PERCENTAGE" | "FIXED_AMOUNT";
    discount_value?: number;
    min_purchase?: number;
    max_uses_total?: number;
    max_uses_per_user?: number;
    valid_from?: string;
    valid_until?: string;
    available_days?: string[];
    restrict_by_hours?: boolean;
    available_hours_start?: string | null;
    available_hours_end?: string | null;
    timezone?: string;
    status?: "ACTIVE" | "INACTIVE";
    applicable_category_ids?: string[];
    applicable_product_ids?: string[];
  }
): Promise<MerchantDiscount> {
  const res = await fetchWithAuth(`/api/discounts/discounts/${encodeURIComponent(discountId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al editar descuento",
      res.status,
      data
    );
  }
  return data as MerchantDiscount;
}

export async function listMerchantDiscounts(merchantId: string): Promise<MerchantDiscount[]> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/discounts`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar descuentos",
      res.status,
      data
    );
  }

  const discounts = (data as { discounts?: MerchantDiscount[] }).discounts;
  return Array.isArray(discounts) ? discounts : [];
}

export async function getDiscountMerchant(merchantId: string): Promise<DiscountMerchant> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener merchant",
      res.status,
      data
    );
  }
  return data as DiscountMerchant;
}

export async function updateDiscountMerchant(
  merchantId: string,
  payload: {
    organization_id?: string | null;
    name?: string;
    description?: string;
    logo_url?: string;
    merchant_type?: string | null;
  }
): Promise<DiscountMerchant> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al actualizar merchant",
      res.status,
      data
    );
  }
  return data as DiscountMerchant;
}

export async function deactivateDiscountMerchant(merchantId: string): Promise<DiscountMerchant> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/deactivate`, {
    method: "PATCH",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al desactivar merchant",
      res.status,
      data
    );
  }
  return data as DiscountMerchant;
}

export async function createMerchantDiscount(
  merchantId: string,
  payload: {
    name: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    min_purchase?: number;
    max_uses_total?: number;
    max_uses_per_user?: number;
    valid_from: string;
    valid_until: string;
    available_days?: string[];
    restrict_by_hours?: boolean;
    available_hours_start?: string;
    available_hours_end?: string;
    timezone?: string;
    applicable_category_ids?: string[];
    applicable_product_ids?: string[];
  }
): Promise<MerchantDiscount> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/discounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al crear descuento",
      res.status,
      data
    );
  }
  return data as MerchantDiscount;
}

export async function listDiscountCoupons(discountId: string): Promise<MerchantCoupon[]> {
  const res = await fetchWithAuth(`/api/discounts/discounts/${encodeURIComponent(discountId)}/coupons`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar cupones",
      res.status,
      data
    );
  }

  const coupons = (data as { coupons?: MerchantCoupon[] }).coupons;
  return Array.isArray(coupons) ? coupons : [];
}

export async function createDiscountCoupon(
  discountId: string,
  payload: {
    code?: string;
    max_redemptions?: number;
  }
): Promise<MerchantCoupon> {
  const res = await fetchWithAuth(`/api/discounts/discounts/${encodeURIComponent(discountId)}/coupons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al crear cupón",
      res.status,
      data
    );
  }
  return data as MerchantCoupon;
}

export async function deactivateCoupon(couponId: string): Promise<MerchantCoupon> {
  const res = await fetchWithAuth(`/api/discounts/coupons/${encodeURIComponent(couponId)}/deactivate`, {
    method: "PATCH",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al desactivar cupón",
      res.status,
      data
    );
  }
  return data as MerchantCoupon;
}

export async function getCouponByCode(code: string): Promise<MerchantCoupon> {
  const res = await fetchWithAuth(`/api/discounts/coupons/by-code/${encodeURIComponent(code)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener cupón",
      res.status,
      data
    );
  }
  return data as MerchantCoupon;
}

export async function getMerchantReportsSummary(merchantId: string): Promise<MerchantDiscountSummary[]> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/reports/summary`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener resumen",
      res.status,
      data
    );
  }

  const summary = (data as { summary?: MerchantDiscountSummary[] }).summary;
  return Array.isArray(summary) ? summary : [];
}

export async function getMerchantAnalytics(
  merchantId: string,
  params?: { from?: string; to?: string }
): Promise<MerchantAnalytics> {
  const query = new URLSearchParams();
  if (params?.from?.trim()) query.set("from", params.from.trim());
  if (params?.to?.trim()) query.set("to", params.to.trim());
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/analytics${suffix}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener analytics del merchant",
      res.status,
      data
    );
  }
  return data as MerchantAnalytics;
}

export async function getDiscountAnalytics(
  discountId: string,
  params?: { from?: string; to?: string }
): Promise<DiscountAnalytics> {
  const query = new URLSearchParams();
  if (params?.from?.trim()) query.set("from", params.from.trim());
  if (params?.to?.trim()) query.set("to", params.to.trim());
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetchWithAuth(`/api/discounts/discounts/${encodeURIComponent(discountId)}/analytics${suffix}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener analytics del discount",
      res.status,
      data
    );
  }
  return data as DiscountAnalytics;
}

export async function getOrganizationReportsSummary(orgId: string): Promise<OrganizationDiscountSummary[]> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/discounts/reports/summary`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener resumen de organización",
      res.status,
      data
    );
  }

  const summary = (data as { summary?: OrganizationDiscountSummary[] }).summary;
  return Array.isArray(summary) ? summary : [];
}

export async function listOrganizationVisibleMerchants(orgId: string): Promise<DiscountMerchant[]> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/discounts/merchants`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar merchants visibles",
      res.status,
      data
    );
  }

  const merchants = (data as { merchants?: DiscountMerchant[] }).merchants;
  return Array.isArray(merchants) ? merchants : [];
}

export async function listOrganizationVisibleDiscounts(orgId: string): Promise<MerchantDiscount[]> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/discounts/discounts`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar descuentos visibles",
      res.status,
      data
    );
  }

  const discounts = (data as { discounts?: MerchantDiscount[] }).discounts;
  return Array.isArray(discounts) ? discounts : [];
}

export async function assignMerchantToOrganization(orgId: string, merchantId: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/discounts/merchants/${encodeURIComponent(merchantId)}`,
    { method: "POST" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al asignar merchant",
      res.status,
      data
    );
  }
  return data as { ok: boolean; message?: string };
}

export async function assignDiscountToOrganization(orgId: string, discountId: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/discounts/discounts/${encodeURIComponent(discountId)}`,
    { method: "POST" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al asignar descuento",
      res.status,
      data
    );
  }
  return data as { ok: boolean; message?: string };
}

export async function onboardDiscountMerchant(
  payload: MerchantOnboardingPayload
): Promise<MerchantOnboardingResponse> {
  const res = await fetchWithAuth("/api/discounts/merchants/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al crear merchant con onboarding",
      res.status,
      data
    );
  }
  return data as MerchantOnboardingResponse;
}

export async function listMerchantBranches(
  merchantId: string,
  params?: { city?: string; status?: string }
): Promise<MerchantBranch[]> {
  const query = new URLSearchParams();
  if (params?.city?.trim()) query.set("city", params.city.trim());
  if (params?.status?.trim()) query.set("status", params.status.trim());
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/branches${suffix}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al listar sucursales", res.status, data);
  }
  const branches = (data as { branches?: MerchantBranch[] }).branches;
  return Array.isArray(branches) ? branches : [];
}

export async function createMerchantBranch(
  merchantId: string,
  payload: { city: string; address: string; lat?: number; lng?: number; name: string }
): Promise<MerchantBranch> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al crear sucursal", res.status, data);
  }
  return data as MerchantBranch;
}

export async function updateMerchantBranch(
  merchantId: string,
  branchId: string,
  payload: { city?: string; address?: string; lat?: number; lng?: number; name?: string; status?: string }
): Promise<MerchantBranch> {
  const res = await fetchWithAuth(
    `/api/discounts/merchants/${encodeURIComponent(merchantId)}/branches/${encodeURIComponent(branchId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al actualizar sucursal", res.status, data);
  }
  return data as MerchantBranch;
}

export async function updateMerchantBranchGeolocation(
  merchantId: string,
  branchId: string,
  payload: { address: string; lat: number; lng: number }
): Promise<MerchantBranch> {
  const res = await fetchWithAuth(
    `/api/discounts/merchants/${encodeURIComponent(merchantId)}/branches/${encodeURIComponent(branchId)}/geolocation`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al actualizar geolocalización", res.status, data);
  }
  return data as MerchantBranch;
}

export async function deactivateMerchantBranch(merchantId: string, branchId: string): Promise<MerchantBranch> {
  const res = await fetchWithAuth(
    `/api/discounts/merchants/${encodeURIComponent(merchantId)}/branches/${encodeURIComponent(branchId)}/deactivate`,
    { method: "PATCH" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al desactivar sucursal", res.status, data);
  }
  return data as MerchantBranch;
}

export async function listMerchantCategories(merchantId: string): Promise<MerchantCategory[]> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/categories`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al listar categorías", res.status, data);
  }
  const categories = (data as { categories?: MerchantCategory[] }).categories;
  return Array.isArray(categories) ? categories : [];
}

export async function createMerchantCategory(
  merchantId: string,
  payload: { name: string; slug: string; sort_order?: number }
): Promise<MerchantCategory> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al crear categoría", res.status, data);
  }
  return data as MerchantCategory;
}

export async function updateMerchantCategory(
  merchantId: string,
  categoryId: string,
  payload: { name?: string; slug?: string; sort_order?: number; status?: string }
): Promise<MerchantCategory> {
  const res = await fetchWithAuth(
    `/api/discounts/merchants/${encodeURIComponent(merchantId)}/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al actualizar categoría", res.status, data);
  }
  return data as MerchantCategory;
}

export async function listMerchantProducts(
  merchantId: string,
  params?: { category_id?: string }
): Promise<MerchantProduct[]> {
  const query = new URLSearchParams();
  if (params?.category_id?.trim()) query.set("category_id", params.category_id.trim());
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/products${suffix}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al listar productos", res.status, data);
  }
  const products = (data as { products?: MerchantProduct[] }).products;
  return Array.isArray(products) ? products : [];
}

export async function createMerchantProduct(
  merchantId: string,
  payload: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    category_id?: string;
    image_url?: string;
    sort_order?: number;
  }
): Promise<MerchantProduct> {
  const res = await fetchWithAuth(`/api/discounts/merchants/${encodeURIComponent(merchantId)}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al crear producto", res.status, data);
  }
  return data as MerchantProduct;
}

export async function updateMerchantProduct(
  merchantId: string,
  productId: string,
  payload: {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    category_id?: string;
    image_url?: string;
    sort_order?: number;
    status?: string;
  }
): Promise<MerchantProduct> {
  const res = await fetchWithAuth(
    `/api/discounts/merchants/${encodeURIComponent(merchantId)}/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al actualizar producto", res.status, data);
  }
  return data as MerchantProduct;
}

export async function activateMerchantProduct(merchantId: string, productId: string): Promise<MerchantProduct> {
  const res = await fetchWithAuth(
    `/api/discounts/merchants/${encodeURIComponent(merchantId)}/products/${encodeURIComponent(productId)}/activate`,
    { method: "PATCH" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al activar producto", res.status, data);
  }
  return data as MerchantProduct;
}

export async function deactivateMerchantProduct(merchantId: string, productId: string): Promise<MerchantProduct> {
  const res = await fetchWithAuth(
    `/api/discounts/merchants/${encodeURIComponent(merchantId)}/products/${encodeURIComponent(productId)}/deactivate`,
    { method: "PATCH" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al desactivar producto", res.status, data);
  }
  return data as MerchantProduct;
}

export async function deleteMerchantProduct(merchantId: string, productId: string): Promise<{ ok: boolean }> {
  const res = await fetchWithAuth(
    `/api/discounts/merchants/${encodeURIComponent(merchantId)}/products/${encodeURIComponent(productId)}`,
    { method: "DELETE" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al eliminar producto", res.status, data);
  }
  return data as { ok: boolean };
}

export async function listOrganizationClaims(orgId: string, userId: string): Promise<OrganizationClaim[]> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/discounts/claims?user_id=${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al listar claims", res.status, data);
  }
  const claims = (data as { claims?: OrganizationClaim[] }).claims;
  return Array.isArray(claims) ? claims : [];
}

export async function cancelOrganizationClaim(
  orgId: string,
  claimId: string,
  userId: string
): Promise<Partial<OrganizationClaim> & { claim?: OrganizationClaim }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/discounts/claims/${encodeURIComponent(claimId)}/cancel?user_id=${encodeURIComponent(userId)}`,
    { method: "PATCH" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al cancelar claim", res.status, data);
  }
  return data as Partial<OrganizationClaim> & { claim?: OrganizationClaim };
}

export async function listOrganizationRedemptions(
  orgId: string,
  params?: {
    merchant_id?: string;
    discount_id?: string;
    user_id?: string;
    from?: string;
    to?: string;
  }
): Promise<OrganizationRedemption[]> {
  const query = new URLSearchParams();
  if (params?.merchant_id?.trim()) query.set("merchant_id", params.merchant_id.trim());
  if (params?.discount_id?.trim()) query.set("discount_id", params.discount_id.trim());
  if (params?.user_id?.trim()) query.set("user_id", params.user_id.trim());
  if (params?.from?.trim()) query.set("from", params.from.trim());
  if (params?.to?.trim()) query.set("to", params.to.trim());
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/discounts/reports/redemptions${suffix}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError((data as { message?: string }).message ?? "Error al listar redemptions", res.status, data);
  }
  const redemptions = (data as { redemptions?: OrganizationRedemption[] }).redemptions;
  return Array.isArray(redemptions) ? redemptions : [];
}
