"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredOrganization, getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageOrganizationActor } from "@/lib/dashboard-routing";
import {
  cancelOrganizationClaim,
  listOrganizationClaims,
  listOrganizationRedemptions,
  type OrganizationClaim,
  type OrganizationRedemption,
} from "@/lib/discounts-api";

export default function OrganizationClaimsPage() {
  const orgId = getStoredOrganization()?.id ?? "";
  const userId = getStoredUser()?.id ?? "";
  const canManageClaims = canManageOrganizationActor(getStoredRoles());
  const [claims, setClaims] = useState<OrganizationClaim[]>([]);
  const [redemptions, setRedemptions] = useState<OrganizationRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!orgId || !userId) return;
      setLoading(true);
      setError("");
      try {
        const [claimRows, redemptionRows] = await Promise.all([
          listOrganizationClaims(orgId, userId),
          listOrganizationRedemptions(orgId, { user_id: userId }),
        ]);
        setClaims(claimRows);
        setRedemptions(redemptionRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el uso del programa.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [orgId, userId]);

  const pendingClaims = useMemo(
    () => claims.filter((claim) => claim.status === "PENDING" && !claim.canceled && !claim.used),
    [claims]
  );

  const handleCancelClaim = async (claimId: string) => {
    if (!orgId || !userId) return;
    const confirmed = window.confirm("¿Cancelar este claim?");
    if (!confirmed) return;
    try {
      const updated = await cancelOrganizationClaim(orgId, claimId, userId);
      setClaims((current) =>
        current.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                canceled: true,
                status: (updated.claim?.status ?? (updated.status as string) ?? "CANCELED"),
                can_retry: updated.claim?.can_retry ?? (updated.can_retry as boolean | undefined) ?? claim.can_retry,
              }
            : claim
        )
      );
      setMessage("Claim cancelado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el claim.");
    }
  };

  return (
    <ActorRouteGuard actor="organization">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Organization / Claims" />

        <div className="grid gap-4 md:grid-cols-3">
          <ShowcaseSection title="Claims" className="!p-6">
            <p className="text-3xl font-semibold text-dark dark:text-white">{claims.length}</p>
            <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">Claims totales del usuario dentro del programa.</p>
          </ShowcaseSection>
          <ShowcaseSection title="Pendientes" className="!p-6">
            <p className="text-3xl font-semibold text-dark dark:text-white">{pendingClaims.length}</p>
            <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">Claims aún no usados ni cancelados.</p>
          </ShowcaseSection>
          <ShowcaseSection title="Redemptions" className="!p-6">
            <p className="text-3xl font-semibold text-dark dark:text-white">{redemptions.length}</p>
            <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">Uso confirmado del beneficio para este usuario.</p>
          </ShowcaseSection>
        </div>

        {message ? <p className="text-sm text-green-700 dark:text-green-400">{message}</p> : null}
        {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}

        <ShowcaseSection title="Mis claims" className="!p-6">
          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80"><th className="px-4 py-3 font-medium text-dark dark:text-white">Claim</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Coupon</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Discount</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Acción</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando claims...</td></tr> : claims.length > 0 ? claims.map((claim) => (
                  <tr key={claim.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                    <td className="px-4 py-3 text-dark dark:text-white"><p className="font-medium">{claim.claim_code}</p><p className="text-xs text-dark-6 dark:text-dark-6">{claim.id}</p></td>
                    <td className="px-4 py-3 text-dark dark:text-white">{claim.coupon?.code ?? "—"}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{claim.coupon?.discount?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{claim.status}</td>
                    <td className="px-4 py-3">
                      {canManageClaims && !claim.canceled && !claim.used && !claim.expired ? (
                        <button type="button" onClick={() => handleCancelClaim(claim.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 dark:border-red-900/40 dark:text-red-300">Cancelar</button>
                      ) : <span className="text-xs text-dark-6 dark:text-dark-6">Sin acción</span>}
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay claims todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Mis redemptions" className="!p-6">
          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80"><th className="px-4 py-3 font-medium text-dark dark:text-white">Merchant</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Discount</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Fecha</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={3} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando redemptions...</td></tr> : redemptions.length > 0 ? redemptions.map((item) => (
                  <tr key={item.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                    <td className="px-4 py-3 text-dark dark:text-white">{item.coupon?.discount?.merchant?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{item.coupon?.discount?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{new Date(item.redeemed_at).toLocaleString("es-EC")}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay redemptions todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
