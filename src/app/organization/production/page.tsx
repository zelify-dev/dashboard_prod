"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredOrganization, getOrganization } from "@/lib/auth-api";

type UserRequestRow = {
  fullName: string;
  email: string;
  position: string;
  role: "Administrador" | "Operador" | "Consulta" | "Auditor";
  phone: string;
};

export default function PasoProduccionPage() {
  const router = useRouter();
  const org = getStoredOrganization();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [environment, setEnvironment] = useState<string>("SANDBOX");
  const [existingRequest, setExistingRequest] = useState<any>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [ruc, setRuc] = useState("");
  const [requestedEnvironment, setRequestedEnvironment] = useState("Producción");
  const [otherEnvironment, setOtherEnvironment] = useState("");

  const [responsibleName, setResponsibleName] = useState("");
  const [responsiblePosition, setResponsiblePosition] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [responsiblePhone, setResponsiblePhone] = useState("");
  const [responsibleSignature, setResponsibleSignature] = useState("");

  const [uatApproved, setUatApproved] = useState(false);
  const [dashboardReviewed, setDashboardReviewed] = useState(false);
  const [authorizedPass, setAuthorizedPass] = useState(false);
  const [validityAccepted, setValidityAccepted] = useState(false);
  const [observations, setObservations] = useState("");

  const [userRequests, setUserRequests] = useState<UserRequestRow[]>([
    { fullName: "", email: "", position: "", role: "Administrador", phone: "" },
  ]);

  const [require2fa, setRequire2fa] = useState<boolean>(true);


  const [urlCommerce, setUrlCommerce] = useState("");
  const [urlPrivacy, setUrlPrivacy] = useState("");
  const [urlWhatsapp, setUrlWhatsapp] = useState("");
  const [webhookClientUrl, setWebhookClientUrl] = useState("");
  const [webhookClientEvents, setWebhookClientEvents] = useState("");
  const [webhookZelifyRequested, setWebhookZelifyRequested] = useState(true);
  const [sandboxPaymentApis, setSandboxPaymentApis] = useState("");

  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  useEffect(() => {
    if (!org?.id) {
      router.replace("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Load organization details to get RUC/fiscal_id
        const detail = await getOrganization(org.id);
        if (detail) {
          setCompanyName(detail.name || org.name || "");
          setRuc(detail.fiscal_id || "");
        }

        // Load environment state
        const envRes = await fetch(`/api/organizations/${org.id}/environment`);
        if (envRes.ok) {
          const envData = await envRes.json();
          setEnvironment(envData.environment);
        }

        // Load existing request
        const reqRes = await fetch(`/api/production-requests?organization_id=${org.id}`);
        if (reqRes.ok) {
          const reqList = await reqRes.json();
          if (reqList && reqList.length > 0) {
            // Sort by latest created_at
            const sorted = reqList.sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const latest = sorted[0];
            setExistingRequest(latest);

            // Populate form if request exists
            setCompanyName(latest.company_name);
            setRuc(latest.ruc);
            setRequestedEnvironment(latest.requested_environment);
            setOtherEnvironment(latest.other_environment || "");
            setResponsibleName(latest.responsible_name);
            setResponsiblePosition(latest.responsible_position);
            setResponsibleEmail(latest.responsible_email);
            setResponsiblePhone(latest.responsible_phone);
            setResponsibleSignature(latest.responsible_signature);
            setUatApproved(latest.uat_approved);
            setDashboardReviewed(latest.dashboard_reviewed);
            setAuthorizedPass(latest.authorized_pass);
            setValidityAccepted(latest.validity_accepted);
            setObservations(latest.observations || "");
            setUserRequests(latest.user_requests || []);
            setRequire2fa(latest.require_2fa);
            setUrlCommerce(latest.url_commerce || "");
            setUrlPrivacy(latest.url_privacy || "");
            setUrlWhatsapp(latest.url_whatsapp || "");
            setWebhookClientUrl(latest.webhook_client_url || latest.webhooks_erp || "");
            setWebhookClientEvents(latest.webhook_client_events || "");
            setWebhookZelifyRequested(latest.webhook_zelify_requested !== undefined ? latest.webhook_zelify_requested : true);
            setSandboxPaymentApis(latest.sandbox_payment_apis || "");
            setDeclarationAccepted(latest.declaration_accepted);
          }
        }
      } catch (err) {
        console.error("Error loading production request data", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [org?.id, router]);

  const handleAddUserRow = () => {
    setUserRequests((current) => [
      ...current,
      { fullName: "", email: "", position: "", role: "Administrador", phone: "" },
    ]);
  };

  const handleRemoveUserRow = (index: number) => {
    if (userRequests.length === 1) return;
    setUserRequests((current) => current.filter((_, i) => i !== index));
  };

  const handleUserRowChange = (index: number, key: keyof UserRequestRow, value: string) => {
    setUserRequests((current) =>
      current.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id) return;

    if (!declarationAccepted) {
      toast.error("Debes aceptar la declaración final para continuar.");
      return;
    }

    if (!uatApproved || !dashboardReviewed || !authorizedPass || !validityAccepted) {
      toast.error("Debes confirmar todos los puntos de la sección de paso a producción.");
      return;
    }

    setSubmitting(true);

    const payload = {
      organization_id: org.id,
      company_name: companyName,
      ruc: ruc,
      requested_environment: requestedEnvironment,
      other_environment: requestedEnvironment === "Otro" ? otherEnvironment : "",
      responsible_name: responsibleName,
      responsible_position: responsiblePosition,
      responsible_email: responsibleEmail,
      responsible_phone: responsiblePhone,
      responsible_signature: responsibleSignature,
      uat_approved: uatApproved,
      dashboard_reviewed: dashboardReviewed,
      authorized_pass: authorizedPass,
      validity_accepted: validityAccepted,
      observations: observations,
      user_requests: userRequests,
      require_2fa: require2fa,
      auth_methods: { email: require2fa, sms: false, authenticator: false },
      url_commerce: urlCommerce,
      url_privacy: urlPrivacy,
      url_whatsapp: urlWhatsapp,
      webhook_client_url: webhookClientUrl,
      webhook_client_events: webhookClientEvents,
      webhook_zelify_requested: webhookZelifyRequested,
      webhooks_erp: webhookClientUrl,
      sandbox_payment_apis: sandboxPaymentApis,
      declaration_accepted: declarationAccepted,
    };

    try {
      const res = await fetch("/api/production-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setExistingRequest(data);
        toast.success("Solicitud de paso a producción enviada con éxito.");
      } else {
        toast.error("Error al enviar la solicitud. Intenta de nuevo.");
      }
    } catch (err) {
      toast.error("Ocurrió un error en el envío.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormDisabled =
    existingRequest && (existingRequest.status === "PENDING" || existingRequest.status === "APPROVED");

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[900px] p-6">
        <p className="text-dark-6 dark:text-dark-6">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 pb-12">
      <Breadcrumb pageName="Paso a Producción" />

      {/* Entorno actual badge */}
      <div className="flex items-center justify-between rounded-lg border border-stroke bg-white px-6 py-4 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-dark-6 dark:text-dark-6">
            Entorno de Organización
          </span>
          <div className="mt-1 text-lg font-semibold text-dark dark:text-white">
            {org?.name}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-dark-6 dark:text-dark-6">Estado:</span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
              environment === "PRODUCTION"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
            }`}
          >
            {environment === "PRODUCTION" ? "PRODUCCIÓN" : "SANDBOX"}
          </span>
        </div>
      </div>

      {/* Status of existing request */}
      {existingRequest ? (
        <div
          className={`rounded-lg border px-6 py-4 ${
            existingRequest.status === "APPROVED"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300"
              : existingRequest.status === "REJECTED"
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300"
          }`}
        >
          <div className="font-semibold text-sm">
            Estado de Solicitud de Producción:{" "}
            {existingRequest.status === "APPROVED"
              ? "APROBADA"
              : existingRequest.status === "REJECTED"
                ? "RECHAZADA"
                : "PENDIENTE DE REVISIÓN"}
          </div>
          <p className="mt-1 text-xs opacity-90">
            Solicitado el {new Date(existingRequest.created_at).toLocaleDateString()}
          </p>
          {existingRequest.observations && (
            <div className="mt-3 rounded border border-current/25 bg-white/40 p-3 text-xs">
              <span className="font-semibold block mb-1">Observaciones de Revisión:</span>
              {existingRequest.observations}
            </div>
          )}
          {existingRequest.status === "REJECTED" && (
            <p className="mt-3 text-xs font-medium">
              * Puedes realizar las correcciones necesarias abajo y volver a enviar el formulario.
            </p>
          )}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Información de la organización */}
        <ShowcaseSection title="1. Información de la Organización" className="!p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Nombre de la organización
              </span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isFormDisabled}
                required
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                RUC / Identificación
              </span>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                disabled={isFormDisabled}
                required
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Ambiente solicitado
              </span>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm text-dark dark:text-white">
                  <input
                    type="radio"
                    name="requestedEnv"
                    checked={requestedEnvironment === "Producción"}
                    onChange={() => setRequestedEnvironment("Producción")}
                    disabled={isFormDisabled}
                    className="h-4 w-4 accent-primary"
                  />
                  Producción
                </label>
                <label className="flex items-center gap-2 text-sm text-dark dark:text-white">
                  <input
                    type="radio"
                    name="requestedEnv"
                    checked={requestedEnvironment === "Otro"}
                    onChange={() => setRequestedEnvironment("Otro")}
                    disabled={isFormDisabled}
                    className="h-4 w-4 accent-primary"
                  />
                  Otro
                </label>
              </div>
            </div>
            {requestedEnvironment === "Otro" && (
              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-dark dark:text-white">
                  Especificar ambiente
                </span>
                <input
                  type="text"
                  value={otherEnvironment}
                  onChange={(e) => setOtherEnvironment(e.target.value)}
                  disabled={isFormDisabled}
                  required
                  className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
                />
              </label>
            )}
          </div>
        </ShowcaseSection>

        {/* Sección 2: Responsable de la solicitud */}
        <ShowcaseSection title="2. Responsable de la Solicitud" className="!p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Nombre completo
              </span>
              <input
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                disabled={isFormDisabled}
                required
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Cargo
              </span>
              <input
                type="text"
                value={responsiblePosition}
                onChange={(e) => setResponsiblePosition(e.target.value)}
                disabled={isFormDisabled}
                required
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Correo electrónico
              </span>
              <input
                type="email"
                value={responsibleEmail}
                onChange={(e) => setResponsibleEmail(e.target.value)}
                disabled={isFormDisabled}
                required
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Teléfono
              </span>
              <input
                type="tel"
                value={responsiblePhone}
                onChange={(e) => setResponsiblePhone(e.target.value)}
                disabled={isFormDisabled}
                required
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Firma (Firma electrónica de conformidad)
              </span>
              <input
                type="text"
                placeholder="Escribe tu nombre completo como firma de aceptación"
                value={responsibleSignature}
                onChange={(e) => setResponsibleSignature(e.target.value)}
                disabled={isFormDisabled}
                required
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
          </div>
        </ShowcaseSection>

        {/* Sección 3: Confirmación de paso a producción */}
        <ShowcaseSection title="3. Confirmación de Paso a Producción" className="!p-6">
          <div className="space-y-3">
            <label className="flex items-start gap-3 text-sm text-dark dark:text-white">
              <input
                type="checkbox"
                checked={uatApproved}
                onChange={(e) => setUatApproved(e.target.checked)}
                disabled={isFormDisabled}
                className="mt-1 h-4 w-4 rounded border-stroke accent-primary dark:border-dark-3"
              />
              <span>Se han realizado las pruebas UAT (User Acceptance Testing) y fueron aprobadas.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-dark dark:text-white">
              <input
                type="checkbox"
                checked={dashboardReviewed}
                onChange={(e) => setDashboardReviewed(e.target.checked)}
                disabled={isFormDisabled}
                className="mt-1 h-4 w-4 rounded border-stroke accent-primary dark:border-dark-3"
              />
              <span>La configuración del dashboard fue revisada y es correcta.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-dark dark:text-white">
              <input
                type="checkbox"
                checked={authorizedPass}
                onChange={(e) => setAuthorizedPass(e.target.checked)}
                disabled={isFormDisabled}
                className="mt-1 h-4 w-4 rounded border-stroke accent-primary dark:border-dark-3"
              />
              <span>La organización autoriza expresamente el paso al ambiente de producción.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-dark dark:text-white">
              <input
                type="checkbox"
                checked={validityAccepted}
                onChange={(e) => setValidityAccepted(e.target.checked)}
                disabled={isFormDisabled}
                className="mt-1 h-4 w-4 rounded border-stroke accent-primary dark:border-dark-3"
              />
              <span>Se acepta que las operaciones realizadas en producción tendrán total validez operativa y legal.</span>
            </label>
            <label className="block space-y-1.5 pt-2">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Observaciones adicionales
              </span>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                disabled={isFormDisabled}
                rows={3}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
          </div>
        </ShowcaseSection>

        {/* Sección 4: Solicitud de usuarios */}
        <ShowcaseSection title="4. Solicitud de Usuarios de Producción" className="!p-6">
          <p className="mb-4 text-xs text-dark-6 dark:text-dark-6">
            Detalla las cuentas iniciales a crear en el ambiente productivo.
          </p>
          <div className="overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-gray-2 dark:bg-dark-2">
                <tr>
                  <th className="px-4 py-3 font-semibold text-dark dark:text-white">Nombre completo</th>
                  <th className="px-4 py-3 font-semibold text-dark dark:text-white">Correo corporativo</th>
                  <th className="px-4 py-3 font-semibold text-dark dark:text-white">Cargo</th>
                  <th className="px-4 py-3 font-semibold text-dark dark:text-white">Rol</th>
                  <th className="px-4 py-3 font-semibold text-dark dark:text-white">Teléfono</th>
                  {!isFormDisabled && <th className="px-4 py-3 text-center"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-dark-3">
                {userRequests.map((row, index) => (
                  <tr key={index}>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.fullName}
                        onChange={(e) => handleUserRowChange(index, "fullName", e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="w-full rounded border border-stroke bg-white px-2.5 py-1.5 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="email"
                        value={row.email}
                        onChange={(e) => handleUserRowChange(index, "email", e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="w-full rounded border border-stroke bg-white px-2.5 py-1.5 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.position}
                        onChange={(e) => handleUserRowChange(index, "position", e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="w-full rounded border border-stroke bg-white px-2.5 py-1.5 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.role}
                        onChange={(e) => handleUserRowChange(index, "role", e.target.value)}
                        disabled={isFormDisabled}
                        className="w-full rounded border border-stroke bg-white px-2 py-1.5 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Operador">Operador</option>
                        <option value="Consulta">Consulta</option>
                        <option value="Auditor">Auditor</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="tel"
                        value={row.phone}
                        onChange={(e) => handleUserRowChange(index, "phone", e.target.value)}
                        disabled={isFormDisabled}
                        required
                        className="w-full rounded border border-stroke bg-white px-2.5 py-1.5 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
                      />
                    </td>
                    {!isFormDisabled && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveUserRow(index)}
                          disabled={userRequests.length === 1}
                          className="text-rose-500 hover:text-rose-600 disabled:opacity-40"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isFormDisabled && (
            <button
              type="button"
              onClick={handleAddUserRow}
              className="mt-3 rounded border border-stroke px-4 py-2 text-xs font-semibold text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
            >
              Añadir usuario
            </button>
          )}
        </ShowcaseSection>

        {/* Sección 5: Configuración de seguridad */}
        <ShowcaseSection title="5. Configuración de Seguridad" className="!p-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 text-sm font-semibold text-dark dark:text-white">
              <input
                type="checkbox"
                checked={require2fa === true}
                onChange={(e) => setRequire2fa(e.target.checked)}
                disabled={isFormDisabled}
                className="mt-1 h-4 w-4 rounded border-stroke accent-primary dark:border-dark-3"
              />
              <span>¿Se requiere autenticación de doble factor (2FA) por correo electrónico?</span>
            </label>
          </div>
        </ShowcaseSection>

        {/* Sección 6: Datos específicos del canal y pruebas */}
        <ShowcaseSection title="6. Parámetros Técnicos y Enlaces del Comercio" className="!p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                URL de la página web del comercio
              </span>
              <input
                type="url"
                value={urlCommerce}
                onChange={(e) => setUrlCommerce(e.target.value)}
                disabled={isFormDisabled}
                required
                placeholder="https://tucomercio.com"
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                URL de Políticas de Privacidad y Tratamiento de Datos
              </span>
              <input
                type="url"
                value={urlPrivacy}
                onChange={(e) => setUrlPrivacy(e.target.value)}
                disabled={isFormDisabled}
                required
                placeholder="https://tucomercio.com/privacidad"
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                Accesos WhatsApp Business API (Envío de Mensajería)
              </span>
              <textarea
                value={urlWhatsapp}
                onChange={(e) => setUrlWhatsapp(e.target.value)}
                disabled={isFormDisabled}
                rows={3}
                placeholder="Ingresa tokens, credenciales, números autorizados o URL del proveedor de mensajería (ej. Twilio, Meta Developer Console)"
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
            {/* Subsección A: Webhook Outbound */}
            <div className="rounded-xl border border-stroke bg-slate-50/30 p-5 dark:border-dark-3 dark:bg-dark-2/20 space-y-4 sm:col-span-2">
              <div>
                <h4 className="text-sm font-semibold text-dark dark:text-white">
                  A. Endpoint de Webhook propio del Comercio (Opcional)
                </h4>
                <p className="text-xs text-dark-6 mt-1">
                  Si tu ERP o sistema de facturación ya dispone de un webhook configurado para recibir confirmaciones de pago, indica la URL aquí para integrarnos y enviarte las notificaciones de transacciones.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="block text-xs font-semibold text-dark-6">
                    URL de tu Webhook receptor
                  </span>
                  <input
                    type="url"
                    value={webhookClientUrl}
                    onChange={(e) => setWebhookClientUrl(e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="https://api.tucomercio.com/v1/webhooks/zelify"
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="block text-xs font-semibold text-dark-6">
                    Eventos a suscribir (Separados por comas)
                  </span>
                  <input
                    type="text"
                    value={webhookClientEvents}
                    onChange={(e) => setWebhookClientEvents(e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="payment.success, payment.failed, refund.created"
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
                  />
                </label>
              </div>
            </div>

            {/* Subsección B: Webhook Inbound */}
            <div className="rounded-xl border border-stroke bg-slate-50/30 p-5 dark:border-dark-3 dark:bg-dark-2/20 space-y-4 sm:col-span-2">
              <div>
                <h4 className="text-sm font-semibold text-dark dark:text-white">
                  B. Enviar avisos de tu sistema hacia Zelify (Tu ERP / Sistema → Zelify)
                </h4>
                <p className="text-xs text-dark-6 mt-1">
                  Si tu ERP o sistema de facturación necesita enviar de vuelta información, actualizaciones de stock o confirmaciones a Zelify, marca esta opción para solicitar credenciales exclusivas.
                </p>
              </div>
              <label className="flex items-start gap-3 text-sm font-semibold text-dark dark:text-white">
                <input
                  type="checkbox"
                  checked={webhookZelifyRequested}
                  onChange={(e) => setWebhookZelifyRequested(e.target.checked)}
                  disabled={isFormDisabled}
                  className="mt-1 h-4 w-4 rounded border-stroke accent-primary dark:border-dark-3"
                />
                <span>Solicitar dirección (URL de endpoint) de Zelify y credenciales de seguridad (Client ID / Secret) para que mi ERP envíe datos a Zelify.</span>
              </label>
              {webhookZelifyRequested && (
                <div className="rounded border border-stroke bg-white dark:border-dark-3 dark:bg-dark-2 p-3 text-xs text-dark-6 leading-5">
                  * Al aprobarse esta solicitud en producción, se te proveerá el endpoint de recepción y las llaves de seguridad en el panel de credenciales del dashboard para autenticar el envío desde tu ERP.
                </div>
              )}
            </div>

            {/* APIs Sandbox y WhatsApp */}
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-xs font-semibold text-dark dark:text-white">
                APIs de Sandbox del botón de pago (URLs para pruebas)
              </span>
              <textarea
                value={sandboxPaymentApis}
                onChange={(e) => setSandboxPaymentApis(e.target.value)}
                disabled={isFormDisabled}
                rows={3}
                placeholder="URLs de endpoints de prueba de tu pasarela para completado del flujo de sandbox"
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark"
              />
            </label>
          </div>
        </ShowcaseSection>

        {/* Sección 7: Declaración */}
        <ShowcaseSection title="7. Declaración de Conformidad" className="!p-6">
          <div className="space-y-4">
            <p className="text-xs leading-5 text-dark-6 dark:text-dark-6">
              La organización confirma que la información proporcionada es correcta y solicita la habilitación del ambiente de producción y la creación de las credenciales indicadas. Asimismo, reconoce que los usuarios creados serán responsables del uso de sus accesos y de las operaciones realizadas desde el dashboard.
            </p>
            <label className="flex items-start gap-3 text-sm font-semibold text-dark dark:text-white">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                disabled={isFormDisabled}
                className="mt-1 h-4 w-4 rounded border-stroke accent-primary dark:border-dark-3"
              />
              <span>Confirmo y acepto la declaración indicada anteriormente.</span>
            </label>
          </div>
        </ShowcaseSection>

        {/* Botón de envío */}
        {!isFormDisabled && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {submitting ? "Enviando solicitud..." : "Enviar solicitud de producción"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
