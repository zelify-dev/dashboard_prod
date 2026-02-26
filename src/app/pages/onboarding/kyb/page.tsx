import { Metadata } from "next";
import { KybPageContent } from "./_components/kyb-page-content";

export const metadata: Metadata = {
  title: "KYB | Zelify Dashboard",
  description: "Onboarding - Know Your Business",
};

export default function KYBPage() {
  return <KybPageContent />;
}
