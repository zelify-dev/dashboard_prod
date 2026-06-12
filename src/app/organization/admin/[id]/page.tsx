import { redirect } from "next/navigation";

export default async function LegacyOrganizationAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/owner/organizations/${id}`);
}
