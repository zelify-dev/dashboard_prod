"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { MerchantPicker } from "@/app/pages/products/discounts-coupons/_components/merchant-picker";
import { DiscountEditor } from "@/app/pages/products/discounts-coupons/_components/discount-editor";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredRoles } from "@/lib/auth-api";
import { canManageMerchantActor, DASHBOARD_ROLE } from "@/lib/dashboard-routing";
import { useMerchantId } from "@/hooks/use-merchant-id";
import { useLanguage } from "@/contexts/language-context";
import {
  createMerchantDiscount,
  getDiscountAnalytics,
  listMerchantCategories,
  listMerchantDiscounts,
  listMerchantProducts,
  listNetworkDiscountMerchants,
  updateDiscount,
  type DiscountAnalytics,
  type DiscountMerchant,
  type MerchantCategory,
  type MerchantDiscount,
  type MerchantProduct,
} from "@/lib/discounts-api";

const LABELS = {
  es: {
    breadcrumb: "Comercio / Descuentos",
    heroTitle: "Gestión de Descuentos",
    heroSubtitle: "Crea y administra las reglas comerciales, ofertas y campañas de tu comercio.",
    totalCampaigns: "Campañas activas",
    btnNew: "Nuevo Descuento",
    btnCreateCoupon: "Crear Cupón",
    btnHide: "Ocultar formulario",
    btnEdit: "Editar",
    btnAnalytics: "Ver analytics",
    tableDiscount: "Descuento",
    tableType: "Tipo",
    tableValue: "Valor",
    tableValidity: "Vigencia",
    tableStatus: "Estado",
    tableActions: "Acciones",
    statusActive: "ACTIVO",
    statusInactive: "INACTIVO",
    loading: "Cargando descuentos...",
    noDiscounts: "No hay descuentos para este comercio.",
    analyticsTitle: "Analytics del Descuento",
    analyticsLoading: "Cargando métricas...",
    analyticsCoupons: "Cupones",
    analyticsClaims: "Reclamos",
    analyticsRedemptions: "Redenciones",
    analyticsRate: "Tasa de uso",
    topOrgs: "Top Organizaciones",
    noAnalytics: "No hay analytics disponibles.",
    viewOnly: "Este rol puede revisar analytics y estado, pero no administrar descuentos.",
    msgCreated: "Descuento creado correctamente.",
    msgUpdated: "Descuento actualizado correctamente.",
    formCreateTitle: "Crear nuevo descuento",
    formCreateDesc: "Configura una nueva regla comercial para este comercio.",
  },
  en: {
    breadcrumb: "Merchant / Discounts",
    heroTitle: "Discount Management",
    heroSubtitle: "Create and manage business rules, offers, and campaigns for your merchant.",
    totalCampaigns: "Active campaigns",
    btnNew: "New Discount",
    btnCreateCoupon: "Create Coupon",
    btnHide: "Hide form",
    btnEdit: "Edit",
    btnAnalytics: "View analytics",
    tableDiscount: "Discount",
    tableType: "Type",
    tableValue: "Value",
    tableValidity: "Validity",
    tableStatus: "Status",
    tableActions: "Actions",
    statusActive: "ACTIVE",
    statusInactive: "INACTIVE",
    loading: "Loading discounts...",
    noDiscounts: "No discounts found for this merchant.",
    analyticsTitle: "Discount Analytics",
    analyticsLoading: "Loading metrics...",
    analyticsCoupons: "Coupons",
    analyticsClaims: "Claims",
    analyticsRedemptions: "Redemptions",
    analyticsRate: "Usage Rate",
    topOrgs: "Top Organizations",
    noAnalytics: "No analytics available.",
    viewOnly: "This role can view analytics but cannot manage discounts.",
    msgCreated: "Discount created successfully.",
    msgUpdated: "Discount updated successfully.",
    formCreateTitle: "Create new discount",
    formCreateDesc: "Set up a new commercial rule for this merchant.",
  }
};

