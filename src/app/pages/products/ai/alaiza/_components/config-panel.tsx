"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SelectComponent } from "@/components/FormElements/select";
import {
  AlaizaConfig,
  MessageLength,
  ConversationLength,
  ChatAccessFrequency,
  getInputLengthValue,
  getOutputLengthValue,
  getConversationsValue,
  getChatAccessValue
} from "./alaiza-config";
import { useAlaizaTranslations } from "./use-alaiza-translations";
import { useLanguage } from "@/contexts/language-context";

interface ConfigPanelProps {
  config: AlaizaConfig;
  updateConfig: (updates: Partial<AlaizaConfig>) => void;
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

// Helper function to generate example text of a specific length
function generateExampleText(length: number, isEnglish: boolean = false): string {
  const baseText = isEnglish
    ? "This is an example text that shows how a message with this length would look. "
    : "Este es un ejemplo de texto que muestra cómo se vería un mensaje con esta longitud. ";
  if (length <= baseText.length) {
    return baseText.substring(0, length);
  }

  const repetitions = Math.ceil(length / baseText.length);
  const fullText = baseText.repeat(repetitions);
  return fullText.substring(0, length);
}

// Helper function to format file size
function formatFileSize(mb: number): string {
  if (mb < 1) {
    return `${(mb * 1024).toFixed(0)} KB`;
  }
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb} MB`;
}

export function ConfigPanel({ config, updateConfig }: ConfigPanelProps) {
  const translations = useAlaizaTranslations();
  const { language } = useLanguage();
  type OpenSection = "message" | "conversation" | "file";
  const [openSection, setOpenSection] = useState<OpenSection>("message");

  return (
    <div className="rounded-lg bg-white shadow-sm dark:bg-dark-2">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-dark dark:text-white">{translations.config.title}</h2>
        <p className="text-sm text-dark-6 dark:text-dark-6">{translations.config.description}</p>
      </div>

      <div className="space-y-0">
        {/* Message Length Controls */}
        <div className="rounded-lg border-t border-stroke dark:border-dark-3">
          <button
            onClick={() => setOpenSection("message")}
            className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
          >
            <h3 className="text-lg font-semibold text-dark dark:text-white">{translations.config.messageLength.title}</h3>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
                openSection === "message" && "rotate-180"
              )}
            />
          </button>
          {openSection === "message" && (
            <div key={`message-${language}`} className="border-t border-stroke px-6 py-4 space-y-6 dark:border-dark-3">

              <div>
                <SelectComponent
                  key={`input-${language}`}
                  label={translations.config.messageLength.maxInputLabel}
                  items={[
                    { value: "short", label: `${translations.config.messageLength.short} (200 ${translations.config.messageLength.characters})` },
                    { value: "medium", label: `${translations.config.messageLength.medium} (500 ${translations.config.messageLength.characters})` },
                    { value: "long", label: `${translations.config.messageLength.long} (1000 ${translations.config.messageLength.characters})` }
                  ]}
                  defaultValue={config.maxInputLength}
                  onChange={(value) => updateConfig({ maxInputLength: value as MessageLength })}
                  className="space-y-2"
                />
                <div className="mt-2 rounded-md bg-gray-50 dark:bg-dark-3 p-3 border border-stroke dark:border-dark-3">
                  <p className="text-xs font-medium text-dark-6 dark:text-dark-6 mb-1.5">{translations.config.messageLength.exampleMessage} ({getInputLengthValue(config.maxInputLength)} {translations.config.messageLength.characters}):</p>
                  <p className="text-xs text-dark-5 dark:text-dark-5 leading-relaxed break-words">
                    {(() => {
                      const length = getInputLengthValue(config.maxInputLength);
                      const isEnglish = language === "en";
                      return length <= 200
                        ? generateExampleText(length, isEnglish)
                        : generateExampleText(200, isEnglish) + "...";
                    })()}
                  </p>
                  {getInputLengthValue(config.maxInputLength) > 200 && (
                    <p className="text-[10px] text-dark-6 dark:text-dark-6 mt-1 italic">
                      ({translations.config.messageLength.showingFirst} 200 {translations.config.messageLength.characters} {translations.config.messageLength.ofTotal} {getInputLengthValue(config.maxInputLength)} {translations.config.messageLength.characters})
                    </p>
                  )}
                </div>
              </div>

              <div>
                <SelectComponent
                  key={`output-${language}`}
                  label={translations.config.messageLength.maxOutputLabel}
                  items={[
                    { value: "short", label: `${translations.config.messageLength.short} (500 ${translations.config.messageLength.characters})` },
                    { value: "medium", label: `${translations.config.messageLength.medium} (1000 ${translations.config.messageLength.characters})` },
                    { value: "long", label: `${translations.config.messageLength.long} (2000 ${translations.config.messageLength.characters})` }
                  ]}
                  defaultValue={config.maxOutputLength}
                  onChange={(value) => updateConfig({ maxOutputLength: value as MessageLength })}
                  className="space-y-2"
                />
                <div className="mt-2 rounded-md bg-gray-50 dark:bg-dark-3 p-3 border border-stroke dark:border-dark-3">
                  <p className="text-xs font-medium text-dark-6 dark:text-dark-6 mb-1.5">{translations.config.messageLength.exampleResponse} ({getOutputLengthValue(config.maxOutputLength)} {translations.config.messageLength.characters}):</p>
                  <p className="text-xs text-dark-5 dark:text-dark-5 leading-relaxed break-words">
                    {(() => {
                      const length = getOutputLengthValue(config.maxOutputLength);
                      const isEnglish = language === "en";
                      return length <= 200
                        ? generateExampleText(length, isEnglish)
                        : generateExampleText(200, isEnglish) + "...";
                    })()}
                  </p>
                  {getOutputLengthValue(config.maxOutputLength) > 200 && (
                    <p className="text-[10px] text-dark-6 dark:text-dark-6 mt-1 italic">
                      ({translations.config.messageLength.showingFirst} 200 {translations.config.messageLength.characters} {translations.config.messageLength.ofTotal} {getOutputLengthValue(config.maxOutputLength)} {translations.config.messageLength.characters})
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Conversation Limits */}
        <div className="rounded-lg border-t border-stroke dark:border-dark-3">
          <button
            onClick={() => setOpenSection("conversation")}
            className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
          >
            <h3 className="text-lg font-semibold text-dark dark:text-white">{translations.config.conversationLimits.title}</h3>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
                openSection === "conversation" && "rotate-180"
              )}
            />
          </button>
          {openSection === "conversation" && (
            <div key={`conversation-${language}`} className="border-t border-stroke px-6 py-4 space-y-6 dark:border-dark-3">
              <div>
                <SelectComponent
                  key={`conversations-${language}`}
                  label={translations.config.conversationLimits.maxConversationsLabel}
                  items={[
                    { value: "short", label: `${translations.config.conversationLimits.short} (3 ${translations.config.conversationLimits.conversations})` },
                    { value: "moderate", label: `${translations.config.conversationLimits.moderate} (5 ${translations.config.conversationLimits.conversations})` },
                    { value: "long", label: `${translations.config.conversationLimits.long} (10 ${translations.config.conversationLimits.conversations})` }
                  ]}
                  defaultValue={config.maxConversations}
                  onChange={(value) => updateConfig({ maxConversations: value as ConversationLength })}
                  className="space-y-2"
                />
                <div className="mt-2 rounded-md bg-gray-50 dark:bg-dark-3 p-3 border border-stroke dark:border-dark-3">
                  <p className="text-xs font-medium text-dark-6 dark:text-dark-6 mb-2">{translations.config.conversationLimits.exampleFlow}</p>
                  <div className="space-y-1.5">
                    {Array.from({ length: Math.min(getConversationsValue(config.maxConversations), 5) }, (_, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-dark-5 dark:text-dark-5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {i + 1}
                        </div>
                        <span>{translations.config.conversationLimits.conversationWith} {i + 1} {translations.preview.assistant.name} AI</span>
                      </div>
                    ))}
                    {getConversationsValue(config.maxConversations) > 5 && (
                      <p className="text-[10px] text-dark-6 dark:text-dark-6 italic pl-7">
                        ... {translations.config.messageLength.ofTotal} {getConversationsValue(config.maxConversations) - 5} {translations.config.conversationLimits.conversations} {translations.config.conversationLimits.many}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-red-600 dark:text-red-400 font-medium pt-1 border-t border-stroke dark:border-dark-3 mt-1.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-[10px] font-semibold">
                        →
                      </div>
                      <span>{translations.config.conversationLimits.transferToHuman}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-dark-6 dark:text-dark-6 mt-2">
                    {translations.config.conversationLimits.afterConversations} {getConversationsValue(config.maxConversations)} {getConversationsValue(config.maxConversations) === 1 ? translations.config.conversationLimits.conversation : translations.config.conversationLimits.conversations} {translations.config.conversationLimits.withAI}, {translations.config.conversationLimits.willTransfer}
                  </p>
                </div>
              </div>

              <div>
                <SelectComponent
                  key={`access-${language}`}
                  label={translations.config.conversationLimits.maxChatAccessLabel}
                  items={[
                    { value: "few", label: `${translations.config.conversationLimits.few} (3 ${translations.config.conversationLimits.timesPerDay})` },
                    { value: "moderate", label: `${translations.config.conversationLimits.moderate} (5 ${translations.config.conversationLimits.timesPerDay})` },
                    { value: "many", label: `${translations.config.conversationLimits.many} (10 ${translations.config.conversationLimits.timesPerDay})` }
                  ]}
                  defaultValue={config.maxChatAccess}
                  onChange={(value) => updateConfig({ maxChatAccess: value as ChatAccessFrequency })}
                  className="space-y-2"
                />
                <div className="mt-2 rounded-md bg-gray-50 dark:bg-dark-3 p-3 border border-stroke dark:border-dark-3">
                  <p className="text-xs font-medium text-dark-6 dark:text-dark-6 mb-2">{translations.config.conversationLimits.exampleAccess}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: getChatAccessValue(config.maxChatAccess) }, (_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-[10px] font-semibold text-primary border border-primary/20"
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-dark-6 dark:text-dark-6 mt-2">
                    {translations.config.conversationLimits.eachUserCanAccess} {getChatAccessValue(config.maxChatAccess)} {getChatAccessValue(config.maxChatAccess) === 1 ? translations.config.conversationLimits.time : translations.config.conversationLimits.times} {translations.config.conversationLimits.perDay}
                  </p>
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1.5 font-medium">
                    {translations.config.conversationLimits.dailyLimitWarning}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* File Upload Limits */}
        <div className="rounded-lg border-t border-stroke dark:border-dark-3">
          <button
            onClick={() => setOpenSection("file")}
            className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
          >
            <h3 className="text-lg font-semibold text-dark dark:text-white">{translations.config.fileUpload.title}</h3>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
                openSection === "file" && "rotate-180"
              )}
            />
          </button>
          {openSection === "file" && (
            <div key={`file-${language}`} className="border-t border-stroke px-6 py-4 space-y-4 dark:border-dark-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.config.fileUpload.maxFilesLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxFiles}
                  onChange={(e) => updateConfig({ maxFiles: parseInt(e.target.value) || 3 })}
                  className="block w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
                <div className="mt-2 rounded-md bg-gray-50 dark:bg-dark-3 p-3 border border-stroke dark:border-dark-3">
                  <p className="text-xs font-medium text-dark-6 dark:text-dark-6 mb-2">{translations.config.fileUpload.visualExample}</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: config.maxFiles }, (_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 rounded-md bg-white dark:bg-dark-2 px-2.5 py-1.5 border border-stroke dark:border-dark-3"
                      >
                        <svg className="h-3.5 w-3.5 text-dark-6 dark:text-dark-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[10px] text-dark-6 dark:text-dark-6">archivo-{i + 1}.pdf</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-dark-6 dark:text-dark-6 mt-2">
                    {translations.config.fileUpload.usersCanUpload} {config.maxFiles} {config.maxFiles === 1 ? translations.config.fileUpload.file : translations.config.fileUpload.files}
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.config.fileUpload.maxFileSizeLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={config.maxFileSize}
                  onChange={(e) => updateConfig({ maxFileSize: parseInt(e.target.value) || 200 })}
                  className="block w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
                <div className="mt-2 rounded-md bg-gray-50 dark:bg-dark-3 p-3 border border-stroke dark:border-dark-3">
                  <p className="text-xs font-medium text-dark-6 dark:text-dark-6 mb-2">{translations.config.fileUpload.sizeExample}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-md bg-white dark:bg-dark-2 px-2.5 py-1.5 border border-stroke dark:border-dark-3">
                      <svg className="h-3.5 w-3.5 text-dark-6 dark:text-dark-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[10px] text-dark-6 dark:text-dark-6">documento.pdf</span>
                    </div>
                    <span className="text-xs text-dark-5 dark:text-dark-5 font-medium">
                      {formatFileSize(config.maxFileSize)}
                    </span>
                  </div>
                  <p className="text-[10px] text-dark-6 dark:text-dark-6 mt-2">
                    {translations.config.fileUpload.maxSizeAllowed} {formatFileSize(config.maxFileSize)}
                  </p>
                  {config.maxFileSize > 200 && (
                    <p className="text-[10px] text-red-600 dark:text-red-400 mt-1.5 font-medium">
                      {translations.config.fileUpload.sizeWarning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

