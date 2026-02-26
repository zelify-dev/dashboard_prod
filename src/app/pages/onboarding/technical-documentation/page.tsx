import { Metadata } from "next";
import { TechnicalDocumentationPageContent } from "./_components/technical-documentation-content";

export const metadata: Metadata = {
  title: "Documentación técnica | Zelify Dashboard",
  description: "Onboarding - Technical Documentation",
};

export default function TechnicalDocumentationPage() {
  return <TechnicalDocumentationPageContent />;
}
