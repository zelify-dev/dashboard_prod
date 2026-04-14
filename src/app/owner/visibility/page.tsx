"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import {
  assignDiscountToOrganization,
  assignMerchantToOrganization,
  listDiscountVisibilityOrganizations,
  listMerchantDiscounts,
  listMerchantVisibilityOrganizations,
  listNetworkDiscountMerchants,
  removeDiscountVisibility,
  removeMerchantVisibility,
  updateDiscountVisibility,
  updateMerchantVisibility,
  listAdminVisibilityRelations,
  type GlobalVisibilityRelation,
  type DiscountMerchant,
  type MerchantDiscount,
  type VisibilityOrganizationRelation,
} from "@/lib/discounts-api";
import { listOrganizations, type OrganizationAdmin } from "@/lib/organizations-admin-api";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-EC");
}

function StatusBadge({ status, unknownLabel }: { status?: string; unknownLabel: string }) {
  const normalized = (status ?? "").toUpperCase();
  const classes =
    normalized === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : normalized === "INACTIVE"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {normalized || unknownLabel}
    </span>
  );
}

function MerchantAvatar({ merchant }: { merchant: DiscountMerchant }) {
  if (merchant.logo_url) {
    return (
      <img
        src={merchant.logo_url}
        alt={merchant.name}
        className="h-11 w-11 rounded-2xl border border-stroke object-cover dark:border-dark-3"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
      {merchant.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function OrganizationAvatar({ organization }: { organization: OrganizationAdmin }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      {organization.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function OwnerVisibilityPage() {
  const t = useLanguageTranslations({
    es: {
      pageTitle: "Propietario / Visibilidad",
      workspaceTitle: "Espacio de visibilidad",
      step1Title: "1. Elige un comercio",
      step1Helper: "Revisa rápidamente dónde ya está visible y qué descuentos tiene disponibles.",
      searchMerchant: "Buscar comercio",
      noMerchants: "No hay comercios que coincidan con la búsqueda.",
      step2Title: "2. Elige una organización cliente",
      step2Helper: "Selecciona visualmente la organización sobre la que vas a publicar visibilidad.",
      searchOrganization: "Buscar organización",
      noOrganizations: "No hay organizaciones que coincidan con la búsqueda.",
      organizationCountryFallback: "Sin país",
      organizationTypeBadge: "CLIENTE",
      scopesLabel: "alcances",
      moreScopes: (count: number) => `+${count} más`,
      step3Title: "3. Revisa el estado actual",
      step3Helper: "El panel te muestra al instante si el comercio y el descuento ya están visibles para la organización elegida.",
      statusMerchantTitle: "Estado del comercio",
      statusMerchantLinked: (merchant: string, org: string) => `${merchant} ya está relacionado con ${org}.`,
      statusMerchantNotVisible: "Aún no visible para esta organización.",
      statusDiscountTitle: "Estado del descuento",
      statusDiscountVisible: (discount: string, org: string) => `${discount} ya está visible para ${org}.`,
      statusDiscountNotVisible: "Este descuento todavía no está visible para la organización.",
      statusDiscountSelect: "Selecciona un descuento.",
      assignMerchant: "Hacer visible comercio",
      assignDiscount: "Hacer visible descuento",
      merchantNeededForDiscount:
        "Primero activa la visibilidad del comercio para esta organización. Después podrás publicar el descuento.",
      currentContext: "Contexto actual",
      selectedOrganization: "Organización elegida",
      activeMerchant: "Comercio activo",
      noSlug: "Sin slug",
      activeDiscount: "Descuento activo",
      noDiscountSelected: "Sin seleccionar",
      orgsWithMerchant: "Organizaciones con comercio visible",
      orgsWithDiscount: "Organizaciones con descuento visible",
      howToRead: "Cómo leer esta pantalla",
      howToReadText:
        "`Comercio visible` significa que la organización ya puede ver ese comercio. `Descuento visible` significa que, además, esa organización ya puede consumir una promo específica de ese comercio.",
      step4Title: "4. Descuentos del comercio",
      step4Helper: "Elige visualmente qué descuento quieres inspeccionar o publicar.",
      searchDiscount: "Buscar descuento",
      noDiscounts: "Este comercio no tiene descuentos que coincidan con la búsqueda.",
      loadingMerchantRelations: "Cargando relaciones del comercio...",
      loadingDiscountRelations: "Cargando relaciones del descuento...",
      noMerchantRelations: "Este comercio todavía no tiene organizaciones visibles.",
      noDiscountRelations: "Este descuento todavía no tiene organizaciones visibles.",
      selectDiscountFirst: "Selecciona primero un descuento del comercio.",
      selectedOrganizationBadge: "Organización seleccionada",
      activate: "Activar",
      deactivate: "Desactivar",
      remove: "Eliminar",
      statusTypeLabel: "Tipo",
      createdLabel: "Creado",
      noOrganizationSelected: "Selecciona una organización para revisar visibilidad.",
      noDiscountSelectedText: "Selecciona un descuento del comercio para revisar su publicación.",
      merchantVisible: (merchant: string, org: string) =>
        `${merchant} ya está visible activamente para ${org}.`,
      merchantInactive: (merchant: string, org: string) =>
        `${merchant} tiene relación creada con ${org}, pero hoy está inactivo.`,
      merchantNotVisible: (merchant: string, org: string) =>
        `${merchant} todavía no está visible para ${org}.`,
      discountVisible: (discount: string, org: string) =>
        `${discount} ya está visible activamente para ${org}.`,
      discountInactive: (discount: string, org: string) =>
        `${discount} tiene relación creada con ${org}, pero hoy está inactivo.`,
      discountNotVisible: (discount: string, org: string) =>
        `${discount} todavía no está visible para ${org}.`,
      messageMerchantAssigned: "Comercio visible para la organización.",
      messageMerchantAssignError: "No se pudo asignar el comercio.",
      messageDiscountAssigned: "Descuento visible para la organización.",
      messageDiscountAssignError: "No se pudo asignar el descuento.",
      messageMerchantStatus: (status: "ACTIVE" | "INACTIVE") =>
        `Comercio ${status === "ACTIVE" ? "activado" : "desactivado"} para la organización.`,
      messageMerchantStatusError: "No se pudo actualizar la visibilidad del comercio.",
      messageMerchantDelete: "Visibilidad del comercio eliminada.",
      messageMerchantDeleteError: "No se pudo eliminar la visibilidad del comercio.",
      messageDiscountStatus: (status: "ACTIVE" | "INACTIVE") =>
        `Descuento ${status === "ACTIVE" ? "activado" : "desactivado"} para la organización.`,
      messageDiscountStatusError: "No se pudo actualizar la visibilidad del descuento.",
      messageDiscountDelete: "Visibilidad del descuento eliminada.",
      messageDiscountDeleteError: "No se pudo eliminar la visibilidad del descuento.",
      unknownStatus: "DESCONOCIDO",
    },
    en: {
      pageTitle: "Owner / Visibility",
      workspaceTitle: "Visibility workspace",
      step1Title: "1. Choose a merchant",
      step1Helper: "Quickly review where it is visible and what discounts are available.",
      searchMerchant: "Search merchant",
      noMerchants: "No merchants match your search.",
      step2Title: "2. Choose a client organization",
      step2Helper: "Select the organization where you want to publish visibility.",
      searchOrganization: "Search organization",
      noOrganizations: "No organizations match your search.",
      organizationCountryFallback: "No country",
      organizationTypeBadge: "CLIENT",
      scopesLabel: "scopes",
      moreScopes: (count: number) => `+${count} more`,
      step3Title: "3. Review current status",
      step3Helper: "This panel shows whether the merchant and discount are visible for the selected organization.",
      statusMerchantTitle: "Merchant status",
      statusMerchantLinked: (merchant: string, org: string) => `${merchant} is already linked to ${org}.`,
      statusMerchantNotVisible: "Not visible for this organization yet.",
      statusDiscountTitle: "Discount status",
      statusDiscountVisible: (discount: string, org: string) => `${discount} is already visible for ${org}.`,
      statusDiscountNotVisible: "This discount is not visible for the organization yet.",
      statusDiscountSelect: "Select a discount.",
      assignMerchant: "Make merchant visible",
      assignDiscount: "Make discount visible",
      merchantNeededForDiscount:
        "First make the merchant visible for this organization. Then you can publish the discount.",
      currentContext: "Current context",
      selectedOrganization: "Selected organization",
      activeMerchant: "Active merchant",
      noSlug: "No slug",
      activeDiscount: "Active discount",
      noDiscountSelected: "Not selected",
      orgsWithMerchant: "Orgs with merchant visible",
      orgsWithDiscount: "Orgs with discount visible",
      howToRead: "How to read this screen",
      howToReadText:
        "`Merchant visible` means the organization can see that merchant. `Discount visible` means the organization can also consume a specific promotion from that merchant.",
      step4Title: "4. Merchant discounts",
      step4Helper: "Pick which discount you want to inspect or publish.",
      searchDiscount: "Search discount",
      noDiscounts: "This merchant has no discounts that match your search.",
      loadingMerchantRelations: "Loading merchant relations...",
      loadingDiscountRelations: "Loading discount relations...",
      noMerchantRelations: "This merchant has no visible organizations yet.",
      noDiscountRelations: "This discount has no visible organizations yet.",
      selectDiscountFirst: "Select a merchant discount first.",
      selectedOrganizationBadge: "Selected organization",
      activate: "Activate",
      deactivate: "Deactivate",
      remove: "Remove",
      statusTypeLabel: "Type",
      createdLabel: "Created",
      noOrganizationSelected: "Select an organization to review visibility.",
      noDiscountSelectedText: "Select a merchant discount to review publishing status.",
      merchantVisible: (merchant: string, org: string) => `${merchant} is visible for ${org}.`,
      merchantInactive: (merchant: string, org: string) =>
        `${merchant} is linked to ${org}, but currently inactive.`,
      merchantNotVisible: (merchant: string, org: string) =>
        `${merchant} is not visible for ${org} yet.`,
      discountVisible: (discount: string, org: string) => `${discount} is visible for ${org}.`,
      discountInactive: (discount: string, org: string) =>
        `${discount} is linked to ${org}, but currently inactive.`,
      discountNotVisible: (discount: string, org: string) =>
        `${discount} is not visible for ${org} yet.`,
      messageMerchantAssigned: "Merchant visible for the organization.",
      messageMerchantAssignError: "Could not assign the merchant.",
      messageDiscountAssigned: "Discount visible for the organization.",
      messageDiscountAssignError: "Could not assign the discount.",
      messageMerchantStatus: (status: "ACTIVE" | "INACTIVE") =>
        `Merchant ${status === "ACTIVE" ? "activated" : "deactivated"} for the organization.`,
      messageMerchantStatusError: "Could not update merchant visibility.",
      messageMerchantDelete: "Merchant visibility removed.",
      messageMerchantDeleteError: "Could not remove merchant visibility.",
      messageDiscountStatus: (status: "ACTIVE" | "INACTIVE") =>
        `Discount ${status === "ACTIVE" ? "activated" : "deactivated"} for the organization.`,
      messageDiscountStatusError: "Could not update discount visibility.",
      messageDiscountDelete: "Discount visibility removed.",
      messageDiscountDeleteError: "Could not remove discount visibility.",
      unknownStatus: "UNKNOWN",
    },
  });
  const [organizations, setOrganizations] = useState<OrganizationAdmin[]>([]);
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [merchantSearch, setMerchantSearch] = useState("");
  const [discountSearch, setDiscountSearch] = useState("");
  const [discounts, setDiscounts] = useState<MerchantDiscount[]>([]);
  const [merchantRelations, setMerchantRelations] = useState<VisibilityOrganizationRelation[]>([]);
  const [discountRelations, setDiscountRelations] = useState<VisibilityOrganizationRelation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [merchantRelationsLoading, setMerchantRelationsLoading] = useState(false);
  const [discountRelationsLoading, setDiscountRelationsLoading] = useState(false);
  const [workingKey, setWorkingKey] = useState("");
  const [activeTab, setActiveTab] = useState<"assign" | "directory">("assign");
  const [globalRelations, setGlobalRelations] = useState<GlobalVisibilityRelation[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [globalPage, setGlobalPage] = useState(1);
  const [globalTotalPages, setGlobalTotalPages] = useState(1);
  const [globalSearch, setGlobalSearch] = useState("");
  const [localSearch, setLocalSearch] = useState(""); // Nuevo: para el input inmediato
  const [globalStatus, setGlobalStatus] = useState("");

  useEffect(() => {
    if (activeTab === "directory") {
      setLoadingGlobal(true);
      listAdminVisibilityRelations(globalPage, 50, globalSearch, globalStatus)
        .then((data) => {
          setGlobalRelations(data.relations);
          setGlobalTotalPages(data.meta.pages);
        })
        .catch(console.error)
        .finally(() => setLoadingGlobal(false));
    }
  }, [activeTab, globalPage, globalSearch, globalStatus]);

  // Filtrado Híbrido: Si el backend no filtra, el frontend lo hace para asegurar el UX
  const filteredGlobalRelations = useMemo(() => {
    if (!globalSearch) return globalRelations;
    const term = globalSearch.toLowerCase();
    return globalRelations.filter(rel => 
      rel.merchant_name.toLowerCase().includes(term) || 
      rel.organization_name.toLowerCase().includes(term) ||
      rel.merchant_id.toLowerCase().includes(term) ||
      rel.organization_id.toLowerCase().includes(term)
    );
  }, [globalRelations, globalSearch]);

  const handleDirectorySearch = () => {
    const term = localSearch.trim();
    setGlobalPage(1);
    setGlobalSearch(term);
  };

  // Reset page when filtering status (immediate)
  useEffect(() => {
    setGlobalPage(1);
  }, [globalStatus]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [orgs, networkMerchants] = await Promise.all([
          listOrganizations(),
          listNetworkDiscountMerchants({ countryCode: "EC" }),
        ]);
        const clientOrganizations = orgs.filter(
          (organization) =>
            organization.status?.toUpperCase() === "ACTIVE" &&
            organization.organization_type === "CLIENT"
        );
        setOrganizations(clientOrganizations);
        setMerchants(networkMerchants);
        if (clientOrganizations[0]?.id) setSelectedOrgId(clientOrganizations[0].id);
        if (networkMerchants[0]?.id) setSelectedMerchantId(networkMerchants[0].id);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedMerchantId) {
        setDiscounts([]);
        setMerchantRelations([]);
        setDiscountRelations([]);
        setSelectedDiscountId("");
        return;
      }

      setMerchantRelationsLoading(true);
      try {
        const [merchantDiscountRows, merchantVisibilityRows] = await Promise.all([
          listMerchantDiscounts(selectedMerchantId).catch(() => []),
          listMerchantVisibilityOrganizations(selectedMerchantId).catch(() => []),
        ]);
        setDiscounts(merchantDiscountRows);
        setMerchantRelations(merchantVisibilityRows);
        setSelectedDiscountId((current) =>
          current && merchantDiscountRows.some((discount) => discount.id === current)
            ? current
            : merchantDiscountRows[0]?.id ?? ""
        );
      } finally {
        setMerchantRelationsLoading(false);
      }
    };

    void run();
  }, [selectedMerchantId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedDiscountId) {
        setDiscountRelations([]);
        return;
      }

      setDiscountRelationsLoading(true);
      try {
        const rows = await listDiscountVisibilityOrganizations(selectedDiscountId).catch(() => []);
        setDiscountRelations(rows);
      } finally {
        setDiscountRelationsLoading(false);
      }
    };

    void run();
  }, [selectedDiscountId]);

  const filteredMerchants = useMemo(() => {
    const term = merchantSearch.trim().toLowerCase();
    if (!term) return merchants;
    return merchants.filter((merchant) =>
      [merchant.name, merchant.slug, merchant.country_code, merchant.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [merchantSearch, merchants]);

  const filteredOrganizations = useMemo(() => {
    const term = organizationSearch.trim().toLowerCase();
    if (!term) return organizations;
    return organizations.filter((organization) =>
      [
        organization.name,
        organization.status,
        organization.country,
        organization.company_legal_name,
        organization.industry,
        ...(organization.scopes ?? []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [organizationSearch, organizations]);

  const filteredDiscounts = useMemo(() => {
    const term = discountSearch.trim().toLowerCase();
    if (!term) return discounts;
    return discounts.filter((discount) =>
      [discount.name, discount.description, discount.discount_type, discount.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [discountSearch, discounts]);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  );

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  const selectedDiscount = useMemo(
    () => discounts.find((discount) => discount.id === selectedDiscountId) ?? null,
    [discounts, selectedDiscountId]
  );

  const selectedMerchantRelation = useMemo(
    () => merchantRelations.find((relation) => relation.organization.id === selectedOrgId) ?? null,
    [merchantRelations, selectedOrgId]
  );

  const selectedDiscountRelation = useMemo(
    () => discountRelations.find((relation) => relation.organization.id === selectedOrgId) ?? null,
    [discountRelations, selectedOrgId]
  );

  const merchantVisibleOrgIds = useMemo(
    () => new Set(merchantRelations.map((relation) => relation.organization.id)),
    [merchantRelations]
  );

  const currentVisibilitySummary = useMemo(() => {
    if (!selectedOrganization) {
      return {
        merchant: t.noOrganizationSelected,
        discount: t.noOrganizationSelected,
      };
    }

    const merchantText = selectedMerchantRelation
      ? selectedMerchantRelation.status === "ACTIVE"
        ? t.merchantVisible(selectedMerchant?.name ?? "—", selectedOrganization.name)
        : t.merchantInactive(selectedMerchant?.name ?? "—", selectedOrganization.name)
      : t.merchantNotVisible(selectedMerchant?.name ?? "—", selectedOrganization.name);

    const discountText = !selectedDiscount
      ? t.noDiscountSelectedText
      : selectedDiscountRelation
        ? selectedDiscountRelation.status === "ACTIVE"
          ? t.discountVisible(selectedDiscount.name, selectedOrganization.name)
          : t.discountInactive(selectedDiscount.name, selectedOrganization.name)
        : t.discountNotVisible(selectedDiscount.name, selectedOrganization.name);

    return { merchant: merchantText, discount: discountText };
  }, [
    selectedOrganization,
    selectedMerchantRelation,
    selectedDiscountRelation,
    selectedMerchant,
    selectedDiscount,
  ]);

  const refreshMerchantRelations = async () => {
    if (!selectedMerchantId) return;
    const rows = await listMerchantVisibilityOrganizations(selectedMerchantId).catch(() => []);
    setMerchantRelations(rows);
  };

  const refreshDiscountRelations = async () => {
    if (!selectedDiscountId) return;
    const rows = await listDiscountVisibilityOrganizations(selectedDiscountId).catch(() => []);
    setDiscountRelations(rows);
  };

  const handleAssignMerchant = async () => {
    if (!selectedOrgId || !selectedMerchantId) return;
    setWorkingKey(`assign-merchant-${selectedOrgId}-${selectedMerchantId}`);
    setMessage("");
    try {
      await assignMerchantToOrganization(selectedOrgId, selectedMerchantId);
      await refreshMerchantRelations();
      setMessage(t.messageMerchantAssigned);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.messageMerchantAssignError);
    } finally {
      setWorkingKey("");
    }
  };

  const handleAssignDiscount = async () => {
    if (!selectedOrgId || !selectedDiscountId) return;
    setWorkingKey(`assign-discount-${selectedOrgId}-${selectedDiscountId}`);
    setMessage("");
    try {
      await assignDiscountToOrganization(selectedOrgId, selectedDiscountId);
      await refreshDiscountRelations();
      setMessage(t.messageDiscountAssigned);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.messageDiscountAssignError);
    } finally {
      setWorkingKey("");
    }
  };

  const handleMerchantVisibilityStatus = async (
    orgId: string,
    status: "ACTIVE" | "INACTIVE"
  ) => {
    if (!selectedMerchantId) return;
    setWorkingKey(`merchant-status-${orgId}-${status}`);
    setMessage("");
    try {
      await updateMerchantVisibility(orgId, selectedMerchantId, status);
      await refreshMerchantRelations();
      setMessage(t.messageMerchantStatus(status));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.messageMerchantStatusError);
    } finally {
      setWorkingKey("");
    }
  };

  const handleMerchantVisibilityDelete = async (orgId: string) => {
    if (!selectedMerchantId) return;
    setWorkingKey(`merchant-delete-${orgId}`);
    setMessage("");
    try {
      await removeMerchantVisibility(orgId, selectedMerchantId);
      await refreshMerchantRelations();
      setMessage(t.messageMerchantDelete);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.messageMerchantDeleteError);
    } finally {
      setWorkingKey("");
    }
  };

  const handleDiscountVisibilityStatus = async (
    orgId: string,
    status: "ACTIVE" | "INACTIVE"
  ) => {
    if (!selectedDiscountId) return;
    setWorkingKey(`discount-status-${orgId}-${status}`);
    setMessage("");
    try {
      await updateDiscountVisibility(orgId, selectedDiscountId, status);
      await refreshDiscountRelations();
      setMessage(t.messageDiscountStatus(status));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.messageDiscountStatusError);
    } finally {
      setWorkingKey("");
    }
  };

  const handleDiscountVisibilityDelete = async (orgId: string) => {
    if (!selectedDiscountId) return;
    setWorkingKey(`discount-delete-${orgId}`);
    setMessage("");
    try {
      await removeDiscountVisibility(orgId, selectedDiscountId);
      await refreshDiscountRelations();
      setMessage(t.messageDiscountDelete);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.messageDiscountDeleteError);
    } finally {
      setWorkingKey("");
    }
  };

  return (
    <ActorRouteGuard actor="owner">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName={t.pageTitle} />

        <div className="rounded-lg border border-stroke bg-white px-2 py-2 shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("assign")}
              className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "assign"
                  ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-3"
              }`}
            >
              Asignación Rápida
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "directory"
                  ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-3"
              }`}
            >
              Directorio de Visibilidad
            </button>
          </div>
        </div>

        {activeTab === "assign" && (
          <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
            <div className="mb-8 flex flex-col gap-2 border-b border-stroke pb-6 dark:border-dark-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Asignación de Visibilidad de Comercio</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Herramienta operativa para el enlace directo entre comercios financieros y organizaciones cliente.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* COLUMN 1: MERCHANT */}
              <div className="relative flex flex-col space-y-4 rounded-lg bg-slate-50 p-5 border border-slate-200 dark:border-dark-3 dark:bg-dark-3/30">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3 dark:border-dark-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-xs font-bold text-white shadow-sm dark:bg-white dark:text-slate-900">1</div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">Comercio Central</h3>
                </div>
                <input
                  type="search"
                  value={merchantSearch}
                  onChange={(event) => setMerchantSearch(event.target.value)}
                  placeholder="Buscar código o nombre"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-dark-3 dark:bg-dark-2 dark:focus:ring-white dark:text-white"
                />
                <div className="h-[480px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {filteredMerchants.map((merchant) => {
                    const isSelected = merchant.id === selectedMerchantId;
                    return (
                      <button
                        key={merchant.id}
                        type="button"
                        onClick={() => setSelectedMerchantId(merchant.id)}
                        className={`w-full rounded-md border p-3 text-left transition-all ${
                          isSelected
                            ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900 dark:border-white dark:bg-dark-2 dark:ring-white"
                            : "border-slate-200 bg-white hover:border-slate-400 dark:border-dark-3 dark:bg-dark-2"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MerchantAvatar merchant={merchant} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{merchant.name}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">{merchant.slug ?? '—'}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COLUMN 2: ORGANIZATION */}
              <div className={`relative flex flex-col space-y-4 rounded-lg bg-slate-50 p-5 border border-slate-200 dark:border-dark-3 dark:bg-dark-3/30 transition-all duration-200 ${!selectedMerchantId ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3 dark:border-dark-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-xs font-bold text-white shadow-sm dark:bg-white dark:text-slate-900">2</div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">Organización Cliente</h3>
                </div>
                <input
                  type="search"
                  value={organizationSearch}
                  onChange={(event) => setOrganizationSearch(event.target.value)}
                  placeholder="Buscar organización"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-dark-3 dark:bg-dark-2 dark:focus:ring-white dark:text-white"
                />
                <div className="h-[480px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {filteredOrganizations.map((organization) => {
                    const isSelected = organization.id === selectedOrgId;
                    return (
                      <button
                        key={organization.id}
                        type="button"
                        onClick={() => setSelectedOrgId(organization.id)}
                        className={`w-full rounded-md border p-3 text-left transition-all ${
                          isSelected
                            ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900 dark:border-white dark:bg-dark-2 dark:ring-white"
                            : "border-slate-200 bg-white hover:border-slate-400 dark:border-dark-3 dark:bg-dark-2"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <OrganizationAvatar organization={organization} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{organization.name}</p>
                            <span className="mt-1.5 inline-flex rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">CLIENTE</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COLUMN 3: ACTION & DISCOUNTS */}
              <div className={`relative flex flex-col space-y-4 rounded-lg bg-slate-50 p-5 border border-slate-200 dark:border-dark-3 dark:bg-dark-3/30 transition-all duration-200 ${(!selectedOrgId || !selectedMerchantId) ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3 dark:border-dark-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-xs font-bold text-white shadow-sm dark:bg-white dark:text-slate-900">3</div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">Gestión de Visibilidad</h3>
                </div>
                
                <div className="flex flex-col gap-6 overflow-y-auto h-[480px] pr-2 scrollbar-thin">
                  {/* Visibilidad del Comercio */}
                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-3 dark:bg-dark-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Enlace Principal</p>
                    {selectedMerchantRelation ? (
                      <div className="space-y-4">
                        <div className="rounded-md bg-slate-50 border border-slate-200 p-3 dark:bg-dark-3/50 dark:border-dark-3 flex items-center justify-between">
                           <span className="text-sm font-medium text-slate-900 dark:text-white">
                             {selectedMerchantRelation.status === "ACTIVE" ? "Operativo" : "Suspendido"}
                           </span>
                           <StatusBadge status={selectedMerchantRelation.status} unknownLabel={t.unknownStatus} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            {selectedMerchantRelation.status !== "ACTIVE" && (
                              <button onClick={() => handleMerchantVisibilityStatus(selectedOrgId, "ACTIVE")} disabled={workingKey.includes("merchant-status")} className="flex-1 rounded-md bg-slate-900 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Activar Enlace</button>
                            )}
                            {selectedMerchantRelation.status === "ACTIVE" && (
                              <button onClick={() => handleMerchantVisibilityStatus(selectedOrgId, "INACTIVE")} disabled={workingKey.includes("merchant-status")} className="flex-1 rounded-md border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors dark:border-slate-600 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800">Suspender</button>
                            )}
                          </div>
                          <button onClick={() => handleMerchantVisibilityDelete(selectedOrgId)} disabled={workingKey.includes("merchant-delete")} className="w-full rounded-md border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">Remover Enlace</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-center py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Asignación requerida para transaccionar.</p>
                        <button onClick={handleAssignMerchant} disabled={workingKey.includes("assign-merchant")} className="w-full rounded-md bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Ejecutar Asignación</button>
                      </div>
                    )}
                  </div>

                  {/* Visibilidad de Descuentos */}
                  <div className={`flex flex-col gap-3 transition-opacity duration-200 ${merchantVisibleOrgIds.has(selectedOrgId) ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                     <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-2">Catálogo de Descuentos</p>
                     
                     <div className="space-y-2">
                       {filteredDiscounts.length > 0 ? filteredDiscounts.map(discount => {
                          const isSelected = selectedDiscountId === discount.id;
                          
                          return (
                            <div key={discount.id} className={`rounded-md border bg-white p-3 transition-all ${isSelected ? 'border-slate-900 ring-1 ring-slate-900 shadow-sm dark:bg-dark-2 dark:border-white dark:ring-white' : 'border-slate-200 dark:border-dark-3 dark:bg-dark-2'}`} onClick={() => setSelectedDiscountId(discount.id)}>
                              <p className="text-[13px] font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline">{discount.name}</p>
                              
                              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isSelected ? 'max-h-48 mt-3 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}>
                                <div className="pt-3 border-t border-slate-200 dark:border-dark-3 space-y-2">
                                  {selectedDiscountRelation ? (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex gap-2">
                                        {selectedDiscountRelation.status !== "ACTIVE" && (
                                          <button onClick={() => handleDiscountVisibilityStatus(selectedOrgId, "ACTIVE")} className="flex-1 rounded border border-slate-300 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-dark-3 dark:text-slate-300">Activar</button>
                                        )}
                                        {selectedDiscountRelation.status === "ACTIVE" && (
                                          <button onClick={() => handleDiscountVisibilityStatus(selectedOrgId, "INACTIVE")} className="flex-1 rounded border border-slate-300 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-dark-3 dark:text-slate-300">Suspender</button>
                                        )}
                                      </div>
                                      <button onClick={() => handleDiscountVisibilityDelete(selectedOrgId)} className="w-full rounded text-[11px] uppercase tracking-wide font-bold text-red-600 hover:underline py-1 dark:text-red-400">Remover</button>
                                    </div>
                                  ) : (
                                    <button onClick={handleAssignDiscount} className="w-full rounded-md border border-slate-900 bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900 dark:border-white dark:hover:bg-slate-200">Asignar Promoción</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                       }) : (
                         <p className="text-xs text-slate-500 italic text-center py-3 bg-white rounded-md border border-dashed border-slate-300 dark:bg-dark-2 dark:border-dark-3">Catálogo vacío.</p>
                       )}
                     </div>
                  </div>
                  
                  {message && <div className="mt-2 rounded-md bg-slate-100 p-2 text-center text-xs text-slate-800 border border-slate-200 font-medium dark:bg-dark-3 dark:border-dark-3 dark:text-slate-300">{message}</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "directory" && (
          <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
            <div className="mb-6 flex items-center justify-between border-b border-stroke pb-6 dark:border-dark-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Directorio Global de Visibilidad</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Consolidado general de operaciones asignadas en el ecosistema.</p>
              </div>
              <button 
                onClick={() => {
                  setGlobalPage(1);
                  setLocalSearch("");
                  setGlobalSearch("");
                  setGlobalStatus("");
                  setLoadingGlobal(true);
                  listAdminVisibilityRelations(1, 50, "", "")
                    .then((data) => {
                      setGlobalRelations(data.relations);
                      setGlobalTotalPages(data.meta.pages);
                    })
                    .catch(console.error)
                    .finally(() => setLoadingGlobal(false));
                }}
                disabled={loadingGlobal} 
                className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:bg-dark-2 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-dark-3"
              >
                {loadingGlobal ? "Sincronizando..." : "Limpiar y Recargar"}
              </button>
            </div>

            {/* FILTERS BAR */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 max-w-xl gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Escribe el nombre del comercio o cliente..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDirectorySearch()}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:focus:ring-white"
                  />
                </div>
                <button
                  onClick={handleDirectorySearch}
                  className="rounded-md bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Buscar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado:</span>
                <select
                  value={globalStatus}
                  onChange={(e) => setGlobalStatus(e.target.value)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-dark-3 dark:bg-dark-3 dark:text-slate-300 dark:focus:ring-white"
                >
                  <option value="">Todos los estados</option>
                  <option value="ACTIVE">Activos (Visibles)</option>
                  <option value="INACTIVE">Inactivos (Suspendidos)</option>
                </select>
              </div>
            </div>

            {globalSearch && (
              <div className="mb-4 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-md border border-slate-100 dark:bg-dark-3/30 dark:border-dark-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Mostrando resultados para: <span className="font-bold text-slate-900 dark:text-white">"{globalSearch}"</span>
                </p>
                <button 
                  onClick={() => { setLocalSearch(""); setGlobalSearch(""); }} 
                  className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-dark-3">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-dark-3">
                  <tr className="border-b border-slate-200 dark:border-dark-3">
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Comercio</th>
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Organización Cliente</th>
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Estado del Enlace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-3">
                  {loadingGlobal && globalRelations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">Cargando relaciones...</td>
                    </tr>
                  ) : filteredGlobalRelations.length > 0 ? (
                    filteredGlobalRelations.map((rel, idx) => (
                      <tr key={`${rel.merchant_id}-${rel.organization_id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-dark-3/50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{rel.merchant_name}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">CLIENTE</span>
                            <p className="font-medium text-slate-900 dark:text-white">{rel.organization_name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={rel.status} unknownLabel="Desconocido" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center">
                         <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Directorio Vacío</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No hay relaciones configuradas actualmente.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {globalTotalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-dark-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Página {globalPage} de {globalTotalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGlobalPage(p => Math.max(1, p - 1))}
                    disabled={globalPage === 1 || loadingGlobal}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-dark-2 dark:text-slate-300 dark:hover:bg-dark-3"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setGlobalPage(p => Math.min(globalTotalPages, p + 1))}
                    disabled={globalPage === globalTotalPages || loadingGlobal}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-dark-2 dark:text-slate-300 dark:hover:bg-dark-3"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ActorRouteGuard>
  );
}
