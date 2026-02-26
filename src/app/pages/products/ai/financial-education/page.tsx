import type { Metadata } from "next";
import { FinancialEducationPageContent } from "./_components/financial-education-page-content";

export const metadata: Metadata = {
  title: "Educación Financiera",
};

export default function FinancialEducationPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <FinancialEducationPageContent />
    </div>
  );
}
