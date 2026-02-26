"use client";

import { useState } from "react";
import { SimpleSelect } from "@/components/FormElements/simple-select";

const DOCS_BASE_URL = "https://documentations.zelify.com/servicios-financieros";

interface Service {
  title: string;
  description: string;
  docAnchor?: string; // Anchor para el enlace específico en la documentación
}

interface Product {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  services?: Service[];
}

const PRODUCTS: Product[] = [
  {
    id: "zelify-auth",
    title: "AUTH",
    subtitle: "Instantly verify bank accounts",
    description:
      "Authenticate users and verify their bank accounts in real-time with secure, instant verification.",
    category: "auth",
    services: [
      {
        title: "Autenticación",
        description:
          "Permite registrar, autenticar y autorizar usuarios de forma segura en aplicaciones web y móviles. Gestiona el inicio de sesión con credenciales propias o de terceros (Google, Apple, Facebook).",
        docAnchor: "autenticaci%C3%B3n",
      },
      {
        title: "Geolocalización",
        description:
          "Permite transformar direcciones en coordenadas y viceversa, para localizar, mapear o analizar ubicaciones con precisión en aplicaciones de transporte, logística, comercio o validación de domicilios.",
        docAnchor: "geolocalizaci%C3%B3n",
      },
      {
        title: "Información de dispositivo",
        description:
          "SDK para React Native y Expo que permite obtener información del dispositivo, como su IP, dirección MAC, versión del dispositivo móvil, versión del sistema operativo y permisos de acceso.",
        docAnchor: "informaci%C3%B3n-de-dispositivo",
      },
    ],
  },
  {
    id: "zelify-identity",
    title: "IDENTITY",
    subtitle: "Verify user identity securely",
    description:
      "Redefine la forma en que las personas se validan en el entorno digital. A través de tecnología avanzada de reconocimiento facial, extracción documental y verificación por video, crea un proceso de identificación rápido, seguro y sin fricciones. Cada identidad validada se convierte en un perfil digital reutilizable dentro del ecosistema Zelify, impulsando la confianza y simplificando la autenticación en múltiples servicios y canales.",
    category: "identity",
    services: [
      {
        title: "Extracción documental",
        description:
          "Servicio de reconocimiento óptico de caracteres (OCR) para extraer y validar información de documentos oficiales como cédula, pasaporte o licencia, contrastando los datos con bases internas o externas.",
        docAnchor: "extracci%C3%B3n-documental",
      },
      {
        title: "Verificación biométrica",
        description:
          "Comparación facial y validación biométrica que contrasta la selfie del usuario con la imagen del documento(cédula, pasaporte o licencia), aplicando prueba de vida (liveness) para prevenir fraudes por suplantación.",
        docAnchor: "verificaci%C3%B3n-biom%C3%A9trica",
      },
      {
        title: "Verificación de vídeo",
        description:
          "Verificación por video que combina reconocimiento facial, registro de voz y confirmación humana cuando se requiere un nivel adicional de seguridad.",
        docAnchor: "verificaci%C3%B3n-de-v%C3%ADdeo",
      },
      {
        title: "Integration Layer (SDK/API)",
        description:
          "Centraliza la identidad digital para su reutilización en otros módulos a través de APIs o SDKs.",
        docAnchor: "integration-layer-sdkapi",
      },
    ],
  },
  {
    id: "zelify-aml",
    title: "AML",
    subtitle: "Anti-money laundering compliance",
    description:
      "Permite evaluar el riesgo de cada usuario y operación mediante verificaciones automáticas en listas internacionales e internas, supervisión continua de transacciones y análisis de medios adversos. Con estos procesos, detecta comportamientos inusuales, señales de lavado de activos o financiamiento ilícito y genera alertas preventivas. Además, integra herramientas de inteligencia de riesgo que facilitan decisiones informadas y fortalecen el cumplimiento regulatorio dentro del ecosistema financiero.",
    category: "AML",
    services: [
      {
        title: "Evaluación en listas globales",
        description:
          "Cruza datos contra más de 32 listas internacionales de sanciones, PEP y observación (OFAC, ONU, UE, Interpol, FinCEN, entre otras), identificando coincidencias y generando alertas de riesgo con precisión.",
        docAnchor: "evaluaci%C3%B3n-en-listas-globales",
      },
      {
        title: "Evaluación en listas internas",
        description:
          "Permite cargar listas propias de la empresa e incorporarlas al flujo de validación AML como verificación adicional.",
        docAnchor: "evaluaci%C3%B3n-en-listas-internas",
      },
      {
        title: "Monitoreo de Operaciones",
        description:
          "Supervisa transacciones y comportamientos financieros sospechosos en tiempo real, aplicando reglas dinámicas y puntuaciones de riesgo ajustadas al perfil del usuario.",
        docAnchor: "monitoreo-de-operaciones",
      },
      {
        title: "Medios Adversos e Inteligencia de Riesgo",
        description:
          "Identifica noticias negativas, reportes y menciones públicas que puedan afectar la reputación o el cumplimiento del cliente.",
        docAnchor: "medios-adversos-e-inteligencia-de-riesgo",
      },
    ],
  },
  {
    id: "zelify-connect",
    title: "CONNECT",
    subtitle: "Seamless financial connections",
    description:
      "Conecta cuentas bancarias de forma segura, verifica la titularidad, habilita acceso a datos financieros con consentimiento y gestiona cuentas digitales, incluida la creación de CLABE en México. Incluye un SDK de vinculación para integrar el flujo en web y móvil.",
    category: "payments",
    services: [
      {
        title: "Vinculación de cuentas bancarias",
        description:
          "Vincula cuentas bancarias mediante tokens temporales o autenticación OAuth, compatible con más de 250 instituciones financieras.",
        docAnchor: "vinculaci%C3%B3n-de-cuentas-bancarias",
      },
      {
        title: "Verificación de Cuenta y Titularidad",
        description:
          "La empresa puede cargar sus propias listas y forman parte dentro del proceso de validación AML para una validación adicional.",
        docAnchor: "verificaci%C3%B3n-de-cuenta-y-titularidad",
      },
      {
        title: "Acceso a Datos Financieros",
        description:
          "Supervisa transacciones y comportamientos financieros sospechosos en tiempo real, aplicando reglas dinámicas y puntuaciones de riesgo automatizadas según el perfil del usuario.",
        docAnchor: "acceso-a-datos-financieros",
      },
      {
        title: "Cuentas digitales",
        description:
          "Permite crear cuentas digitales de un usuario, asociarles un número de cuenta y crear un esquema completo para utilizar los servicios de Transfers.",
        docAnchor: "cuentas-digitales",
      },
      {
        title: "Creación de cuentas CLABE",
        description:
          "En México permite crear cuentas CLABE bajo diferentes números secuenciales para disponibilizar cuentas operativas.",
        docAnchor: "creaci%C3%B3n-de-cuentas-clabe",
      },
      {
        title: "Linking SDK",
        description:
          "SDK para integrar el flujo de vinculación en aplicaciones web y móviles, facilitando la obtención de tokens temporales y el manejo del estado de la vinculación.",
        docAnchor: "linking-sdk",
      },
    ],
  },
  {
    id: "zelify-cards",
    title: "CARDS",
    subtitle: "Virtual and physical card solutions",
    description:
      "Plataforma para emisión y procesamiento de tarjetas que cubre el ciclo completo: emisión física y virtual, tokenización, autenticación 3DS, disputas y contracargos, wallets digitales, control de riesgo, suscripciones y analítica.",
    category: "payments",
    services: [
      {
        title: "Emisión (Issuing)",
        description:
          "Emitir y distribuir todo tipo de tarjetas, ya sean nominadas, innominadas, virtuales, físicas, con diseño horizontal o vertical.",
        docAnchor: "emisi%C3%B3n-issuing",
      },
      {
        title: "Procesamiento & Plataforma",
        description:
          "Gestiona el flujo completo de las transacciones con tarjetas (crédito, débito o prepago), incluyendo autorización, ajustes, conciliación y notificaciones.",
        docAnchor: "procesamiento-plataforma",
      },
      {
        title: "Tokenización",
        description:
          "Es un proceso de seguridad financiera que reemplaza datos sensibles por un token: un identificador único, seguro y sin valor fuera del sistema que lo generó.",
        docAnchor: "tokenizaci%C3%B3n",
      },
      {
        title: "3DS",
        description:
          "Autenticación 3DS (challenge/frictionless), autentica transacciones mediante códigos OTP, gestionando su validación y notificación por webhook, email o SMS.",
        docAnchor: "3ds",
      },
      {
        title: "Disputas & Contracargos",
        description:
          "El servicio de contracargos automatiza la gestión de disputas, permitiendo a emisores y procesadores resolver reclamos con trazabilidad, cumplimiento y eficiencia.",
        docAnchor: "disputas-contracargos",
      },
      {
        title: "Agregación de cuenta con tarjeta",
        description:
          "Permite que tarjeta se vincule como fuente de validación con cuentas bancarias.",
        docAnchor: "agregaci%C3%B3n-de-cuenta-con-tarjeta",
      },
      {
        title: "Wallets Digitales",
        description:
          "Soporte para Apple Pay, Google Pay u otros wallets, tokenización EMVCo, emisión digital segura.",
        docAnchor: "wallets-digitales",
      },
      {
        title: "Tarjetas corporativas",
        description:
          "Emite tarjetas de crédito o débito para empresas, con control de gastos, límites por empleado y reportes en tiempo real con marca corporativa completa.",
        docAnchor: "tarjetas-corporativas",
      },
      {
        title: "Servicio de Cashback",
        description:
          "Permite que tarjetas tengan beneficios, cashback, puntos, promociones personalizadas.",
        docAnchor: "servicio-de-cashback",
      },
      {
        title: "Gestión de Suscripciones",
        description:
          "Automatiza cobros recurrentes, renovaciones y recordatorios de pago mediante tokens seguros y soporte para múltiples medios de pago.",
        docAnchor: "gesti%C3%B3n-de-suscripciones",
      },
      {
        title: "Control de Riesgo & Reglas Dinámicas",
        description:
          "Reglas personalizadas por cliente, límites de gasto, bloqueo automático, alertas.",
        docAnchor: "control-de-riesgo-reglas-din%C3%A1micas",
      },
      {
        title: "Reportes, Auditoría & Analytics",
        description:
          "Dashboards, conciliaciones automáticas, métricas de autorización, uso, fraude, exportes en tiempo real.",
        docAnchor: "reportes-auditor%C3%ADa-analytics",
      },
    ],
  },
  {
    id: "zelify-transfers",
    title: "TRANSFERS",
    subtitle: "Send and receive money instantly",
    description:
      "Gestiona transferencias nacionales e internacionales, validación previa (quote), verificación de cuentas y saldos, procesamiento y conciliación en tiempo real, notificaciones, límites transaccionales, pagos de servicios, favoritos y generación de estados de cuenta y reportes en PDF.",
    category: "payments",
    services: [
      {
        title: "Cotización y validación de Transferencias (Quote)",
        description:
          "Genera una simulación previa de la transferencia tanto nacional e internacional, comisiones (fees) y validaciones del monto bajo restricciones personalizadas.",
        docAnchor: "cotizaci%C3%B3n-y-validaci%C3%B3n-de-transferencias-quote",
      },
      {
        title: "Transferencias internas",
        description:
          "Permite ejecutar envíos entre cuentas digitales Zelify, aplicando validaciones automáticas de usuario, saldo, y límites transaccionales.",
        docAnchor: "transferencias-internas",
      },
      {
        title: "Transferencias interbancarias o locales",
        description:
          "Permite hacer transferencias de un banco a otro diferente en países como México, Colombia, Chile y Estados Unidos.",
        docAnchor: "transferencias-interbancarias-o-locales",
      },
      {
        title: "Validación de cuentas y saldos",
        description:
          "Permite comprobar si una cuenta existe, está habilitada para transferir y su saldo actual o balance.",
        docAnchor: "validaci%C3%B3n-de-cuentas-y-saldos",
      },
      {
        title: "Procesamiento y conciliación",
        description:
          "En tiempo real permite conocer el estado de una transacción.",
        docAnchor: "procesamiento-y-conciliaci%C3%B3n",
      },
      {
        title: "Notificaciones transaccionales",
        description:
          "Cuando se realiza alguna transferencia o movimiento, este servicio permite notificar al usuario por SMS/correo electrónico o por Whatsapp.",
        docAnchor: "notificaciones-transaccionales",
      },
      {
        title: "Limites transaccionales",
        description:
          "Permite setear reglas personalizadas y límites transaccionales para los tipos de cuenta de una organización.",
        docAnchor: "limites-transaccionales",
      },
      {
        title: "Notificaciones Pay-ins/ Cash-ins",
        description:
          "Permite gestionar notificaciones cuando hay un ingreso de dinero a una cuenta sea por una transferencia recibida o un depósito.",
        docAnchor: "notificaciones-pay-ins-cash-ins",
      },
      {
        title: "Notificaciones Cash-out/Pay-outs",
        description:
          "Permite gestionar notificaciones de transferencias de dinero a otras plazas de una cuenta, cuando ya se realizaron correctamente o sus estados.",
        docAnchor: "notificaciones-cash-outpay-outs",
      },
      {
        title: "Obtener compañías para pagos de servicios en un país",
        description:
          "Permite listar todas las compañías habilitadas dentro de un país de operación para poder hacer pagos de servicios básicos.",
        docAnchor: "obtener-compa%C3%B1%C3%ADas-para-pagos-de-servicios-en-un-pa%C3%ADs",
      },
      {
        title: "Pagos de servicios básicos",
        description:
          "Permite ejecutar un pago, debitando del dinero del usuario, a un Servicios Básicos sin necesidad de mucha información como su cédula que se puede extraer directamente del producto Zelify Identity.",
        docAnchor: "pagos-de-servicios-b%C3%A1sicos",
      },
      {
        title: "Configurar favoritos para pagos de servicios",
        description:
          "Permite al usuario vincular una lista de favoritos para sus servicios básicos.",
        docAnchor: "configurar-favoritos-para-pagos-de-servicios",
      },
      {
        title: "Estados de cuentas y reportes PDFs",
        description:
          "Permite obtener los estados de cuentas en formato PDF y otros reportes.",
        docAnchor: "estados-de-cuentas-y-reportes-pdfs",
      },
    ],
  },
  {
    id: "zelify-tx",
    title: "TX",
    subtitle: "Transaction management",
    description:
      "Cotiza FX con márgenes y comisiones, valida cuentas destino (SWIFT), inicia la transferencia y ofrece seguimiento en tiempo real del estado con comprobantes digitales. Cierra con liquidación internacional y conciliación, generando reportes por montos, divisas convertidas y cargos aplicados.",
    category: "payments",
    services: [
      {
        title: "Cotización y Conversión de Divisas (FX Quote)",
        description:
          "Permite obtener tasas de cambio dinámicas entre monedas locales e internacionales, aplicando márgenes de tipo de cambio, comisiones y proveedores preferenciales.",
        docAnchor: "cotizaci%C3%B3n-y-conversi%C3%B3n-de-divisas-fx-quote",
      },
      {
        title: "Validación de Cuentas Internacionales",
        description:
          "Verifica que las cuentas receptoras cumplan con formato IBAN, CLABE o SWIFT según el país, garantizando la validez antes de ejecutar la remesa.",
        docAnchor: "validaci%C3%B3n-de-cuentas-internacionales",
      },
      {
        title: "Inicio de Transferencia (Transfer Initiation)",
        description:
          "Genera la operación de envío internacional con datos del remitente, beneficiario, monto, divisa, país destino y propósito del pago.",
        docAnchor: "inicio-de-transferencia-transfer-initiation",
      },
      {
        title: "Seguimiento y Confirmación (Journey Operations)",
        description:
          "Permite rastrear el estado de la remesa en tiempo real (processing, completed, failed) y obtener comprobantes digitales para auditoría y conciliación.",
        docAnchor: "seguimiento-y-confirmaci%C3%B3n-journey-operations",
      },
      {
        title: "Liquidación Internacional y Reconciliación",
        description:
          "Ejecuta conciliaciones automáticas con las redes de pago internacionales, generando reportes detallados de operación, márgenes, comisiones y divisas convertidas.",
        docAnchor: "liquidaci%C3%B3n-internacional-y-reconciliaci%C3%B3n",
      },
    ],
  },
  {
    id: "zelify-payments",
    title: "PAYMENTS",
    subtitle: "Complete payment infrastructure",
    description:
      "Plataforma de pagos unificada para aceptar tarjetas (crédito/débito), billeteras digitales, transferencias y métodos alternativos en una sola integración. Incluye SDKs para web y móvil, soporte de QR, tokenización y flujos optimizados de checkout, suscripciones y pagos recurrentes.",
    category: "payments",
    services: [
      {
        title: "Procesamiento Multi-plataforma",
        description:
          "Aceptación unificada de pagos con tarjetas (crédito/débito), billeteras digitales, transferencias y métodos alternativos en una sola integración.",
        docAnchor: "procesamiento-multi-plataforma",
      },
      {
        title: "SDK con QR",
        description:
          "Librería de desarrollo que integra capacidades de generación y lectura de códigos QR para transacciones seguras y rápidas en aplicaciones nativas.",
        docAnchor: "sdk-con-qr",
      },
      {
        title: "Tokenización",
        description:
          "Almacenamiento seguro de datos de pago mediante tokens, permitiendo transacciones recurrentes y one-click purchases sin exponer información sensible.",
        docAnchor: "tokenizaci%C3%B3n",
      },
      {
        title: "Pagos Recurrentes",
        description:
          "Sistema inteligente para suscripciones y cobros automáticos con gestión de reintentos, actualización de métodos y lógica de recuperación.",
        docAnchor: "pagos-recurrentes",
      },
      {
        title: "Checkout Express",
        description:
          "Flujo de pago rápido y optimizado para conversión inmediata.",
        docAnchor: "checkout-express",
      },
      {
        title: "Llaves Personalizadas",
        description:
          "Sistema de identificación único por usuario que facilita pagos rápidos sin necesidad de ingresar datos repetidamente.",
        docAnchor: "llaves-personalizadas",
      },
      {
        title: "Medios de Contacto",
        description:
          "Procesamiento de pagos mediante diferentes canales de identificación (email, teléfono, ID único) según preferencia del usuario.",
        docAnchor: "medios-de-contacto",
      },
      {
        title: "SDK",
        description:
          "Librerías de desarrollo pre-construidas para integración rápida y personalizable en aplicaciones móviles y web.",
        docAnchor: "sdk",
      },
    ],
  },
  {
    id: "zelify-notifications",
    title: "NOTIFICATIONS",
    subtitle: "Template automation for alerts",
    description:
      "Centraliza la gestión de plantillas de mailing y push para flujos transaccionales, marketing contextual y alertas operativas. Permite versionar HTML, activar variaciones por canal, ejecutar pruebas de contenido y asegurar que siempre exista una única plantilla activa por categoría.",
    category: "engagement",
    services: [
      {
        title: "Workspace de plantillas",
        description:
          "Dashboard visual para agrupar plantillas por canal, revisar su estado y controlar qué versión está activa.",
        docAnchor: "workspace-de-plantillas",
      },
      {
        title: "Versionado y pruebas",
        description:
          "Comparte variaciones A/B, previsualiza HTML, detecta errores y guarda versiones antes de publicarlas.",
        docAnchor: "versionado-y-pruebas",
      },
      {
        title: "Activación omnicanal",
        description:
          "Sincroniza mailing, push e in-app asegurando consistencia en mensajes operativos y regulatorios.",
        docAnchor: "activaci%C3%B3n-omnicanal",
      },
      {
        title: "Alertas y auditoría",
        description:
          "Registra quién cambió una plantilla, cuándo se activó y qué impacto tuvo en las métricas.",
        docAnchor: "alertas-y-auditor%C3%ADa",
      },
    ],
  },
  {
    id: "zelify-discounts",
    title: "DISCOUNTS & COUPONS",
    subtitle: "Promotional offers and discounts",
    description:
      "Centraliza la relación con comercios para crear y difundir beneficios. Permite registrar negocios con su información operativa, diseñar y publicar descuentos o campañas, geolocalizar establecimientos en el mapa y habilitar pagos con posterior liquidación dentro de la red Zelify. Incluye reportes comerciales para seguimiento de ventas, redenciones y conciliación.",
    category: "financial",
    services: [
      {
        title: "Registro de comercios",
        description:
          "Permite a los negocios crear su perfil dentro de Zelify, incluir datos de contacto, sucursales, horarios y categorías de servicio.",
        docAnchor: "registro-de-comercios",
      },
      {
        title: "Gestión de descuentos y promociones",
        description:
          "Módulo que permite a los comercios diseñar, publicar y administrar descuentos exclusivos o campañas promocionales.",
        docAnchor: "gesti%C3%B3n-de-descuentos-y-promociones",
      },
      {
        title: "Geolocalización de Comercios",
        description:
          "Visualiza los establecimientos en el mapa interactivo de Zelify, permitiendo a los usuarios encontrar negocios cercanos con beneficios activos.",
        docAnchor: "geolocalizaci%C3%B3n-de-comercios",
      },
      {
        title: "Pagos y Liquidación Comercial",
        description:
          "Permite a los comercios recibir pagos electrónicos, gestionar su flujo de fondos y realizar conciliaciones automáticas con la red Zelify.",
        docAnchor: "pagos-y-liquidaci%C3%B3n-comercial",
      },
      {
        title: "Análisis y Reportes Comerciales",
        description:
          "Genera reportes detallados de ventas, redenciones de descuentos, seguimiento de campañas y conciliación comercial para análisis y toma de decisiones.",
        docAnchor: "an%C3%A1lisis-y-reportes-comerciales",
      },
    ],
  },
  {
    id: "zelify-matilda-ia",
    title: "MATILDA AI FINTECH CORE",
    subtitle: "AI-powered financial intelligence",
    description:
      "Plataforma de inteligencia artificial enfocada en finanzas que analiza el comportamiento de los usuarios para detectar hábitos y anticipar necesidades, ofrece soporte conversacional integrado, genera contenido alineado a la marca, entrega herramientas de finanzas personales con recomendaciones y produce reportes a partir de instrucciones en lenguaje natural. Todo orientado a mejorar la experiencia del cliente y la toma de decisiones sin añadir fricción a los flujos existentes.",
    category: "financial",
    services: [
      {
        title: "Behavior Analysis",
        description:
          "Analiza patrones de gasto, ahorro e interacción financiera mediante IA. Detecta hábitos, anticipa necesidades y ayuda a prevenir riesgos de endeudamiento o fraude.",
        docAnchor: "behavior-analysis",
      },
      {
        title: "Chat de soporte - Smart Support",
        description:
          "Sistema de asistencia automática basado en IA conversacional que resuelve dudas sobre productos financieros, transacciones o servicios a través de un SDK.",
        docAnchor: "chat-de-soporte-smart-support",
      },
      {
        title: "Content Marketing",
        description:
          "Utiliza modelos de lenguaje para crear contenido relevante, coherente con la identidad de marca y optimizado para canales digitales y redes sociales.",
        docAnchor: "content-marketing",
      },
      {
        title: "Finanzas Personales",
        description:
          "Ofrece a los usuarios una visión integral de sus ingresos, gastos, deudas y metas financieras. A través de algoritmos de predicción, Matilda sugiere presupuestos, recordatorios de pagos y estrategias de ahorro inteligentes.",
        docAnchor: "finanzas-personales",
      },
      {
        title: "Reportes Basados en Prompts",
        description:
          "Permite generar reportes financieros, de comportamiento o desempeño a partir de simples instrucciones en lenguaje natural.",
        docAnchor: "reportes-basados-en-prompts",
      },
    ],
  },
  {
    id: "zelify-insurance",
    title: "INSURANCE",
    subtitle: "Insurance products and services",
    description:
      "Gestión integral del ciclo de seguros: cotización en múltiples aseguradoras, generación de propuestas, venta digital, catálogo de productos, webhooks transaccionales, renovaciones y administración de siniestros.",
    category: "financial",
    services: [
      {
        title: "Cotización Inteligente",
        description:
          "Motor multicotizador que consulta múltiples aseguradoras en tiempo real.",
        docAnchor: "cotizaci%C3%B3n-inteligente",
      },
      {
        title: "Propuestas",
        description:
          "Sistema de generación y gestión de propuestas comerciales personalizadas, con validación automática de datos y pre-aprobación para acelerar el proceso de venta.",
        docAnchor: "propuestas",
      },
      {
        title: "Venta Digital",
        description:
          "Proceso de compra embebido con checkout optimizado y múltiples métodos de pago.",
        docAnchor: "venta-digital",
      },
      {
        title: "Productos",
        description:
          "Catálogo digital completo con todos los seguros disponibles, incluyendo detalles de coberturas, precios, exclusiones y condiciones específicas por cada producto.",
        docAnchor: "productos",
      },
      {
        title: "Webhooks",
        description:
          "Sistema de notificaciones automáticas que envía actualizaciones en tiempo real sobre cambios de estado, eventos importantes y alertas del ciclo del seguro.",
        docAnchor: "webhooks",
      },
      {
        title: "Renovaciones",
        description:
          "Gestión automatizada del proceso de renovación con recordatorios programados, actualización de información y reprocesamiento simplificado de pólizas.",
        docAnchor: "renovaciones",
      },
      {
        title: "Siniestros",
        description:
          "Plataforma digital integral para reportar, documentar y realizar seguimiento en tiempo real de reclamos y gestionar todo el proceso de siniestros.",
        docAnchor: "siniestros",
      },
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "View all" },
  { id: "auth", label: "Auth", productId: "zelify-auth" },
  { id: "identity", label: "Identity", productId: "zelify-identity" },
  { id: "aml", label: "AML", productId: "zelify-aml" },
  { id: "connect", label: "Connect", productId: "zelify-connect" },
  { id: "cards", label: "Cards", productId: "zelify-cards" },
  { id: "transfers", label: "Transfers", productId: "zelify-transfers" },
  { id: "tx", label: "TX", productId: "zelify-tx" },
  { id: "payments", label: "Payments", productId: "zelify-payments" },
  { id: "notifications", label: "Notifications", productId: "zelify-notifications" },
  { id: "discounts", label: "Discounts & Coupons", productId: "zelify-discounts" },
  { id: "matilda", label: "Matilda AI Fintech Core", productId: "zelify-matilda-ia" },
  { id: "insurance", label: "Insurance", productId: "zelify-insurance" },
];

export function ProductsPageContent() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = PRODUCTS.filter((product) => {
    // Si se selecciona "all", mostrar todos los productos
    if (selectedCategory === "all") {
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }

    // Si se selecciona una categoría específica, mostrar solo ese producto
    const selectedCategoryData = CATEGORIES.find(
      (cat) => cat.id === selectedCategory
    );
    const matchesCategory =
      selectedCategoryData?.productId === product.id;
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex gap-6 border-b border-stroke dark:border-dark-3">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`pb-3 text-sm font-medium transition-colors ${selectedCategory === category.id
                ? "border-b-2 border-primary text-primary"
                : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
              }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Search and filter bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search all products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-white px-10 py-2.5 text-sm text-dark outline-none placeholder:text-dark-6 dark:border-dark-3 dark:bg-dark dark:text-white dark:placeholder:text-dark-6"
          />
        </div>
        <SimpleSelect
          options={[
            { value: "all", label: "All products" },
            { value: "available", label: "Available" },
            { value: "coming_soon", label: "Coming soon" },
          ]}
          defaultValue="all"
          className="min-w-[150px]"
        />
      </div>

      {/* Products grid */}
      {selectedCategory === "all" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group rounded-lg border border-stroke bg-white p-6 transition hover:shadow-md dark:border-dark-3 dark:bg-dark-2"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-bold uppercase text-dark dark:text-white">
                    {product.title}
                  </h3>
                  <p className="text-sm font-medium text-dark-6 dark:text-dark-6">
                    {product.subtitle}
                  </p>
                </div>
                <a
                  href={`${DOCS_BASE_URL}/${product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-stroke text-dark-6 transition group-hover:border-primary group-hover:text-primary dark:border-dark-3 dark:text-dark-6"
                  aria-label={`Ver documentación de ${product.title}`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
              <p className="text-sm leading-relaxed text-dark-6 dark:text-dark-6">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Product Card */}
          {filteredProducts.map((product) => (
            <div key={product.id} className="space-y-6">
              <div className="group rounded-lg border border-stroke bg-white p-6 transition hover:shadow-md dark:border-dark-3 dark:bg-dark-2">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-bold uppercase text-dark dark:text-white">
                      {product.title}
                    </h3>
                    <p className="text-sm font-medium text-dark-6 dark:text-dark-6">
                      {product.subtitle}
                    </p>
                  </div>
                  <a
                    href={`${DOCS_BASE_URL}/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-stroke text-dark-6 transition group-hover:border-primary group-hover:text-primary dark:border-dark-3 dark:text-dark-6"
                    aria-label={`Ver documentación de ${product.title}`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
                <p className="text-sm leading-relaxed text-dark-6 dark:text-dark-6">
                  {product.description}
                </p>
              </div>

              {/* Services Section */}
              {product.services && product.services.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-dark dark:text-white">
                    Servicios que ofrecemos
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {product.services.map((service, index) => (
                      <div
                        key={index}
                        className="group relative rounded-lg border border-stroke bg-white p-5 transition hover:shadow-md dark:border-dark-3 dark:bg-dark-2"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h5 className="flex-1 text-base font-semibold text-dark dark:text-white">
                            {service.title}
                          </h5>
                          {service.docAnchor && (
                            <a
                              href={`${DOCS_BASE_URL}/${product.id}#${service.docAnchor}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-stroke text-dark-6 transition hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-dark-3 dark:text-dark-6 dark:hover:bg-primary/10"
                              aria-label={`Ver documentación de ${service.title}`}
                              title={`Ver documentación de ${service.title}`}
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-dark-6 dark:text-dark-6">
                          {service.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-dark-6 dark:text-dark-6">
            No products found matching your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
