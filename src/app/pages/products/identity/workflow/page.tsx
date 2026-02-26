"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { WorkflowsList } from "./_components/workflows-list";
import { WorkflowConfig } from "./_components/workflow-config";
import { useIdentityWorkflowTranslations } from "./_components/use-identity-translations";
import { useTour } from "@/contexts/tour-context";

export default function WorkflowPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { page } = useIdentityWorkflowTranslations();
  const { isTourActive, currentStep, steps } = useTour();

  const handleSelectWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setSelectedWorkflowId("new");
    setIsCreatingNew(true);
  };

  const handleBackToList = () => {
    setSelectedWorkflowId(null);
    setIsCreatingNew(false);
  };

  // Abrir la configuración del flujo cuando el tour busque la vista previa
  useEffect(() => {
    if (isTourActive && steps.length > 0 && currentStep < steps.length) {
      const currentStepData = steps[currentStep];
      if (currentStepData?.target === "tour-identity-workflow-preview" ||
        currentStepData?.target === "tour-identity-workflow-liveness-preview") {
        // Si no hay un flujo seleccionado, crear uno nuevo para mostrar la vista previa
        if (!selectedWorkflowId) {
          setSelectedWorkflowId("new");
          setIsCreatingNew(true);
        }
      }
    }
  }, [isTourActive, currentStep, steps, selectedWorkflowId]);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={page.breadcrumb} />
      {selectedWorkflowId ? (
        <div>
          <div className="mb-4">
            <button
              onClick={handleBackToList}
              className="ml-4 flex items-center gap-2 text-sm text-dark-6 transition hover:text-primary dark:text-dark-6"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {page.backToList}
            </button>
          </div>
          <WorkflowConfig workflowId={selectedWorkflowId} isNew={isCreatingNew} />
        </div>
      ) : (
        <WorkflowsList onSelectWorkflow={handleSelectWorkflow} onCreateNew={handleCreateNew} />
      )}
    </div>
  );
}
