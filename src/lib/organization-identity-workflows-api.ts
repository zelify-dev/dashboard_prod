import { AuthError, fetchWithAuth } from "@/lib/auth-api";

export type IdentityWorkflowDocumentType =
  | "identity_document"
  | "driver_license"
  | "passport";

export type IdentityWorkflowBiometryMethod = "selfie_photo" | "selfie_video";

export type IdentityWorkflowItem = {
  id: string;
  organization_id: string;
  name: string;
  document_type: IdentityWorkflowDocumentType;
  biometry_method: IdentityWorkflowBiometryMethod;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type WorkflowApiShape = {
  id: string;
  organization_id: string;
  name: string;
  document_type?: IdentityWorkflowDocumentType;
  biometry_method?: IdentityWorkflowBiometryMethod;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  config?: {
    ocr?: {
      document_type?: IdentityWorkflowDocumentType;
    };
    biometry?: {
      method?: IdentityWorkflowBiometryMethod;
    };
  };
};

type ListWorkflowsResponse = {
  workflows?: WorkflowApiShape[];
  items?: WorkflowApiShape[];
};

export type IdentityWorkflowUpsertPayload = {
  name: string;
  document_type: IdentityWorkflowDocumentType;
  biometry_method: IdentityWorkflowBiometryMethod;
  is_active?: boolean;
};

function buildWorkflowPayload(payload: IdentityWorkflowUpsertPayload) {
  return {
    name: payload.name,
    config: {
      ocr: {
        document_type: payload.document_type,
      },
      biometry: {
        method: payload.biometry_method,
      },
    },
    ...(payload.is_active == null ? {} : { is_active: payload.is_active }),
  };
}

function parseWorkflow(input: WorkflowApiShape): IdentityWorkflowItem {
  return {
    id: input.id,
    organization_id: input.organization_id,
    name: input.name,
    document_type:
      input.document_type ??
      input.config?.ocr?.document_type ??
      "identity_document",
    biometry_method:
      input.biometry_method ??
      input.config?.biometry?.method ??
      "selfie_photo",
    is_active: input.is_active === true,
    created_at: input.created_at,
    updated_at: input.updated_at,
  };
}

function parseWorkflowList(data: unknown): IdentityWorkflowItem[] {
  if (Array.isArray(data)) {
    return data.map((item) => parseWorkflow(item as WorkflowApiShape));
  }
  const parsed = data as ListWorkflowsResponse;
  if (Array.isArray(parsed.workflows)) {
    return parsed.workflows.map(parseWorkflow);
  }
  if (Array.isArray(parsed.items)) {
    return parsed.items.map(parseWorkflow);
  }
  return [];
}

function parseWorkflowPayload(data: unknown): IdentityWorkflowItem {
  if (data && typeof data === "object" && "workflow" in data) {
    return parseWorkflow((data as { workflow: WorkflowApiShape }).workflow);
  }
  return parseWorkflow(data as WorkflowApiShape);
}

export async function listIdentityWorkflows(orgId: string): Promise<IdentityWorkflowItem[]> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/identity-workflows`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar workflows de identidad",
      res.status,
      data
    );
  }
  return parseWorkflowList(data);
}

export async function getActiveIdentityWorkflow(
  orgId: string
): Promise<IdentityWorkflowItem | null> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/identity-workflows/active`
  );
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener workflow activo",
      res.status,
      data
    );
  }
  return parseWorkflowPayload(data);
}

export async function getIdentityWorkflow(
  orgId: string,
  workflowId: string
): Promise<IdentityWorkflowItem> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/identity-workflows/${encodeURIComponent(
      workflowId
    )}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener workflow de identidad",
      res.status,
      data
    );
  }
  return parseWorkflowPayload(data);
}

export async function createIdentityWorkflow(
  orgId: string,
  payload: IdentityWorkflowUpsertPayload
): Promise<IdentityWorkflowItem> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/identity-workflows`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildWorkflowPayload(payload)),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al crear workflow de identidad",
      res.status,
      data
    );
  }
  return parseWorkflowPayload(data);
}

export async function updateIdentityWorkflow(
  orgId: string,
  workflowId: string,
  payload: IdentityWorkflowUpsertPayload
): Promise<IdentityWorkflowItem> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/identity-workflows/${encodeURIComponent(
      workflowId
    )}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildWorkflowPayload(payload)),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al actualizar workflow de identidad",
      res.status,
      data
    );
  }
  return parseWorkflowPayload(data);
}

export async function deleteIdentityWorkflow(
  orgId: string,
  workflowId: string
): Promise<{ ok: boolean }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/identity-workflows/${encodeURIComponent(
      workflowId
    )}`,
    { method: "DELETE" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al eliminar workflow de identidad",
      res.status,
      data
    );
  }
  return data as { ok: boolean };
}
