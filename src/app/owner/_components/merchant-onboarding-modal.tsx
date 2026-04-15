"use client";

import { useEffect, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useLanguage } from "@/contexts/language-context";
import {
  ADMIN_PASSWORD_MAX_LEN,
  MERCHANT_DESCRIPTION_MAX_LEN,
  MERCHANT_SLUG_MAX_LEN,
  ORGANIZATION_NAME_MAX_LEN,
} from "@/lib/merchant-onboarding-limits";
import type { MerchantOnboardingErrorDisplay } from "@/lib/merchant-onboarding-errors";
import { stripHtmlTagsFromPlainText } from "@/lib/strip-html-plain-text";
import {
  validateMerchantOnboardingForm,
  type MerchantOnboardingFormInput,
} from "@/lib/merchant-onboarding-validation";

export type MerchantOnboardingData = MerchantOnboardingFormInput;

type MerchantOnboardingModalProps = {
  onClose: () => void;
  onSubmit: (data: MerchantOnboardingData) => void;
  loading?: boolean;
  /** Error del API (mensaje + campo si se pudo inferir). */
  apiError?: MerchantOnboardingErrorDisplay | null;
  /** Llamar al editar cualquier campo para limpiar el error del servidor en el padre. */
  onClearApiError?: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
      {message}
    </p>
  );
}

function slugify(value: string) {
  let s = value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > MERCHANT_SLUG_MAX_LEN) {
    s = s.slice(0, MERCHANT_SLUG_MAX_LEN).replace(/-+$/g, "");
  }
  return s;
}