export default function MerchantDiscountsPage() {
  const { language } = useLanguage();
  const t = LABELS[language];

  const { countryCode } = useOrganizationCountry();
  const { merchantId: resolvedMerchantId, loading: resolving } = useMerchantId();
  const canManage = canManageMerchantActor(getStoredRoles());
  
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<MerchantDiscount[]>([]);
  const [categories, setCategories] = useState<MerchantCategory[]>([]);
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyticsFrom, setAnalyticsFrom] = useState("");
  const [analyticsTo, setAnalyticsTo] = useState("");
  const [discountAnalytics, setDiscountAnalytics] = useState<DiscountAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (resolving) return;
      const roles = getStoredRoles();
      const isAdmin = roles.includes(DASHBOARD_ROLE.OWNER) || roles.includes(DASHBOARD_ROLE.ZELIFY_TEAM);
      setLoadingMerchants(true);
      try {
        if (isAdmin) {
          const list = await listNetworkDiscountMerchants({ countryCode: countryCode ?? "EC" });
          setMerchants(list);
          setSelectedMerchantId(resolvedMerchantId ?? list[0]?.id ?? null);
        } else if (resolvedMerchantId) {
          const list = await listNetworkDiscountMerchants({ search: resolvedMerchantId });
          setMerchants(list);
          setSelectedMerchantId(resolvedMerchantId);
        }
      } catch (err) {
        setError("Error loading merchants list");
      } finally {
        setLoadingMerchants(false);
      }
    };
    void run();
  }, [resolvedMerchantId, resolving, countryCode]);

  useEffect(() => {
    const run = async () => {
      if (!selectedMerchantId) {
        setDiscounts([]);
        setCategories([]);
        setProducts([]);
        return;
      }
      setLoadingDiscounts(true);
      try {
        const [nextDiscounts, nextCategories, nextProducts] = await Promise.all([
          listMerchantDiscounts(selectedMerchantId),
          listMerchantCategories(selectedMerchantId),
          listMerchantProducts(selectedMerchantId),
        ]);
        setDiscounts(nextDiscounts);
        setCategories(nextCategories);
        setProducts(nextProducts);
      } finally {
        setLoadingDiscounts(false);
      }
    };
    void run();
  }, [selectedMerchantId]);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  const editingDiscount = useMemo(
    () => discounts.find((discount) => discount.id === editingDiscountId) ?? null,
    [discounts, editingDiscountId]
  );

  useEffect(() => {
    const run = async () => {
      if (!editingDiscountId) {
        setDiscountAnalytics(null);
        return;
      }
      setAnalyticsLoading(true);
      try {
        setDiscountAnalytics(
          await getDiscountAnalytics(editingDiscountId, {
            from: analyticsFrom || undefined,
            to: analyticsTo || undefined,
          })
        );
      } catch {
        setDiscountAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    void run();
  }, [analyticsFrom, analyticsTo, editingDiscountId]);

  const handleCreateDiscount = async (payload: any) => {
    if (!selectedMerchantId) return;
    setIsSavingDiscount(true);
    setError(null);
    setMessage(null);
    try {
      // CLEAN PAYLOAD: Strictly follow the "Blinded" payload contract for POST
      // Exclude technical/restricted fields that cause 400 errors or validation failures
      const { 
        status: _s, 
        id: _i, 
        merchant_id: _m, 
        created_at: _c, 
        updated_at: _u, 
        ...businessPayload 
      } = payload;
      
      const created = await createMerchantDiscount(selectedMerchantId, {
        ...businessPayload,
        name: payload.name ?? "",
        valid_from: payload.valid_from || new Date().toISOString(),
        valid_until: payload.valid_until || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        applicable_category_ids: payload.applicable_category_ids || [],
        applicable_product_ids: payload.applicable_product_ids || [],
      });

      setDiscounts((current) => [created, ...current]);
      setIsCreating(false);
      setMessage(t.msgCreated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleUpdateDiscount = async (payload: any) => {
    if (!editingDiscountId) return;
    setIsSavingDiscount(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateDiscount(editingDiscountId, payload);
      setDiscounts((current) =>
        current.map((discount) => (discount.id === updated.id ? { ...discount, ...updated } : discount))
      );
      setEditingDiscountId(null);
      setMessage(t.msgUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <Breadcrumb pageName={t.breadcrumb as string} />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-dark dark:text-white">{t.heroTitle}</h1>
              <p className="mt-1 text-sm text-dark-6">{t.heroSubtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden rounded-xl bg-gray-2 px-4 py-2 text-center dark:bg-dark-3 sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-6">{t.totalCampaigns}</p>
                <p className="text-xl font-bold text-primary">{discounts.filter(d => d.status === 'ACTIVE').length}</p>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <button onClick={() => { setIsCreating(!isCreating); setEditingDiscountId(null); }} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
                    {isCreating ? t.btnHide : t.btnNew}
                  </button>
                  <Link href="/merchant/coupons/create" className="rounded-xl border border-stroke bg-white px-6 py-3 text-sm font-bold text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:bg-dark-3 dark:text-white">
                    {t.btnCreateCoupon}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Picker if applicable */}
        {(merchants.length > 1 || !resolvedMerchantId) && (
          <MerchantPicker
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onSelect={setSelectedMerchantId}
            loading={loadingMerchants}
            countryCode={countryCode}
          />
        )}

        {/* Feedback Messages */}
        {(message || error) && (
          <div className={`rounded-xl p-4 text-sm font-medium ${message ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
             {message || error}
          </div>
        )}

        {canManage && isCreating && (
          <DiscountEditor
            discount={{ id: "new", merchant_id: selectedMerchantId || "", status: "ACTIVE" } as any}
            categories={categories}
            products={products}
            isSaving={isSavingDiscount}
            onCancel={() => setIsCreating(false)}
            onSave={handleCreateDiscount}
            title={t.formCreateTitle}
            descriptionText={t.formCreateDesc}
          />
        )}

        {/* Analytics & Editing */}
        {editingDiscount && (
          <div className="space-y-6">
            <DiscountEditor
              discount={editingDiscount}
              categories={categories}
              products={products}
              isSaving={isSavingDiscount}
              onCancel={() => setEditingDiscountId(null)}
              onSave={handleUpdateDiscount}
              title={canManage ? t.btnEdit : t.btnAnalytics}
            />
            
            <ShowcaseSection title={t.analyticsTitle} className="!p-6">
               <div className="mb-6 flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase text-dark-6">From</label>
                    <input type="date" value={analyticsFrom} onChange={(e) => setAnalyticsFrom(e.target.value)} className="rounded-xl border border-stroke bg-white px-4 py-2 text-sm dark:border-dark-3 dark:bg-dark-2" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase text-dark-6">To</label>
                    <input type="date" value={analyticsTo} onChange={(e) => setAnalyticsTo(e.target.value)} className="rounded-xl border border-stroke bg-white px-4 py-2 text-sm dark:border-dark-3 dark:bg-dark-2" />
                  </div>
               </div>

               {analyticsLoading ? (
                 <div className="py-10 text-center text-dark-6">{t.analyticsLoading}</div>
               ) : discountAnalytics ? (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: t.analyticsCoupons, val: discountAnalytics.total_coupons, sub: `Active: ${discountAnalytics.active_coupons}` },
                      { label: t.analyticsClaims, val: discountAnalytics.total_claims, sub: `Pending: ${discountAnalytics.pending_claims}` },
                      { label: t.analyticsRedemptions, val: discountAnalytics.total_redemptions, sub: `Users: ${discountAnalytics.unique_users}` },
                      { label: t.analyticsRate, val: `${discountAnalytics.conversion_rate ?? discountAnalytics.coupon_usage_rate ?? 0}%`, sub: `Status: ${discountAnalytics.status}` }
                    ].map((card, i) => (
                      <div key={i} className="rounded-2xl border border-stroke p-5 dark:border-dark-3 bg-gray-1/30">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-dark-6">{card.label}</p>
                        <p className="mt-2 text-2xl font-black text-dark dark:text-white">{card.val}</p>
                        <p className="mt-1 text-xs text-primary font-medium">{card.sub}</p>
                      </div>
                    ))}
                    
                    <div className="md:col-span-2 lg:col-span-4 mt-4">
                       <h5 className="mb-4 text-sm font-bold text-dark dark:text-white">{t.topOrgs}</h5>
                       {discountAnalytics.top_organizations?.length ? (
                         <div className="grid gap-3 md:grid-cols-2">
                            {discountAnalytics.top_organizations.map((org) => (
                              <div key={org.organization_id} className="flex items-center justify-between rounded-xl border border-stroke p-4 dark:border-dark-3">
                                 <div>
                                    <p className="text-sm font-bold text-dark dark:text-white">{org.organization_name}</p>
                                    <p className="text-[10px] text-dark-6 opacity-60 font-mono">{org.organization_id}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-lg font-bold text-primary">{org.total_redemptions}</p>
                                    <p className="text-[10px] text-dark-6 uppercase font-bold">Redemptions</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="rounded-xl bg-gray-1 p-8 text-center text-sm text-dark-6">{t.noAnalytics}</div>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className="py-20 text-center text-dark-6">{t.noAnalytics}</div>
               )}
            </ShowcaseSection>
          </div>
        )}

        {/* Main Table */}
        {!isCreating && !editingDiscount && (
          <ShowcaseSection title={(t.breadcrumb.split("/").pop() || "Discounts").trim()} className="!p-6">
            {!canManage && <div className="mb-6 rounded-xl bg-gray-1 p-4 text-xs text-dark-6 font-medium">{t.viewOnly}</div>}
            
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-6 border-b border-stroke pb-4 text-xs font-bold uppercase tracking-widest text-dark-6 dark:border-dark-3">
                  <div className="col-span-2 px-4">{t.tableDiscount}</div>
                  <div className="px-4 text-center">{t.tableType}</div>
                  <div className="px-4 text-center">{t.tableValue}</div>
                  <div className="px-4 text-center">{t.tableValidity}</div>
                  <div className="px-4 text-right">{t.tableActions}</div>
                </div>

                <div className="divide-y divide-stroke dark:divide-dark-3">
                  {loadingDiscounts ? (
                    <div className="py-20 text-center text-dark-6">{t.loading}</div>
                  ) : discounts.length > 0 ? (
                    discounts.map((discount) => {
                      const isActive = discount.status === "ACTIVE";
                      return (
                        <div key={discount.id} className="grid grid-cols-6 items-center py-5 text-sm transition hover:bg-gray-1/30 dark:hover:bg-dark-3/10">
                          <div className="col-span-2 px-4">
                            <p className="font-bold text-dark dark:text-white">{discount.name}</p>
                            <p className="mt-0.5 text-[10px] text-dark-6 line-clamp-1 opacity-70">{discount.description || "—"}</p>
                          </div>
                          <div className="px-4 text-center">
                            <span className="rounded-lg bg-gray-2 px-2.5 py-1 text-[10px] font-bold text-dark-6 dark:bg-dark-3 uppercase tracking-tight">
                               {discount.discount_type}
                            </span>
                          </div>
                          <div className="px-4 text-center font-black text-primary text-base">
                             {discount.discount_value}
                             <span className="ml-0.5 text-[10px] opacity-60">
                               {discount.discount_type === 'PERCENTAGE' ? '%' : ''}
                             </span>
                          </div>
                          <div className="px-4 text-center">
                            <p className="text-[10px] font-bold text-dark-6 uppercase">{discount.valid_from?.split('T')[0] || '—'}</p>
                            <p className="text-[10px] font-medium text-dark-6 opacity-40">to</p>
                            <p className="text-[10px] font-bold text-dark-6 uppercase">{discount.valid_until?.split('T')[0] || '—'}</p>
                          </div>
                          <div className="flex justify-end gap-2 px-4">
                             <span className={`mr-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {isActive ? t.statusActive : t.statusInactive}
                             </span>
                             <button
                               onClick={() => { setEditingDiscountId(discount.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                               className="rounded-lg border border-stroke p-2 text-dark-6 transition hover:border-primary hover:text-primary dark:border-dark-3 dark:bg-dark-2"
                             >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                             </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-20 text-center text-dark-6">{t.noDiscounts}</div>
                  )}
                </div>
              </div>
            </div>
          </ShowcaseSection>
        )}
      </div>
    </ActorRouteGuard>
  );
}
