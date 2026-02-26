import type { Metadata } from "next";
import { ZelifyKeysPageContent } from "./_components/zelifykeys-page-content";

export const metadata: Metadata = {
  title: "Zelify Keys",
};

export default function ZelifyKeysPage() {
  return <ZelifyKeysPageContent />;
}

