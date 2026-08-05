"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { DisbursementManagement } from "./_components/disbursement-management";

export default function DisbursementPage() {
  return (
    <div className="w-full space-y-6">
      <Breadcrumb pageName="Panel General de Dispersión" />
      <DisbursementManagement />
    </div>
  );
}
