import { Metadata } from "next";
import { BusinessInfoContent } from "./_components/business-info-content";

export const metadata: Metadata = {
  title: "Business Plan | Zelify Dashboard",
  description: "Onboarding - Business Plan Upload",
};

export default function BusinessInfoPage() {
  return <BusinessInfoContent />;
}
