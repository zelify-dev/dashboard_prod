"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type AlaizaTranslations = {
  breadcrumb: string;
  preview: {
    title: string;
    assistant: {
      name: string;
      subtitle: string;
    };
    humanAgent: {
      name: string;
      connected: string;
    };
    transfer: {
      transferring: string;
      subtitle: string;
      completed: string;
    };
    input: {
      placeholder: string;
      placeholderTransferred: string;
      fileWarning: string;
      exceedsLimit: string;
      maxFilesAlert: string;
      allowed: string;
    };
    initialMessage: string;
    responses: {
      notUnderstood: string;
      greetings: string;
      balance: {
        check: string;
        review: string;
      };
      transfers: {
        howTo: string;
        general: string;
      };
      payments: {
        card: string;
        general: string;
      };
      cards: {
        block: string;
        activate: string;
        limit: string;
        manage: string;
      };
      transactions: string;
      configuration: string;
      activate: string;
      security: string;
      problems: string;
      help: string;
      goodbye: string;
      generic: string;
    };
  };
  config: {
    title: string;
    description: string;
    messageLength: {
      title: string;
      maxInputLabel: string;
      maxOutputLabel: string;
      short: string;
      medium: string;
      long: string;
      exampleMessage: string;
      exampleResponse: string;
      showingFirst: string;
      ofTotal: string;
      characters: string;
    };
    conversationLimits: {
      title: string;
      maxConversationsLabel: string;
      maxChatAccessLabel: string;
      short: string;
      moderate: string;
      long: string;
      few: string;
      many: string;
      exampleFlow: string;
      conversationWith: string;
      transferToHuman: string;
      afterConversations: string;
      conversation: string;
      conversations: string;
      withAI: string;
      willTransfer: string;
      exampleAccess: string;
      timesPerDay: string;
      time: string;
      times: string;
      eachUserCanAccess: string;
      perDay: string;
      dailyLimitWarning: string;
    };
    fileUpload: {
      title: string;
      maxFilesLabel: string;
      maxFileSizeLabel: string;
      visualExample: string;
      usersCanUpload: string;
      file: string;
      files: string;
      sizeExample: string;
      maxSizeAllowed: string;
      sizeWarning: string;
    };
  };
};

