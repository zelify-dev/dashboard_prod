"use client";

import { useRef, useEffect } from "react";
import { useAlaizaTranslations } from "./use-alaiza-translations";
import { getInputLengthValue, type MessageLength } from "./alaiza-config";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot" | "system";
  timestamp: string;
}

interface ChatPreviewProps {
  messages: Message[];
  inputText: string;
  isTyping: boolean;
  typingMessage: string;
  isTransferring: boolean;
  isTransferred: boolean;
  isDarkMode: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  maxInputLength: MessageLength;
  maxFileSize: number;
}

export function ChatPreview({
  messages,
  inputText,
  isTyping,
  typingMessage,
  isTransferring,
  isTransferred,
  isDarkMode,
  onInputChange,
  onKeyPress,
  onSendMessage,
  maxInputLength,
  maxFileSize,
}: ChatPreviewProps) {
  const translations = useAlaizaTranslations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Color del tema para animaciones CTA
  const themeColor = "#004492";
  useCTAButtonAnimations(themeColor);

  const hasUserMessages = messages.some((m) => m.sender === "user");

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isTyping, typingMessage, isTransferring, isTransferred]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* App Header with back button and Zelify logo */}
      <div className="relative mb-3 mt-8 flex flex-shrink-0 items-center justify-between px-5">
        <button className="text-sm font-medium text-gray-500 dark:text-gray-400">
          &lt; back
        </button>
        <div className="absolute left-1/2 -translate-x-1/2">
          <img
            src={
              isDarkMode
                ? "https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/zelifyLogo_dark.svg"
                : "https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/zelifyLogo_ligth.svg"
            }
            alt="Zelify Logo"
            className="h-8 max-w-full object-contain"
          />
        </div>
        <div className="w-12"></div> {/* Spacer para centrar el logo */}
      </div>

      {/* GIF Animado - Mismo que en Auth */}
      <div className="relative -mb-16 flex-shrink-0 z-0 flex justify-center">
        <img
          src="/gift/ANIMACION%201.gif"
          alt="Connecting Animation"
          className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
        />
      </div>

      {/* Tarjeta de contenido con fondo blanco translúcido - Mismo que en Auth */}
      <div
        className="relative z-10 flex-1 overflow-hidden rounded-2xl p-5 backdrop-blur-sm"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.35)",
        }}
      >
        {/* AI Assistant Introduction */}
        {!hasUserMessages && (
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white dark:bg-white flex items-center justify-center p-1.5">
                <img
                  src="/images/iconAlaiza.svg"
                  alt="Alaiza"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-dark dark:text-white">
                  Alaiza
                </h2>
                <p className="text-sm text-[#8B5CF6] dark:text-[#8B5CF6]">
                  AI Financial Assistant
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <div className="space-y-4">
            {messages.map((message, index) => {
              // Mensaje de sistema (transferencia)
              if (message.sender === "system") {
                return (
                  <div
                    key={message.id}
                    className="flex items-center justify-center py-4"
                  >
                    <div className="flex flex-col items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3 border border-green-200 dark:border-green-800 max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-5 w-5 text-green-600 dark:text-green-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 text-center">
                          {message.text ||
                            translations.preview.transfer.completed}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Primer mensaje del bot - mostrar con icono de Alaiza
              if (message.sender === "bot" && index === 0 && !hasUserMessages) {
                return (
                  <div key={message.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white dark:bg-white flex items-center justify-center p-1">
                      <img
                        src="/images/iconAlaiza.svg"
                        alt="Alaiza"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 max-w-[85%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-dark-3 px-4 py-3 shadow-sm">
                      <p className="text-sm leading-relaxed text-dark dark:text-white">
                        {message.text}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2.5 ${message.sender === "user" ? "justify-end" : ""
                    }`}
                >
                  {message.sender === "bot" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 ring-2 ring-white dark:ring-dark-2">
                      <img
                        src="/images/iconAlaiza.svg"
                        alt="Alaiza"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div
                    className={`flex-1 max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${message.sender === "user"
                      ? "rounded-tr-sm bg-primary text-right"
                      : "rounded-tl-sm bg-gray-100 dark:bg-dark-3"
                      }`}
                  >
                    <p
                      className={`text-sm leading-relaxed ${message.sender === "user"
                        ? "text-white"
                        : "text-dark dark:text-white"
                        }`}
                    >
                      {message.text}
                    </p>
                    <p
                      className={`mt-1 text-[10px] font-semibold ${message.sender === "user"
                        ? "text-white opacity-90"
                        : "text-dark-5 dark:text-dark-5"
                        }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>

                  {message.sender === "user" && (
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-3 ring-2 ring-white dark:ring-dark-2">
                        <img
                          src="/images/user/user-03.png"
                          alt="User"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {/* Online Status Indicator */}
                      <div className="absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-dark-2 z-10"></div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Transferring Animation */}
            {isTransferring && (
              <div className="flex items-center justify-center py-4">
                <div className="flex flex-col items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {translations.preview.transfer.transferring}
                    </p>
                    <div
                      className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {translations.preview.transfer.subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Typing Message */}
            {isTyping && typingMessage && !isTransferring && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 ring-2 ring-white dark:ring-dark-2">
                  <img
                    src="/images/iconAlaiza.svg"
                    alt="Alaiza"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 px-3 py-2 dark:bg-dark-3 shadow-sm">
                  <p className="text-sm text-dark dark:text-white leading-relaxed">
                    {typingMessage}
                    <span className="inline-block w-0.5 h-4 bg-dark dark:bg-white ml-1 animate-pulse">
                      |
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Typing Indicator (solo cuando no hay texto aún) */}
            {isTyping && !typingMessage && !isTransferring && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 ring-2 ring-white dark:ring-dark-2">
                  <img
                    src="/images/iconAlaiza.svg"
                    alt="Alaiza"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 px-3 py-2 dark:bg-dark-3 shadow-sm">
                  <div className="flex items-center gap-1 py-1">
                    <div
                      className="h-2 w-2 rounded-full bg-dark-6 dark:bg-dark-6 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-dark-6 dark:bg-dark-6 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-dark-6 dark:bg-dark-6 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Chat Input Footer */}
      <div className="relative bg-[#113256] dark:bg-[#113256] px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 shrink-0 items-center justify-center text-white">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <div className="flex-1 relative h-10 flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={
                isTransferred
                  ? translations.preview.input.placeholderTransferred
                  : translations.preview.input.placeholder
              }
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={onKeyPress}
              maxLength={getInputLengthValue(maxInputLength)}
              disabled={isTyping || isTransferring || isTransferred}
              className="h-full w-full resize-none rounded-lg bg-white px-4 py-2 text-sm text-dark placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                maxHeight: "120px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            />
          </div>

          <button
            onClick={onSendMessage}
            disabled={
              !inputText.trim() || isTyping || isTransferring || isTransferred
            }
            className="group relative flex h-8 w-8 shrink-0 items-center justify-center text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-lg"
            style={{
              backgroundColor: !inputText.trim() || isTyping || isTransferring || isTransferred ? '#9BA2AF' : themeColor,
              boxShadow: !inputText.trim() || isTyping || isTransferring || isTransferred ? 'none' : `0 4px 14px 0 ${themeColor}40`,
              animation: !inputText.trim() || isTyping || isTransferring || isTransferred ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
            }}
          >
            {(!inputText.trim() || isTyping || isTransferring || isTransferred) ? null : (
              <>
                {/* Resplandor animado alrededor del botón */}
                <span
                  className="absolute inset-0 rounded-lg opacity-60 blur-md -z-10"
                  style={{
                    background: themeColor,
                    animation: 'cta-pulse-ring 2s ease-in-out infinite',
                  }}
                ></span>

                {/* Brillo que se mueve automáticamente */}
                <span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
                  style={{
                    animation: 'cta-shine-sweep 2.5s linear infinite',
                  }}
                ></span>

                {/* Capa de brillo adicional constante */}
                <span
                  className="absolute inset-0 rounded-lg -z-10"
                  style={{
                    background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
                    animation: 'cta-glow-pulse 2s ease-in-out infinite',
                  }}
                ></span>
              </>
            )}
            <svg
              className="h-5 w-5 relative z-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ animation: !inputText.trim() || isTyping || isTransferring || isTransferred ? 'none' : 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>

            {/* Efecto de brillo al hacer hover */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
          </button>
        </div>

        {/* Home indicator line */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-white/30 rounded-full"></div>
      </div>
    </div>
  );
}