export function MerchantOnboardingModal({
  onClose,
  onSubmit,
  loading = false,
  apiError = null,
  onClearApiError,
}: MerchantOnboardingModalProps) {
  const { language } = useLanguage();
  const modalRef = useClickOutside<HTMLDivElement>(() => !loading && onClose());
  const [clientFieldError, setClientFieldError] = useState<{
    field: keyof MerchantOnboardingData;
    message: string;
  } | null>(null);
  /** Si el usuario edita slug u org. a mano, dejan de seguir al nombre automáticamente. */
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [orgNameManuallyEdited, setOrgNameManuallyEdited] = useState(false);
  const [form, setForm] = useState<MerchantOnboardingData>({
    country_code: "EC",
    merchant_name: "",
    merchant_slug: "",
    merchant_description: "",
    merchant_logo_url: "",
    merchant_type: "RESTAURANT",
    organization_name: "",
    fiscal_id: "",
    company_legal_name: "",
    website: "",
    industry: "",
    admin_full_name: "",
    admin_email: "",
    admin_phone: "",
    admin_username: "",
    admin_password: "",
  });

  const touchField = () => {
    setClientFieldError(null);
    if (apiError) onClearApiError?.();
  };

  const isFieldInvalid = (name: keyof MerchantOnboardingData) =>
    clientFieldError?.field === name || apiError?.field === name;

  const messageForField = (name: keyof MerchantOnboardingData): string | undefined => {
    if (clientFieldError?.field === name) return clientFieldError.message;
    if (apiError?.field === name) return apiError.message;
    return undefined;
  };

  const fieldClass = (name: keyof MerchantOnboardingData) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-dark-2 dark:text-white ${
      isFieldInvalid(name)
        ? "border-red-500 bg-red-50/40 focus:border-red-600 focus:outline-none dark:border-red-500 dark:bg-red-950/20"
        : "border-stroke bg-white focus:border-primary focus:outline-none dark:border-dark-3"
    }`;

  const fieldWrapId = (name: keyof MerchantOnboardingData) => `merchant-onboarding-field-${name}`;

  useEffect(() => {
    const target = clientFieldError?.field ?? apiError?.field;
    if (!target || loading) return;
    const el = document.getElementById(fieldWrapId(target));
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [clientFieldError, apiError, loading]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3 shrink-0">
          <h2 className="text-heading-5 font-semibold text-dark dark:text-white">Onboard merchant</h2>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Crea la organization técnica, el merchant y su admin inicial en una sola operación.
          </p>
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const result = validateMerchantOnboardingForm(form, language);
            if (!result.ok) {
              setClientFieldError({ field: result.field, message: result.message });
              return;
            }
            setClientFieldError(null);
            onSubmit(form);
          }}
          className="flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">Merchant</h3>

                <div id={fieldWrapId("country_code")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Country code</label>
                  <input
                    type="text"
                    name="country_code"
                    maxLength={2}
                    autoComplete="country"
                    aria-invalid={isFieldInvalid("country_code")}
                    value={form.country_code}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        country_code: e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2),
                      }));
                    }}
                    className={fieldClass("country_code")}
                  />
                  <FieldError message={messageForField("country_code")} />
                </div>

                <div id={fieldWrapId("merchant_name")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Merchant name</label>
                  <input
                    type="text"
                    name="merchant_name"
                    aria-invalid={isFieldInvalid("merchant_name")}
                    value={form.merchant_name}
                    onChange={(e) => {
                      touchField();
                      const name = stripHtmlTagsFromPlainText(e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        merchant_name: name,
                        merchant_slug: slugManuallyEdited ? prev.merchant_slug : slugify(name),
                        organization_name: orgNameManuallyEdited
                          ? prev.organization_name
                          : `${name} Merchant Org`,
                      }));
                    }}
                    className={fieldClass("merchant_name")}
                  />
                  <FieldError message={messageForField("merchant_name")} />
                </div>

                <div id={fieldWrapId("merchant_slug")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Merchant slug</label>
                  <p className="mb-1.5 text-xs text-dark-6 dark:text-dark-6">
                    {language === "es"
                      ? `Se genera solo a partir del nombre; puedes editarlo (máx. ${MERCHANT_SLUG_MAX_LEN} caracteres).`
                      : `Generated from the name; you can edit it (max ${MERCHANT_SLUG_MAX_LEN} characters).`}
                  </p>
                  <input
                    type="text"
                    name="merchant_slug"
                    maxLength={MERCHANT_SLUG_MAX_LEN}
                    aria-invalid={isFieldInvalid("merchant_slug")}
                    value={form.merchant_slug}
                    onChange={(e) => {
                      touchField();
                      setSlugManuallyEdited(true);
                      const next = slugify(e.target.value);
                      setForm((prev) => ({ ...prev, merchant_slug: next }));
                      if (next === "") setSlugManuallyEdited(false);
                    }}
                    className={fieldClass("merchant_slug")}
                  />
                  <FieldError message={messageForField("merchant_slug")} />
                </div>

                <div id={fieldWrapId("merchant_type")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Merchant type</label>
                  <input
                    type="text"
                    aria-invalid={isFieldInvalid("merchant_type")}
                    value={form.merchant_type}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        merchant_type: stripHtmlTagsFromPlainText(e.target.value),
                      }));
                    }}
                    className={fieldClass("merchant_type")}
                  />
                  <FieldError message={messageForField("merchant_type")} />
                </div>

                <div id={fieldWrapId("merchant_description")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Description</label>
                  <textarea
                    rows={3}
                    maxLength={MERCHANT_DESCRIPTION_MAX_LEN}
                    aria-invalid={isFieldInvalid("merchant_description")}
                    value={form.merchant_description}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        merchant_description: stripHtmlTagsFromPlainText(e.target.value).slice(
                          0,
                          MERCHANT_DESCRIPTION_MAX_LEN,
                        ),
                      }));
                    }}
                    className={fieldClass("merchant_description")}
                  />
                  <FieldError message={messageForField("merchant_description")} />
                  <p className="mt-1 text-[10px] text-dark-6">
                    {(form.merchant_description ?? "").length}/{MERCHANT_DESCRIPTION_MAX_LEN}
                  </p>
                </div>

                <div id={fieldWrapId("merchant_logo_url")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Logo URL</label>
                  <input
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    name="merchant_logo_url"
                    aria-invalid={isFieldInvalid("merchant_logo_url")}
                    value={form.merchant_logo_url}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        merchant_logo_url: stripHtmlTagsFromPlainText(e.target.value),
                      }));
                    }}
                    className={fieldClass("merchant_logo_url")}
                  />
                  <FieldError message={messageForField("merchant_logo_url")} />
                </div>

                <div id={fieldWrapId("organization_name")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Organization name</label>
                  <input
                    type="text"
                    maxLength={ORGANIZATION_NAME_MAX_LEN}
                    aria-invalid={isFieldInvalid("organization_name")}
                    value={form.organization_name}
                    onChange={(e) => {
                      touchField();
                      setOrgNameManuallyEdited(true);
                      setForm((prev) => ({
                        ...prev,
                        organization_name: stripHtmlTagsFromPlainText(e.target.value).slice(
                          0,
                          ORGANIZATION_NAME_MAX_LEN,
                        ),
                      }));
                    }}
                    className={fieldClass("organization_name")}
                  />
                  <FieldError message={messageForField("organization_name")} />
                </div>

                <div className="rounded-xl border border-stroke bg-gray-1/50 p-4 dark:border-dark-3 dark:bg-dark-2/60">
                  <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white">Merchant organization info</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div id={fieldWrapId("fiscal_id")}>
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Fiscal ID</label>
                      <input
                        type="text"
                        aria-invalid={isFieldInvalid("fiscal_id")}
                        value={form.fiscal_id}
                        onChange={(e) => {
                          touchField();
                          setForm((prev) => ({
                            ...prev,
                            fiscal_id: stripHtmlTagsFromPlainText(e.target.value),
                          }));
                        }}
                        className={fieldClass("fiscal_id")}
                        placeholder="Opcional"
                      />
                      <FieldError message={messageForField("fiscal_id")} />
                    </div>

                    <div id={fieldWrapId("company_legal_name")}>
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Company legal name</label>
                      <input
                        type="text"
                        aria-invalid={isFieldInvalid("company_legal_name")}
                        value={form.company_legal_name}
                        onChange={(e) => {
                          touchField();
                          setForm((prev) => ({
                            ...prev,
                            company_legal_name: stripHtmlTagsFromPlainText(e.target.value),
                          }));
                        }}
                        className={fieldClass("company_legal_name")}
                        placeholder="Opcional"
                      />
                      <FieldError message={messageForField("company_legal_name")} />
                    </div>

                    <div id={fieldWrapId("website")}>
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Website</label>
                      <input
                        type="text"
                        inputMode="url"
                        autoComplete="off"
                        name="website"
                        aria-invalid={isFieldInvalid("website")}
                        value={form.website}
                        onChange={(e) => {
                          touchField();
                          setForm((prev) => ({
                            ...prev,
                            website: stripHtmlTagsFromPlainText(e.target.value),
                          }));
                        }}
                        className={fieldClass("website")}
                        placeholder="https://..."
                      />
                      <FieldError message={messageForField("website")} />
                    </div>

                    <div id={fieldWrapId("industry")}>
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Industry</label>
                      <input
                        type="text"
                        aria-invalid={isFieldInvalid("industry")}
                        value={form.industry}
                        onChange={(e) => {
                          touchField();
                          setForm((prev) => ({
                            ...prev,
                            industry: stripHtmlTagsFromPlainText(e.target.value),
                          }));
                        }}
                        className={fieldClass("industry")}
                        placeholder="Opcional"
                      />
                      <FieldError message={messageForField("industry")} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">Admin inicial</h3>

                <div id={fieldWrapId("admin_full_name")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin full name</label>
                  <input
                    type="text"
                    name="admin_full_name"
                    aria-invalid={isFieldInvalid("admin_full_name")}
                    value={form.admin_full_name}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        admin_full_name: stripHtmlTagsFromPlainText(e.target.value),
                      }));
                    }}
                    className={fieldClass("admin_full_name")}
                  />
                  <FieldError message={messageForField("admin_full_name")} />
                </div>

                <div id={fieldWrapId("admin_email")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin email</label>
                  <input
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    name="admin_email"
                    aria-invalid={isFieldInvalid("admin_email")}
                    value={form.admin_email}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        admin_email: stripHtmlTagsFromPlainText(e.target.value),
                      }));
                    }}
                    className={fieldClass("admin_email")}
                  />
                  <FieldError message={messageForField("admin_email")} />
                </div>

                <div id={fieldWrapId("admin_phone")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin phone</label>
                  <input
                    type="text"
                    inputMode="tel"
                    aria-invalid={isFieldInvalid("admin_phone")}
                    value={form.admin_phone}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        admin_phone: stripHtmlTagsFromPlainText(e.target.value),
                      }));
                    }}
                    className={fieldClass("admin_phone")}
                  />
                  <FieldError message={messageForField("admin_phone")} />
                </div>

                <div id={fieldWrapId("admin_username")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin username</label>
                  <input
                    type="text"
                    autoComplete="username"
                    aria-invalid={isFieldInvalid("admin_username")}
                    value={form.admin_username}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        admin_username: stripHtmlTagsFromPlainText(e.target.value),
                      }));
                    }}
                    className={fieldClass("admin_username")}
                  />
                  <FieldError message={messageForField("admin_username")} />
                </div>

                <div id={fieldWrapId("admin_password")}>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin temporary password</label>
                  <p className="mb-1.5 text-xs text-dark-6 dark:text-dark-6">
                    {language === "es"
                      ? "Opcional. Si la rellenas: 8–128 caracteres, al menos una letra y un número (misma regla que el API). Si la dejas vacía, el back puede generar una contraseña."
                      : "Optional. If set: 8–128 characters, at least one letter and one number (same as API). Leave empty for the server to generate one."}
                  </p>
                  <input
                    type="password"
                    autoComplete="new-password"
                    maxLength={ADMIN_PASSWORD_MAX_LEN}
                    aria-invalid={isFieldInvalid("admin_password")}
                    value={form.admin_password}
                    onChange={(e) => {
                      touchField();
                      setForm((prev) => ({
                        ...prev,
                        admin_password: e.target.value.slice(0, ADMIN_PASSWORD_MAX_LEN),
                      }));
                    }}
                    className={fieldClass("admin_password")}
                    placeholder="Opcional"
                  />
                  <FieldError message={messageForField("admin_password")} />
                </div>
              </div>
            </div>

            {apiError && !apiError.field ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50/60 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                  {apiError.message}
                </p>
              </div>
            ) : null}
            {loading ? (
              <div className="mt-4 px-1">
                <p className="text-sm text-dark-6 dark:text-dark-6">Creando merchant…</p>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-stroke p-5 dark:border-dark-3 bg-gray-50/50 dark:bg-dark-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-70 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70 transition-all shadow-sm"
            >
              Crear merchant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
