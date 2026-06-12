import { redirect } from "next/navigation";

export default function LegacyOrganizationAdminPage() {
  redirect("/owner/organizations");
}
