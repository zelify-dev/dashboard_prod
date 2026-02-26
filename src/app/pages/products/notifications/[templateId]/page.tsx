"use client";

import { useParams } from "next/navigation";
import { NotificationTemplateEditor } from "../_components/notification-template-editor";

export default function NotificationTemplatePage() {
  const params = useParams<{ templateId: string }>();
  const templateId = Array.isArray(params.templateId) ? params.templateId[0] : params.templateId;

  return <NotificationTemplateEditor templateId={templateId} />;
}
