"use client";

import { useState } from "react";
import { PreviewPanel } from "./preview-panel";
import { ConfigPanel } from "./config-panel";

export type ViewMode = "mobile" | "web";
export type MessageLength = "short" | "medium" | "long";
export type ConversationLength = "short" | "moderate" | "long";
export type ChatAccessFrequency = "few" | "moderate" | "many";

export interface AlaizaConfig {
  viewMode: ViewMode;
  maxInputLength: MessageLength;
  maxOutputLength: MessageLength;
  maxConversations: ConversationLength;
  maxChatAccess: ChatAccessFrequency;
  maxFiles: number;
  maxFileSize: number; // in MB
}

// Helper functions to convert types to numbers
export const getInputLengthValue = (length: MessageLength): number => {
  switch (length) {
    case "short": return 200;
    case "medium": return 500;
    case "long": return 1000;
    default: return 500;
  }
};

export const getOutputLengthValue = (length: MessageLength): number => {
  switch (length) {
    case "short": return 500;
    case "medium": return 1000;
    case "long": return 2000;
    default: return 1000;
  }
};

export const getConversationsValue = (length: ConversationLength): number => {
  switch (length) {
    case "short": return 3;
    case "moderate": return 5;
    case "long": return 10;
    default: return 5;
  }
};

export const getChatAccessValue = (frequency: ChatAccessFrequency): number => {
  switch (frequency) {
    case "few": return 3;
    case "moderate": return 5;
    case "many": return 10;
    default: return 5;
  }
};

export function AlaizaConfig() {
  const [config, setConfig] = useState<AlaizaConfig>({
    viewMode: "mobile",
    maxInputLength: "medium",
    maxOutputLength: "medium",
    maxConversations: "moderate",
    maxChatAccess: "moderate",
    maxFiles: 3,
    maxFileSize: 200,
  });

  const updateConfig = (updates: Partial<AlaizaConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div data-tour-id="tour-ai-alaiza-preview">
        <PreviewPanel config={config} updateConfig={updateConfig} />
      </div>
      <div data-tour-id="tour-ai-alaiza-config">
        <ConfigPanel config={config} updateConfig={updateConfig} />
      </div>
    </div>
  );
}

