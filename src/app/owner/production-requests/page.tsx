"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getStoredRoles } from "@/lib/auth-api";
import { isOwner } from "@/app/organization/teams/_constants/team-roles";

type RequestType = {
  id: string;
  organization_id: string;
  company_name: string;
  ruc: string;
  requested_environment: string;
  other_environment?: string;
  responsible_name: string;
  responsible_position: string;
  responsible_email: string;
  responsible_phone: string;
  responsible_signature: string;
  uat_approved: boolean;
  dashboard_reviewed: boolean;
  authorized_pass: boolean;
  validity_accepted: boolean;
  observations: string;
  user_requests: Array<{
    fullName: string;
    email: string;
    position: string;
    role: string;
    phone: string;
  }>;
  require_2fa: boolean;
  auth_methods: {
    email: boolean;
    sms: boolean;
    authenticator: boolean;
  };
  url_commerce: string;
  url_privacy: string;
  url_whatsapp?: string;
  webhook_type?: string;
  webhooks_erp?: string;
  webhook_client_url?: string;
  webhook_client_events?: string;
  webhook_zelify_requested?: boolean;
  sandbox_payment_apis?: string;
  created_at: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export default function OwnerProductionRequestsPage() {
  const router = useRouter();
  const roles = getStoredRoles();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestType | null>(null);

  // Review states
  const [reviewObservations, setReviewObservations] = useState("");
  const [updating, setUpdating] = useState(false);

  const isUserOwner = isOwner(roles);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/production-requests");
      if (res.ok) {
        const data = await res.json();
        // Sort by latest created_at
        const sorted = data.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRequests(sorted);
      }
    } catch (err) {
      console.error("Error fetching production requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserOwner) {
      router.replace("/");
      return;
    }
    void fetchRequests();
  }, [isUserOwner, router]);

  const handleOpenRequest = (req: RequestType) => {
    setSelectedRequest(req);
    setReviewObservations(req.observations || "");
  };

  const handleCloseRequest = () => {
    setSelectedRequest(null);
  };

  const handleUpdateStatus = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedRequest) return;
    setUpdating(true);

    try {
      // 1. Update the request status
      const reqRes = await fetch(`/api/production-requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          observations: reviewObservations,
        }),
      });

      if (!reqRes.ok) {
        throw new Error("Failed to update production request status");
      }

      const updatedRequest = await reqRes.json();

      // 2. If approved, automatically transition the organization's environment to PRODUCTION
      if (status === "APPROVED") {
        const envRes = await fetch(
          `/api/organizations/${selectedRequest.organization_id}/environment`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ environment: "PRODUCTION" }),
          }
        );

        if (!envRes.ok) {
          toast.warning("La solicitud fue aprobada, pero falló la activación del ambiente productivo.");
        } else {
          toast.success("Solicitud aprobada y ambiente activado en Producción.");
        }
      } else {
        toast.success("Solicitud rechazada con éxito.");
      }

      // Close details and refresh list
      setSelectedRequest(null);
      void fetchRequests();
    } catch (err) {
      console.error("Error processing approval/rejection", err);
      toast.error("Ocurrió un error al procesar el estado.");
    } finally {
      setUpdating(false);
    }
  };

  if (!isUserOwner) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 pb-12 relative">
      <Breadcrumb pageName="Solicitudes de Producción (Owner)" />

      {loading ? (
        <p className="text-dark-6 dark:text-dark-6">Cargando solicitudes...</p>
      ) : (
        <div className="rounded-lg border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <div className="px-6 py-4 border-b border-stroke dark:border-dark-3 flex justify-between items-center">
            <h2 className="text-base font-semibold text-dark dark:text-white">
              Bandeja de Solicitudes de Paso a Producción
            </h2>
            <button
              onClick={fetchRequests}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Actualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3 bg-gray-2 dark:bg-dark-2">
                  <th className="px-6 py-3 font-semibold text-dark dark:text-white">Organización</th>
                  <th className="px-6 py-3 font-semibold text-dark dark:text-white">RUC</th>
                  <th className="px-6 py-3 font-semibold text-dark dark:text-white">Fecha de Solicitud</th>
                  <th className="px-6 py-3 font-semibold text-dark dark:text-white">Responsable</th>
                  <th className="px-6 py-3 font-semibold text-dark dark:text-white">Estado</th>
                  <th className="px-6 py-3 font-semibold text-dark dark:text-white text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-dark-3">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-dark-6 dark:text-dark-6">
                      No hay solicitudes de paso a producción registradas.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10">
                      <td className="px-6 py-4 font-medium text-dark dark:text-white">
                        {req.company_name}
                      </td>
                      <td className="px-6 py-4 text-dark dark:text-white">{req.ruc}</td>
                      <td className="px-6 py-4 text-dark-6 dark:text-dark-6">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-dark dark:text-white">{req.responsible_name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : req.status === "REJECTED"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                          }`}
                        >
                          {req.status === "APPROVED"
                            ? "APROBADA"
                            : req.status === "REJECTED"
                              ? "RECHAZADA"
                              : "PENDIENTE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenRequest(req)}
                          className="rounded border border-stroke px-3 py-1.5 text-xs font-semibold text-dark hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                        >
                          Revisar detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer deslizable para el detalle de la solicitud */}
      {selectedRequest && (
        <div className="fixed inset-0 z-9999 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={handleCloseRequest}
          />

          {/* Panel */}
          <div className="relative w-full max-w-[650px] bg-white dark:bg-gray-dark shadow-2xl h-full flex flex-col z-10 transition-transform overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stroke dark:border-dark-3 flex justify-between items-center bg-gray-2 dark:bg-dark-2">
              <div>
                <h3 className="text-base font-semibold text-dark dark:text-white">
                  Detalle de Solicitud de Producción
                </h3>
                <span className="text-xs text-dark-6 dark:text-dark-6">ID: {selectedRequest.id}</span>
              </div>
              <button
                onClick={handleCloseRequest}
                className="text-dark hover:text-primary dark:text-white dark:hover:text-primary font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-dark dark:text-white">
              {/* Organización & RUC */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6 border-b border-stroke dark:border-dark-3 pb-1 mb-3">
                  1. Organización
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-dark-6">Nombre</span>
                    <span className="font-medium">{selectedRequest.company_name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-dark-6">RUC / ID</span>
                    <span className="font-medium">{selectedRequest.ruc}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-dark-6">Ambiente Solicitado</span>
                    <span className="font-medium">
                      {selectedRequest.requested_environment === "Otro"
                        ? `Otro: ${selectedRequest.other_environment}`
                        : "Producción"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Responsable */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6 border-b border-stroke dark:border-dark-3 pb-1 mb-3">
                  2. Responsable de Solicitud
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-dark-6">Nombre</span>
                    <span className="font-medium">{selectedRequest.responsible_name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-dark-6">Cargo</span>
                    <span className="font-medium">{selectedRequest.responsible_position}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-dark-6">Correo</span>
                    <span className="font-medium">{selectedRequest.responsible_email}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-dark-6">Teléfono</span>
                    <span className="font-medium">{selectedRequest.responsible_phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-semibold text-dark-6">Firma Electrónica</span>
                    <span className="font-mono bg-gray-2 dark:bg-dark-2 px-2 py-1 rounded inline-block text-xs border border-stroke dark:border-dark-3">
                      {selectedRequest.responsible_signature}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmación y Checklist */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6 border-b border-stroke dark:border-dark-3 pb-1 mb-3">
                  3. Declaraciones de Aceptación
                </h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Pruebas UAT completadas y aprobadas.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Configuración del dashboard revisada.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Autorización expresa para paso a producción.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Validez legal y operativa aceptada para transacciones productivas.</span>
                  </li>
                </ul>
                {selectedRequest.observations && (
                  <div className="mt-3">
                    <span className="block text-xs font-semibold text-dark-6">Observaciones de la Org</span>
                    <p className="bg-slate-50 dark:bg-dark-2 p-2 rounded text-xs border border-stroke dark:border-dark-3">
                      {selectedRequest.observations}
                    </p>
                  </div>
                )}
              </div>

              {/* Usuarios solicitados */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6 border-b border-stroke dark:border-dark-3 pb-1 mb-3">
                  4. Usuarios Solicitados
                </h4>
                <div className="overflow-hidden border border-stroke dark:border-dark-3 rounded text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-2 dark:bg-dark-2">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Nombre</th>
                        <th className="px-3 py-2 font-semibold">Correo</th>
                        <th className="px-3 py-2 font-semibold">Rol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke dark:divide-dark-3">
                      {selectedRequest.user_requests.map((u, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{u.fullName}</td>
                          <td className="px-3 py-2">{u.email}</td>
                          <td className="px-3 py-2 font-medium">{u.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seguridad */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6 border-b border-stroke dark:border-dark-3 pb-1 mb-3">
                  5. Seguridad
                </h4>
                <div className="text-xs">
                  <div>
                    Requerir doble factor (2FA):{" "}
                    <span className="font-semibold">{selectedRequest.require_2fa ? "SÍ" : "NO"}</span>
                  </div>
                  {selectedRequest.require_2fa && (
                    <div className="mt-2 flex gap-3 text-dark-6">
                      {selectedRequest.auth_methods.email && (
                        <span className="bg-slate-100 dark:bg-dark-2 px-2 py-0.5 rounded border border-stroke dark:border-dark-3">
                          Email
                        </span>
                      )}
                      {selectedRequest.auth_methods.sms && (
                        <span className="bg-slate-100 dark:bg-dark-2 px-2 py-0.5 rounded border border-stroke dark:border-dark-3">
                          SMS
                        </span>
                      )}
                      {selectedRequest.auth_methods.authenticator && (
                        <span className="bg-slate-100 dark:bg-dark-2 px-2 py-0.5 rounded border border-stroke dark:border-dark-3">
                          App Autenticadora
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* URLs y Parámetros específicos */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6 border-b border-stroke dark:border-dark-3 pb-1 mb-3">
                  6. Enlaces y Parámetros Técnicos
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="block font-semibold text-dark-6">Página web del comercio:</span>
                    <a
                      href={selectedRequest.url_commerce}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium break-all"
                    >
                      {selectedRequest.url_commerce}
                    </a>
                  </div>
                  <div>
                    <span className="block font-semibold text-dark-6">Políticas de Privacidad / Datos:</span>
                    <a
                      href={selectedRequest.url_privacy}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium break-all"
                    >
                      {selectedRequest.url_privacy}
                    </a>
                  </div>
                  {selectedRequest.url_whatsapp && (
                    <div>
                      <span className="block font-semibold text-dark-6">Acceso WhatsApp Business API:</span>
                      <p className="font-medium font-mono break-all bg-slate-50 dark:bg-dark-2 px-2 py-1 rounded border border-stroke dark:border-dark-3 w-full whitespace-pre-wrap text-xs">
                        {selectedRequest.url_whatsapp}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="block font-semibold text-dark-6">Configuración de Webhooks ERP:</span>
                    <div className="space-y-2 mt-1">
                      {/* Webhook Outbound */}
                      <div className="bg-slate-50 dark:bg-dark-2 p-2 rounded border border-stroke dark:border-dark-3">
                        <span className="block font-semibold text-[10px] uppercase text-dark-6">Webhook de Salida (A):</span>
                        {selectedRequest.webhook_client_url ? (
                          <div className="mt-1 space-y-1">
                            <div className="font-mono text-xs break-all">{selectedRequest.webhook_client_url}</div>
                            {selectedRequest.webhook_client_events && (
                              <div className="text-[10px] text-gray-500 font-medium">Eventos: {selectedRequest.webhook_client_events}</div>
                            )}
                          </div>
                        ) : selectedRequest.webhooks_erp ? (
                          <div className="font-mono text-xs break-all mt-1">{selectedRequest.webhooks_erp}</div>
                        ) : (
                          <span className="text-xs text-dark-6 italic">No provisto por el comercio</span>
                        )}
                      </div>
                      {/* Webhook Inbound */}
                      <div className="bg-slate-50 dark:bg-dark-2 p-2 rounded border border-stroke dark:border-dark-3">
                        <span className="block font-semibold text-[10px] uppercase text-dark-6">Webhook de Entrada (B):</span>
                        {selectedRequest.webhook_zelify_requested !== false ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block mt-1">
                            ✓ Solicita generar URL de endpoint y credenciales seguras.
                          </span>
                        ) : (
                          <span className="text-xs text-dark-6 italic block mt-1">No solicitado</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedRequest.sandbox_payment_apis && (
                    <div>
                      <span className="block font-semibold text-dark-6">APIs Sandbox (Botón Pago):</span>
                      <p className="bg-slate-50 dark:bg-dark-2 p-2 rounded border border-stroke dark:border-dark-3 font-mono text-[11px] whitespace-pre-wrap">
                        {selectedRequest.sandbox_payment_apis}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Aprobación / Rechazo Section */}
            <div className="p-6 border-t border-stroke dark:border-dark-3 bg-gray-2 dark:bg-dark-2 space-y-4">
              {selectedRequest.status === "PENDING" ? (
                <>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-semibold text-dark dark:text-white">
                      Observaciones de Revisión (Owner)
                    </span>
                    <textarea
                      value={reviewObservations}
                      onChange={(e) => setReviewObservations(e.target.value)}
                      placeholder="Agrega observaciones o motivos de rechazo..."
                      rows={2}
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-xs outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleUpdateStatus("REJECTED")}
                      disabled={updating}
                      className="flex-1 rounded-lg border border-rose-300 text-rose-600 px-4 py-2.5 text-xs font-semibold hover:bg-rose-50 transition disabled:opacity-50"
                    >
                      Rechazar Solicitud
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("APPROVED")}
                      disabled={updating}
                      className="flex-1 rounded-lg bg-primary text-white px-4 py-2.5 text-xs font-semibold hover:bg-opacity-95 transition disabled:opacity-50"
                    >
                      Aprobar y Habilitar
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide">
                    Esta solicitud ya fue procesada como:
                  </div>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                      selectedRequest.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                    }`}
                  >
                    {selectedRequest.status === "APPROVED" ? "APROBADA" : "RECHAZADA"}
                  </span>
                  {selectedRequest.observations && (
                    <div className="mt-3 text-left bg-white dark:bg-dark p-3 rounded border border-stroke dark:border-dark-3 text-xs">
                      <span className="font-semibold block mb-1">Observaciones previas:</span>
                      {selectedRequest.observations}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