const ALAIZA_TRANSLATIONS: Record<Language, AlaizaTranslations> = {
  en: {
    breadcrumb: "Alaiza",
    preview: {
      title: "Mobile Preview",
      assistant: {
        name: "Alaiza",
        subtitle: "AI Financial Assistant",
      },
      humanAgent: {
        name: "Human Agent",
        connected: "Connected",
      },
      transfer: {
        transferring: "Transferring to human agent...",
        subtitle: "An agent will connect with you shortly",
        completed: "Transfer completed. A human agent will connect with you shortly.",
      },
      input: {
        placeholder: "Type your message...",
        placeholderTransferred: "The human agent will connect soon...",
        fileWarning: "Files exceeding this limit will trigger an additional charge warning",
        exceedsLimit: "exceeds limit",
        maxFilesAlert: "Maximum",
        allowed: "allowed",
      },
      initialMessage: "Hello! I'm Alaiza, your AI financial assistant. How can I help you today?",
      responses: {
        notUnderstood: "Sorry, I didn't understand your message. Could you rephrase it?",
        greetings: "Hello! I'm Alaiza, your financial assistant. How can I help you today?",
        balance: {
          check: "To check your balance, go to the Accounts section. Your current balance will be displayed there. Need help accessing it?",
          review: "I can help you check your balance. Do you want to see your current balance or transaction history?",
        },
        transfers: {
          howTo: "To make a transfer, go to Payments > Transfers. You'll need the destination account number and amount. Would you like me to guide you step by step?",
          general: "To make a transfer, go to the Payments section. Is it a transfer to another account of yours or to a third party?",
        },
        payments: {
          card: "To pay your credit card, go to Cards > Pay card. You can pay the minimum amount or the full balance. Which do you prefer?",
          general: "To make a payment, go to the Payments section. Is it a service payment, card payment, or bill?",
        },
        cards: {
          block: "To block your card, go to Cards > Manage card > Block. You can also call customer service. Was your card lost or stolen?",
          activate: "To activate a new card, go to Cards > Activate card. Enter the card details when you receive it. Have you received it yet?",
          limit: "To check your card limit, go to Cards > Details. You'll see your available and used limit there. Would you like to increase your limit?",
          manage: "To manage your card, go to Cards in the main menu. What do you need to do with your card?",
        },
        transactions: "To see your transactions, go to Accounts > Transaction history. You can filter by date, type, or amount. What period would you like to review?",
        configuration: "I can help you with configuration. What would you like to set up? Notifications, security, transaction limits, or something else?",
        activate: "To activate that feature, go to Settings > Account Options. What specific feature would you like to activate?",
        security: "To change your password or PIN, go to Settings > Security. You can also enable two-factor authentication there. What security aspect do you need?",
        problems: "I'm sorry to hear you're having a problem. Could you tell me more details? Is it with a transaction, account access, or something else?",
        help: "Sure, I'm here to help. I can assist you with transactions, balance inquiries, cards, configuration, and more. What do you need assistance with?",
        goodbye: "You're welcome! If you need anything else, I'll be here to help. Have a great day!",
        generic: "I understand. I can help with that. Could you provide more details about what you need?",
      },
    },
    config: {
      title: "Configuration",
      description: "Configure Alaiza AI assistant settings for mobile",
      messageLength: {
        title: "Message Length",
        maxInputLabel: "Maximum Input Length",
        maxOutputLabel: "Maximum Output Length",
        short: "Short message",
        medium: "Medium message",
        long: "Long message",
        exampleMessage: "Example message",
        exampleResponse: "Example response",
        showingFirst: "Showing first",
        ofTotal: "of",
        characters: "characters",
      },
      conversationLimits: {
        title: "Conversation Limits",
        maxConversationsLabel: "Max AI Conversations (before human handoff)",
        maxChatAccessLabel: "Max Chat Access (times per day)",
        short: "Short conversation",
        moderate: "Moderate conversation",
        long: "Long conversation",
        few: "Few times",
        many: "Many times",
        exampleFlow: "Example flow:",
        conversationWith: "Conversation",
        transferToHuman: "Transfer to human agent",
        afterConversations: "After",
        conversation: "conversation",
        conversations: "conversations",
        withAI: "with the AI",
        willTransfer: "it will automatically transfer to a human agent",
        exampleAccess: "Example access:",
        timesPerDay: "times per day",
        time: "time",
        times: "times",
        eachUserCanAccess: "Each user will be able to access the chat up to",
        perDay: "per day",
        dailyLimitWarning: "⚠️ After the daily limit, access will be restricted until the next day",
      },
      fileUpload: {
        title: "File Upload Limits",
        maxFilesLabel: "Maximum Files",
        maxFileSizeLabel: "Maximum File Size (MB)",
        visualExample: "Visual example:",
        usersCanUpload: "Users will be able to upload up to",
        file: "file",
        files: "files",
        sizeExample: "Example of allowed size:",
        maxSizeAllowed: "Maximum size allowed per file:",
        sizeWarning: "⚠️ Files exceeding 200MB will show an additional charge warning",
      },
    },
  },
  es: {
    breadcrumb: "Alaiza",
    preview: {
      title: "Vista previa móvil",
      assistant: {
        name: "Alaiza",
        subtitle: "Asistente Financiero IA",
      },
      humanAgent: {
        name: "Agente Humano",
        connected: "Conectado",
      },
      transfer: {
        transferring: "Transfiriendo a agente humano...",
        subtitle: "Un agente se Connectá contigo en breve",
        completed: "Transferencia completada. Un agente humano se Connectá contigo en breve.",
      },
      input: {
        placeholder: "Escribe tu mensaje...",
        placeholderTransferred: "El agente humano se Connectá pronto...",
        fileWarning: "Los archivos que excedan este límite mostrarán una advertencia de cargo adicional",
        exceedsLimit: "excede límite",
        maxFilesAlert: "Máximo",
        allowed: "permitido",
      },
      initialMessage: "¡Hola! Soy Alaiza, tu asistente financiero IA. ¿En qué puedo ayudarte hoy?",
      responses: {
        notUnderstood: "Disculpa, no entendí tu mensaje. ¿Podrías reformularlo de otra manera?",
        greetings: "¡Hola! Soy Alaiza, tu asistente financiero. ¿En qué puedo ayudarte hoy?",
        balance: {
          check: "Para consultar tu saldo, ve a la sección de Cuentas. Tu saldo actual se mostrará allí. ¿Necesitas ayuda para acceder?",
          review: "Puedo ayudarte a revisar tu saldo. ¿Quieres ver el saldo actual o el historial de movimientos?",
        },
        transfers: {
          howTo: "Para hacer una transferencia, ve a Pagos > Transferencias. Necesitarás el número de cuenta destino y el monto. ¿Quieres que te guíe paso a paso?",
          general: "Para realizar una transferencia, ve a la sección de Pagos. ¿Es una transferencia a otra cuenta tuya o a un tercero?",
        },
        payments: {
          card: "Para pagar tu tarjeta de crédito, ve a Tarjetas > Pagar tarjeta. Puedes pagar el monto mínimo o el total. ¿Cuál prefieres?",
          general: "Para realizar un pago, ve a la sección de Pagos. ¿Es un pago de servicios, tarjeta o factura?",
        },
        cards: {
          block: "Para bloquear tu tarjeta, ve a Tarjetas > Gestionar tarjeta > Bloquear. También puedes llamar al servicio al cliente. ¿Tu tarjeta fue perdida o robada?",
          activate: "Para activar una nueva tarjeta, ve a Tarjetas > Activar tarjeta. Ingresa los datos de la tarjeta cuando la recibas. ¿Ya la recibiste?",
          limit: "Para consultar el límite de tu tarjeta, ve a Tarjetas > Detalles. Allí verás tu límite disponible y utilizado. ¿Quieres aumentar tu límite?",
          manage: "Para gestionar tu tarjeta, ve a Tarjetas en el menú principal. ¿Qué necesitas hacer con tu tarjeta?",
        },
        transactions: "Para ver tus movimientos, ve a Cuentas > Historial de transacciones. Puedes filtrar por fecha, tipo o monto. ¿Qué período quieres revisar?",
        configuration: "Puedo ayudarte con la configuración. ¿Qué quieres configurar? Notificaciones, seguridad, límites de transacción, u otra cosa?",
        activate: "Para activar esa función, ve a Configuración > Opciones de cuenta. ¿Qué función específica quieres activar?",
        security: "Para cambiar tu contraseña o PIN, ve a Configuración > Seguridad. También puedes activar la autenticación de dos factores allí. ¿Qué aspecto de seguridad necesitas?",
        problems: "Lamento escuchar que tienes un problema. ¿Podrías contarme más detalles? ¿Es con una transacción, acceso a la cuenta, o algo más?",
        help: "Claro, estoy aquí para ayudarte. Puedo ayudarte con transacciones, consultas de saldo, tarjetas, configuración y más. ¿Con qué necesitas asistencia?",
        goodbye: "¡De nada! Si necesitas algo más, estaré aquí para ayudarte. ¡Que tengas un buen día!",
        generic: "Entiendo. Puedo ayudarte con eso. ¿Podrías darme más detalles sobre lo que necesitas?",
      },
    },
    config: {
      title: "Configuración",
      description: "Configura los ajustes del asistente IA Alaiza para móvil",
      messageLength: {
        title: "Longitud de Mensaje",
        maxInputLabel: "Longitud Máxima de Entrada",
        maxOutputLabel: "Longitud Máxima de Salida",
        short: "Mensaje corto",
        medium: "Mensaje medio",
        long: "Mensaje largo",
        exampleMessage: "Ejemplo de mensaje",
        exampleResponse: "Ejemplo de respuesta",
        showingFirst: "Mostrando primeros",
        ofTotal: "de",
        characters: "caracteres",
      },
      conversationLimits: {
        title: "Límites de Conversación",
        maxConversationsLabel: "Máximo de Conversaciones IA (antes de transferencia humana)",
        maxChatAccessLabel: "Máximo de Accesos al Chat (veces por día)",
        short: "Conversación corta",
        moderate: "Conversación moderada",
        long: "Conversación larga",
        few: "Pocas veces",
        many: "Muchas veces",
        exampleFlow: "Ejemplo de flujo:",
        conversationWith: "Conversación",
        transferToHuman: "Transferencia a agente humano",
        afterConversations: "Después de",
        conversation: "conversación",
        conversations: "conversaciones",
        withAI: "con la IA",
        willTransfer: "se transferirá automáticamente a un agente humano",
        exampleAccess: "Ejemplo de acceso:",
        timesPerDay: "veces al día",
        time: "vez",
        times: "veces",
        eachUserCanAccess: "Cada usuario podrá acceder al chat hasta",
        perDay: "por día",
        dailyLimitWarning: "⚠️ Después del límite diario, el acceso será restringido hasta el día siguiente",
      },
      fileUpload: {
        title: "Límites de Carga de Archivos",
        maxFilesLabel: "Máximo de Archivos",
        maxFileSizeLabel: "Tamaño Máximo de Archivo (MB)",
        visualExample: "Ejemplo visual:",
        usersCanUpload: "Los usuarios podrán subir hasta",
        file: "archivo",
        files: "archivos",
        sizeExample: "Ejemplo de tamaño permitido:",
        maxSizeAllowed: "Tamaño máximo permitido por archivo:",
        sizeWarning: "⚠️ Archivos que excedan 200MB mostrarán una advertencia de cargo adicional",
      },
    },
  },
};

export function useAlaizaTranslations() {
  return useLanguageTranslations(ALAIZA_TRANSLATIONS);
}

