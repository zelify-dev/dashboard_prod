"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import {
  AlaizaConfig,
  ViewMode,
  getInputLengthValue,
  getConversationsValue
} from "./alaiza-config";
import { useAlaizaTranslations } from "./use-alaiza-translations";
import { useLanguage } from "@/contexts/language-context";
import { ChatPreview } from "./chat-preview";

interface PreviewPanelProps {
  config: AlaizaConfig;
  updateConfig: (updates: Partial<AlaizaConfig>) => void;
}

function MobileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function WebIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function AnimatedHalftoneBackdrop({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(resize);
      observer.observe(parent);
      resizeObserverRef.current = observer;
    }

    let start = performance.now();
    const spacing = 26;
    const waveFrequency = 1.35;
    const waveSpeed = 0.35;

    const render = (time: number) => {
      const elapsed = (time - start) / 1000;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const [r, g, b] = isDarkMode ? [255, 255, 255] : [94, 109, 136];

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase =
            (normalizedDistance * waveFrequency - elapsed * waveSpeed) *
            Math.PI *
            2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (0.06 + pulse * 0.45) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [isDarkMode]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function EdgeFadeOverlay({ isDarkMode }: { isDarkMode: boolean }) {
  const fadeColor = isDarkMode ? "rgba(8,11,25,1)" : "rgba(250,252,255,1)";
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-3xl"
      style={{
        background: `radial-gradient(circle at center, rgba(0,0,0,0) 60%, ${fadeColor} 100%)`,
      }}
    ></div>
  );
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot" | "system";
  timestamp: string;
}

export function PreviewPanel({ config, updateConfig }: PreviewPanelProps) {
  const translations = useAlaizaTranslations();
  const { language } = useLanguage();
  const { viewMode } = config;

  // Detectar si el preview está en modo dark
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFileWarning, setShowFileWarning] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isTransferred, setIsTransferred] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const styleId = "alaiza-preview-animations";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes halftonePulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Actualizar mensaje inicial cuando cambie el idioma
  useEffect(() => {
    setMessages([
      {
        id: "1",
        text: translations.preview.initialMessage,
        sender: "bot",
        timestamp: formatTime(),
      },
    ]);
    setIsTransferring(false);
    setIsTransferred(false);
  }, [translations.preview.initialMessage]);

  const toggleViewMode = () => {
    updateConfig({ viewMode: viewMode === "mobile" ? "web" : "mobile" });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Verificar cantidad de archivos
    if (selectedFiles.length + files.length > config.maxFiles) {
      alert(`${translations.preview.input.maxFilesAlert} ${config.maxFiles} ${config.maxFiles === 1 ? translations.config.fileUpload.file : translations.config.fileUpload.files} ${translations.preview.input.allowed}`);
      return;
    }

    // Verificar tamaño de archivos
    const oversizedFiles = files.filter(
      (file) => file.size > config.maxFileSize * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      setShowFileWarning(true);
      // Simular que se aceptan pero con advertencia
      setTimeout(() => setShowFileWarning(false), 5000);
    }

    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // Función para detectar si el mensaje tiene sentido o es solo caracteres aleatorios
  const hasValidStructure = (message: string): boolean => {
    const text = message.toLowerCase().trim();

    // Si es muy corto (menos de 2 caracteres), considerar válido
    if (text.length < 2) return true;

    // Palabras comunes en español e inglés
    const commonWords = [
      // Español
      'cómo', 'como', 'qué', 'que', 'cuál', 'cual', 'dónde', 'donde', 'cuándo', 'cuando',
      'para', 'con', 'activar', 'configurar', 'transacción', 'transaccion', 'cuenta', 'tarjeta',
      'pago', 'saldo', 'movimiento', 'transferencia', 'hola', 'ayuda', 'ayudar', 'necesito',
      'quiero', 'puedo', 'hacer', 'hacer', 'ver', 'consultar', 'revisar', 'gestionar',
      // Inglés
      'how', 'what', 'where', 'when', 'why', 'which', 'activate', 'configure', 'configuration',
      'transaction', 'payment', 'transfer', 'account', 'card', 'balance', 'money', 'hello',
      'hi', 'help', 'need', 'want', 'can', 'do', 'make', 'see', 'check', 'manage', 'setup'
    ];

    // Verificar si contiene al menos una palabra común
    const hasCommonWord = commonWords.some(word => text.includes(word));

    // Verificar si tiene caracteres especiales del español
    const hasSpanishChars = /[áéíóúñü]/.test(text);

    // Verificar si tiene al menos 2 vocales (indicador de palabras)
    const vowels = text.match(/[aeiouáéíóú]/gi);
    const vowelCount = vowels ? vowels.length : 0;
    const hasEnoughVowels = vowelCount >= 2;

    // Verificar si tiene espacios (indicador de palabras separadas)
    const hasSpaces = text.includes(' ');

    // Verificar si tiene patrones repetitivos de caracteres (indicador de texto aleatorio)
    const hasRepetitivePattern = /(.)\1{3,}/.test(text); // Mismo carácter repetido 4+ veces

    // Verificar si tiene muchas consonantes seguidas sin vocales (indicador de texto aleatorio)
    const hasTooManyConsonants = /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(text);

    // Si tiene palabras comunes, es válido
    if (hasCommonWord) return true;

    // Si tiene caracteres españoles y suficientes vocales, es válido
    if (hasSpanishChars && hasEnoughVowels) return true;

    // Si tiene espacios y suficientes vocales, probablemente es válido
    if (hasSpaces && hasEnoughVowels && text.length > 5) return true;

    // Si tiene patrones repetitivos o muchas consonantes seguidas, probablemente no tiene sentido
    if (hasRepetitivePattern || hasTooManyConsonants) return false;

    // Si es muy corto sin espacios y sin vocales suficientes, probablemente no tiene sentido
    if (!hasSpaces && !hasEnoughVowels && text.length > 5) return false;

    // Si tiene suficientes vocales y no es solo caracteres aleatorios, es válido
    return hasEnoughVowels && text.length > 3;
  };

  // Función para detectar idioma y generar respuesta contextual
  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase().trim();
    const resp = translations.preview.responses;

    // Detectar idioma basado en el idioma actual de la aplicación
    const isSpanish = language === "es";

    // Verificar si el mensaje tiene sentido
    if (!hasValidStructure(userMessage)) {
      return resp.notUnderstood;
    }

    // Respuestas en español
    if (isSpanish) {
      // Saludos
      if (message.includes('hola') || message.includes('buenos') || message.includes('buenas') || message.includes('buen día')) {
        return resp.greetings;
      }

      // Consulta de saldo
      if (message.includes('saldo') && (message.includes('cuánto') || message.includes('cuanto') || message.includes('tengo') || message.includes('ver'))) {
        return resp.balance.check;
      }
      if (message.includes('saldo') || (message.includes('dinero') && message.includes('tengo'))) {
        return resp.balance.review;
      }

      // Transferencias
      if (message.includes('transferir') || message.includes('transferencia')) {
        if (message.includes('cómo') || message.includes('como')) {
          return resp.transfers.howTo;
        }
        return resp.transfers.general;
      }

      // Pagos
      if (message.includes('pagar') || message.includes('pago')) {
        if (message.includes('tarjeta') || message.includes('tarjeta de crédito')) {
          return resp.payments.card;
        }
        return resp.payments.general;
      }

      // Tarjetas
      if (message.includes('tarjeta')) {
        if (message.includes('bloquear') || message.includes('bloqueada')) {
          return resp.cards.block;
        }
        if (message.includes('activar') || message.includes('nueva')) {
          return resp.cards.activate;
        }
        if (message.includes('límite') || message.includes('limite') || message.includes('cupo')) {
          return resp.cards.limit;
        }
        return resp.cards.manage;
      }

      // Movimientos y historial
      if (message.includes('movimiento') || message.includes('historial') || message.includes('extracto') || (message.includes('ver') && message.includes('transacción'))) {
        return resp.transactions;
      }

      // Configuración
      if (message.includes('configurar') || message.includes('configuración') || message.includes('configuracion') || message.includes('ajustes')) {
        return resp.configuration;
      }

      // Activar funciones
      if (message.includes('activar') || message.includes('habilitar')) {
        return resp.activate;
      }

      // Seguridad
      if (message.includes('contraseña') || message.includes('password') || message.includes('pin') || message.includes('seguridad')) {
        return resp.security;
      }

      // Problemas o errores
      if (message.includes('error') || message.includes('problema') || message.includes('no funciona') || message.includes('falla')) {
        return resp.problems;
      }

      // Ayuda general
      if (message.includes('ayuda') || message.includes('ayudar') || message.includes('necesito ayuda')) {
        return resp.help;
      }

      // Despedidas
      if (message.includes('gracias') || message.includes('chao') || message.includes('adiós') || message.includes('adios')) {
        return resp.goodbye;
      }

      // Respuesta genérica en español
      return resp.generic;
    }

    // Respuestas en inglés
    // Greetings
    if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('good morning') || message.includes('good afternoon')) {
      return resp.greetings;
    }

    // Balance inquiry
    if (message.includes('balance') && (message.includes('how much') || message.includes('check') || message.includes('see'))) {
      return resp.balance.check;
    }
    if (message.includes('balance') || (message.includes('money') && message.includes('have'))) {
      return resp.balance.review;
    }

    // Transfers
    if (message.includes('transfer')) {
      if (message.includes('how') || message.includes('make')) {
        return resp.transfers.howTo;
      }
      return resp.transfers.general;
    }

    // Payments
    if (message.includes('pay') || message.includes('payment')) {
      if (message.includes('card') || message.includes('credit card')) {
        return resp.payments.card;
      }
      return resp.payments.general;
    }

    // Cards
    if (message.includes('card')) {
      if (message.includes('block') || message.includes('blocked') || message.includes('lost') || message.includes('stolen')) {
        return resp.cards.block;
      }
      if (message.includes('activate') || message.includes('new')) {
        return resp.cards.activate;
      }
      if (message.includes('limit') || message.includes('credit limit')) {
        return resp.cards.limit;
      }
      return resp.cards.manage;
    }

    // Transactions and history
    if (message.includes('transaction') || message.includes('history') || message.includes('statement') || (message.includes('see') && message.includes('transaction'))) {
      return resp.transactions;
    }

    // Configuration
    if (message.includes('configure') || message.includes('configuration') || message.includes('setup') || message.includes('settings')) {
      return resp.configuration;
    }

    // Activate features
    if (message.includes('activate') || message.includes('enable')) {
      return resp.activate;
    }

    // Security
    if (message.includes('password') || message.includes('pin') || message.includes('security')) {
      return resp.security;
    }

    // Problems or errors
    if (message.includes('error') || message.includes('problem') || message.includes('not working') || message.includes('issue')) {
      return resp.problems;
    }

    // General help
    if (message.includes('help') || message.includes('assist') || message.includes('need help')) {
      return resp.help;
    }

    // Goodbyes
    if (message.includes('thank') || message.includes('thanks') || message.includes('bye') || message.includes('goodbye')) {
      return resp.goodbye;
    }

    // Respuesta genérica en inglés
    return resp.generic;
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || isTyping || isTransferring || isTransferred) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputText.trim();
    setInputText("");

    // Ajustar altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    // Contar mensajes del usuario (excluyendo el mensaje inicial del bot)
    const userMessagesCount = messages.filter(m => m.sender === "user").length + 1;

    // Verificar si se alcanzó el límite de conversaciones
    if (userMessagesCount >= getConversationsValue(config.maxConversations)) {
      // Iniciar transferencia a agente humano
      setIsTyping(true);
      setIsTransferring(true);
      setTypingMessage("");

      // Simular animación de transferencia
      setTimeout(() => {
        setIsTyping(false);
        setIsTransferring(false);
        setIsTransferred(true);

        // Agregar mensaje de transferencia completada
        const transferMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: translations.preview.transfer.completed,
          sender: "system",
          timestamp: formatTime(),
        };

        setMessages((prev) => [...prev, transferMessage]);
      }, 2000); // 2 segundos de animación de transferencia
      return;
    }

    // Simular que Alaiza está pensando
    setIsTyping(true);
    setTypingMessage("");

    // Simular respuesta después de un delay
    setTimeout(
      () => {
        const randomResponse = generateResponse(userInput);

        // Efecto de typing palabra por palabra
        const words = randomResponse.split(" ");
        let currentWordIndex = 0;
        let currentText = "";

        // Limpiar intervalo anterior si existe
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }

        typingIntervalRef.current = setInterval(
          () => {
            if (currentWordIndex < words.length) {
              currentText += (currentText ? " " : "") + words[currentWordIndex];
              setTypingMessage(currentText);
              currentWordIndex++;
            } else {
              if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
              }

              // Agregar mensaje completo al historial
              const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: randomResponse,
                sender: "bot",
                timestamp: formatTime(),
              };

              setMessages((prev) => [...prev, botMessage]);
              setIsTyping(false);
              setTypingMessage("");
            }
          },
          100 + Math.random() * 50
        ); // 100-150ms por palabra
      },
      800 + Math.random() * 400
    ); // 0.8-1.2 segundos antes de empezar a escribir
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping, typingMessage, isTransferring, isTransferred]);

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);


  return (
    <div className="rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">{translations.preview.title}</h2>
      </div>
      <div className="relative -mx-6 w-[calc(100%+3rem)] py-12">
        <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ minHeight: "850px" }}>
          {/* Base gradient background */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 1) 50%, rgba(15, 23, 42, 0.95) 100%)"
                : "linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 1) 50%, rgba(241, 245, 249, 0.95) 100%)",
            }}
          ></div>

          <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
          <EdgeFadeOverlay isDarkMode={isDarkMode} />

          {/* Additional halftone layer */}
          <div
            className="absolute inset-0 rounded-3xl mix-blend-overlay"
            style={{
              backgroundImage: isDarkMode
                ? `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1.2px, transparent 0)`
                : `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.12) 1.2px, transparent 0)`,
              backgroundSize: "28px 28px",
              opacity: 0.5,
              animation: "halftonePulse 8s ease-in-out infinite",
            }}
          ></div>
        </div>

        <div className="relative mx-auto max-w-[340px] z-10">
          {/* iPhone Frame */}
          <div className="relative mx-auto">
            {/* Outer frame with iPhone-like design */}
            <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
              {/* Screen - Fixed height container */}
              <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
                {/* Status bar with Dynamic Island and icons aligned */}
                <div className="relative flex items-center justify-between bg-white dark:bg-black px-6 pt-10 pb-2 flex-shrink-0">
                  {/* Left side - Time aligned with Dynamic Island */}
                  <div className="absolute left-6 top-4 flex items-center">
                    <span className="text-xs font-semibold text-black dark:text-white">9:41</span>
                  </div>

                  {/* Center - Dynamic Island */}
                  <div className="absolute left-1/2 top-3 -translate-x-1/2">
                    <div className="h-5 w-24 rounded-full bg-black dark:bg-white/20"></div>
                    {/* Speaker */}
                    <div className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-white/30"></div>
                  </div>

                  {/* Right side - Signal and Battery aligned with Dynamic Island */}
                  <div className="absolute right-6 top-4 flex items-center gap-1.5">
                    <svg className="h-3 w-5" fill="none" viewBox="0 0 20 12">
                      <path
                        d="M1 8h2v2H1V8zm3-2h2v4H4V6zm3-2h2v6H7V4zm3-1h2v7h-2V3z"
                        fill="currentColor"
                        className="text-black dark:text-white"
                      />
                    </svg>
                    <div className="h-2.5 w-6 rounded-sm border border-black dark:border-white">
                      <div className="h-full w-4/5 rounded-sm bg-black dark:bg-white"></div>
                    </div>
                  </div>
                </div>

                {/* Content area - Scrollable with fixed height */}
                <div className="flex-1 min-h-0 bg-white dark:bg-black overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <ChatPreview
                    messages={messages}
                    inputText={inputText}
                    isTyping={isTyping}
                    typingMessage={typingMessage}
                    isTransferring={isTransferring}
                    isTransferred={isTransferred}
                    isDarkMode={isDarkMode}
                    onInputChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onSendMessage={handleSendMessage}
                    maxInputLength={config.maxInputLength}
                    maxFileSize={config.maxFileSize}
                  />
                </div>

                {/* Home indicator - Fixed at bottom */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-shrink-0">
                  <div className="h-1 w-32 rounded-full bg-black/30 dark:bg-white/30"></div>
                </div>
              </div>

              {/* Side buttons */}
              <div className="absolute -left-1 top-24 h-12 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
              <div className="absolute -left-1 top-40 h-8 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
              <div className="absolute -right-1 top-32 h-10 w-1 rounded-r bg-gray-800 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
