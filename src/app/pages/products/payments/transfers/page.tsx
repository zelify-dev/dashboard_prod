"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { TransfersManagement } from "./_components/transfers-management";

export default function TransfersPage() {
  return (
    <div className="w-full space-y-6">
      <Breadcrumb pageName="Transferencias" />
      <TransfersManagement />
    </div>
  );
}
