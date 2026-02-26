"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type TourStep = {
  id: string;
  target: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  url?: string;
};

interface TourContextType {
  isTourActive: boolean;
  isPaused: boolean;
  currentStep: number;
  steps: TourStep[];
  isModalOpen: boolean;
  startTour: (steps: TourStep[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  endTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startTour = (tourSteps: TourStep[]) => {
    setSteps(tourSteps);
    setCurrentStep(0);
    setIsTourActive(true);
    setIsPaused(false);
  };

  const nextStep = () => {
    if (isPaused) return;
    setCurrentStep((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  };

  const previousStep = () => {
    if (isPaused) return;
    setCurrentStep((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  };

  const endTour = () => {
    setIsTourActive(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
  };

  const pauseTour = () => {
    setIsPaused(true);
  };

  const resumeTour = () => {
    setIsPaused(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        isPaused,
        currentStep,
        steps,
        isModalOpen,
        startTour,
        nextStep,
        previousStep,
        endTour,
        pauseTour,
        resumeTour,
        openModal,
        closeModal,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

