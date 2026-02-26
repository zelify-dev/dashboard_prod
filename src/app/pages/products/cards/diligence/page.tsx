"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../_components/cards-translations";
import { DiligenceList, Diligence, mockDiligences } from "./_components/diligence-list";
import { DiligenceDetail } from "./_components/diligence-detail";
import { NewDiligenceForm } from "./_components/new-diligence-form";

export default function CardsDiligencePage() {
  const { language } = useLanguage();
  const t = cardsTranslations[language].diligence;
  const [diligences, setDiligences] = useState<Diligence[]>(mockDiligences);
  const [selectedDiligence, setSelectedDiligence] = useState<Diligence | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleCreateNew = () => {
    setShowNewForm(true);
  };

  const handleSaveNew = (diligenceData: Omit<Diligence, "id" | "submittedDate">) => {
    const newDiligence: Diligence = {
      ...diligenceData,
      id: `dil_${String(diligences.length + 1).padStart(3, "0")}`,
      submittedDate: new Date().toISOString(),
    };
    setDiligences([newDiligence, ...diligences]);
    setShowNewForm(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={t.pageTitle} />
      <div className="mt-6">
        <div className="mb-6 flex items-center justify-end">
          <button
            onClick={handleCreateNew}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t.newButton}
            </span>
          </button>
        </div>
        <DiligenceList
          diligences={diligences}
          onDiligenceClick={setSelectedDiligence}
        />
      </div>
      {selectedDiligence && (
        <DiligenceDetail
          diligence={selectedDiligence}
          onClose={() => setSelectedDiligence(null)}
        />
      )}
      {showNewForm && (
        <NewDiligenceForm
          onSave={handleSaveNew}
          onCancel={() => setShowNewForm(false)}
        />
      )}
    </div>
  );
}


