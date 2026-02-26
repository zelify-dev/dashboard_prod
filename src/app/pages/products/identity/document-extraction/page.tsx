import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import type { Metadata } from "next";
import { DocumentExtractionContent } from "./_components/document-extraction-content";

export const metadata: Metadata = {
  title: "Document Extraction",
};

export default function DocumentExtractionPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName="Document Extraction" />
      <DocumentExtractionContent />
    </div>
  );
}
