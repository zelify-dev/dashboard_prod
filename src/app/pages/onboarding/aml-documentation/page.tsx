import { Metadata } from "next";
import { AmlPageContent } from "./_components/aml-page-content";

export const metadata: Metadata = {
  title: "Documentación AML | Zelify Dashboard",
  description: "Onboarding - AML Documentation",
};

export default function AMLDocumentationPage() {
  return <AmlPageContent />;
}
