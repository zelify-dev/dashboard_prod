import type { Metadata } from "next";
import { BehaviorAnalysisPageContent } from "./_components/behavior-analysis-page-content";

export const metadata: Metadata = {
  title: "Análisis de Comportamiento",
};

export default function BehaviorAnalysisPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <BehaviorAnalysisPageContent />
    </div>
  );
}
