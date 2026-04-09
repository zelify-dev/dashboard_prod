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

export type MerchantDiscountSummary = {
  discount_id: string;
  discount_name: string;
  total_redemptions: number;
};

export type OrganizationDiscountSummary = {
  merchant_id: string;
  merchant_name: string;
  total_redemptions: number;
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
