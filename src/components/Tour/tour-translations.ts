import type { Language } from "@/contexts/language-context";
import type { TourStep } from "@/contexts/tour-context";

type ProductKey = "auth" | "aml" | "identity" | "connect" | "cards" | "payments" | "tx" | "ai" | "discounts";

export const TOUR_TRANSLATIONS: Record<Language, Record<ProductKey, TourStep[]>> = {
  es: {
    auth: [
      {
        id: "auth-product",
        target: "tour-product-auth",
        title: "Autenticación",
        content:
          "Se encarga del manejo de inicio de sesión, registro de usuarios e información del dispositivo. Puedes expandir para ver sus opciones y funcionalidades.",
        position: "right" as const,
      },
      {
        id: "auth-authentication",
        target: "tour-auth-authentication",
        title: "Autenticación",
        content:
          "Esta es la opción principal de autenticación. Aquí puedes configurar el inicio de sesión y registro de usuarios.",
        position: "right" as const,
        url: "/pages/products/auth/authentication",
      },
      {
        id: "auth-preview",
        target: "tour-auth-preview",
        title: "Interfaz de Autenticación",
        content:
          "Zelify provee de una interfaz que tus usuarios inicien sesión fácilmente",
        position: "right" as const,
      },
      {
        id: "branding-customization",
        target: "tour-branding-content",
        title: "Personalización de Marca",
        content:
          "Personaliza la identidad visual de tu empresa adaptando los colores corporativos y agregando tu logotipo para que la interfaz de autenticación refleje tu marca.",
        position: "left" as const,
      },
      {
        id: "auth-preview-register",
        target: "tour-auth-preview",
        title: "Vista de Registro",
        content:
          "Aquí puedes ver la interfaz de registro de usuarios, un formulario en el cual puedes añadir más campos.",
        position: "right" as const,
      },
      {
        id: "auth-preview-otp",
        target: "tour-auth-preview",
        title: "Verificación por Código",
        content:
          "Zelify proporciona un sistema de verificación mediante códigos temporales que se pueden enviar por correo electrónico, SMS o WhatsApp.",
        position: "right" as const,
      },
      {
        id: "auth-geolocalization",
        target: "tour-geolocalization",
        title: "Geolocalización",
        content:
          "Permite rastrear y validar la ubicación exacta de coordenadas de un dispositivo.",
        position: "right" as const,
        url: "/pages/products/auth/geolocalization",
      },
      {
        id: "geolocalization-device",
        target: "tour-geolocalization-device",
        title: "Vista Previa Móvil",
        content:
          "Zelify pedirá el permiso de ubicación del usuario mediante un modal nativo del sistema operativo para obtener su latitud y longitud.",
        position: "right" as const,
      },
      {
        id: "geolocalization-search",
        target: "tour-geolocalization-search",
        title: "Búsqueda de Ubicación",
        content:
          "Puedes buscar información detallada de cualquier ubicación ingresando estas coordenadas.",
        position: "left" as const,
      },
      {
        id: "geolocalization-results",
        target: "tour-geolocalization-results",
        title: "Resultados de Búsqueda",
        content:
          "Incluyendo dirección formateada, país, ciudad, calles, código postal y datos técnicos adicionales.",
        position: "bottom" as const,
      },
      {
        id: "device-information",
        target: "tour-device-information",
        title: "Información del Dispositivo",
        content:
          "Este servicio determina la confiabilidad del dispositivo para detectar posibles riesgos de seguridad.",
        position: "right" as const,
        url: "/pages/products/auth/device-information",
      },
      {
        id: "device-information-table",
        target: "tour-device-information-table",
        title: "Registro de Dispositivos",
        content:
          "Aquí se muestra un registro de todos los dispositivos que tienen actividad.",
        position: "bottom" as const,
      },
      {
        id: "device-information-first-row",
        target: "tour-device-information-first-row",
        title: "Seleccionar Dispositivo",
        content:
          "Puedes hacer clic en cualquier registro para ver los detalles completos del dispositivo, incluyendo su información de ubicación, características del navegador y sistema operativo.",
        position: "bottom" as const,
      },
      {
        id: "device-information-modal",
        target: "tour-device-information-modal",
        title: "Información del Dispositivo",
        content:
          "Puedes ver si el dispositivo utiliza VPN, si se hace pasar por un atacante, su nivel de confianza, y otros factores de seguridad.",
        position: "bottom" as const,
      },
    ],
    aml: [
      {
        id: "aml-product",
        target: "tour-product-aml",
        title: "AML - Validación de Listas Globales",
        content:
          "Te permite validar personas y entidades contra listas globales de sanciones, PEPs y otras bases de datos de cumplimiento.",
        position: "right" as const,
      },
      {
        id: "aml-validation-global-list",
        target: "tour-aml-validation-global-list",
        title: "Validación de Listas Globales",
        content:
          "Aquí puedes realizar validaciones AML (Anti lavado de dinero) ingresando el número de documento de identificación.",
        position: "right" as const,
        url: "/pages/products/aml/validation-global-list",
      },
      {
        id: "aml-preview",
        target: "tour-aml-preview",
        title: "Vista Previa del Dispositivo",
        content:
          "La validación de listas negras se realiza automáticamente durante el proceso de verificación de identidad en tiempo real.",
        position: "right" as const,
        url: "/pages/products/aml/validation-global-list",
      },
      {
        id: "aml-validations-list",
        target: "tour-aml-validations-list",
        title: "Historial de Validaciones",
        content:
          "Aquí puedes ver el historial completo de todas tus validaciones AML realizadas, incluyendo su estado, fecha de creación y resultados de las búsquedas en las listas globales.",
        position: "bottom" as const,
        url: "/pages/products/aml/validation-global-list",
      },
      {
        id: "aml-list-config",
        target: "tour-aml-list-config",
        title: "Configuración de Listas AML",
        content:
          "Selecciona y configura las listas negras que deseas utilizar en tus validaciones.",
        position: "bottom" as const,
        url: "/pages/products/aml/validation-global-list",
      },
    ],
    identity: [
      {
        id: "identity-product",
        target: "tour-product-identity",
        title: "Identidad - Flujo de Trabajo",
        content:
          "Este producto te permite configurar flujos para la verificación de identidad de tus usuarios con un documento y una prueba de vida.",
        position: "right" as const,
      },
      {
        id: "identity-new-workflow-button",
        target: "tour-identity-new-workflow-button",
        title: "Crear Nuevo Flujo",
        content:
          "Puedes crear un nuevo flujo de verificación de identidad por país.",
        position: "left" as const,
        url: "/pages/products/identity/workflow",
      },
      {
        id: "identity-workflow-preview",
        target: "tour-identity-workflow-preview",
        title: "Vista Previa del Dispositivo",
        content:
          "Visualiza cómo se verá el flujo de verificación de identidad en dispositivos móviles y web.",
        position: "right" as const,
        url: "/pages/products/identity/workflow",
      },
      {
        id: "identity-workflow-config",
        target: "tour-identity-workflow-config-country",
        title: "Configuración del Flujo",
        content:
          "Puedes configurar el flujo para Ecuador, México y Colombia según las necesidades locales.",
        position: "left" as const,
        url: "/pages/products/identity/workflow",
      },
      {
        id: "identity-workflow-config-documents",
        target: "tour-identity-workflow-config-documents",
        title: "Tipos de Documento",
        content:
          "Selecciona los documentos permitidos para la verificación de prueba de vida.",
        position: "left" as const,
        url: "/pages/products/identity/workflow",
      },
    ],
    connect: [
      {
        id: "connect-product",
        target: "tour-product-connect",
        title: "Connect",
        content:
          "Permite vincular cuentas bancarias de otros bancos de un usuario dentro de la plataforma.",
        position: "right" as const,
      },
      {
        id: "connect-bank-account-linking",
        target: "tour-connect-bank-account-linking",
        title: "Vinculación de Cuentas Bancarias",
        content:
          "Configura el proceso de vinculación de cuentas bancarias.",
        position: "right" as const,
        url: "/pages/products/connect/bank-account-linking",
      },
      {
        id: "connect-config",
        target: "tour-connect-config",
        title: "Configuración de Países",
        content:
          "Selecciona los países donde estarán disponibles los servicios de vinculación bancaria.",
        position: "left" as const,
      },
      {
        id: "connect-preview",
        target: "tour-connect-preview",
        title: "Vista Previa del Dispositivo",
        content:
          "Puedes Connect a diferentes bancos del país seleccionado.",
        position: "right" as const,
      },
      {
        id: "connect-credentials",
        target: "tour-connect-credentials",
        title: "Ingreso de Credenciales",
        content:
          "El usuario ingresa sus credenciales bancarias para Connect su cuenta, en un proceso seguro y automático",
        position: "right" as const,
        url: "/pages/products/connect/bank-account-linking",
      },
      {
        id: "connect-wallet",
        target: "tour-connect-wallet",
        title: "Billetera y Cash-in",
        content:
          "Una vez conectada la cuenta bancaria, el usuario puede recargar dinero desde su billetera.",
        position: "right" as const,
        url: "/pages/products/connect/bank-account-linking",
      },
    ],
    cards: [
      {
        id: "cards-product",
        target: "tour-product-cards",
        title: "Tarjetas",
        content:
          "Permite diseñar, emitir y procesar tarjetas de crédito y débito personalizadas para tus usuarios, centralizando todas las operaciones en una sola plataforma.",
        position: "right" as const,
      },
      {
        id: "cards-preview-main",
        target: "tour-cards-preview-main",
        title: "Vista Previa Principal",
        content:
          "Visualiza cómo se verán las tarjetas, con acciones como información de la tarjeta, billetera asociada, congelar y bloquear, entre otras.",
        position: "right" as const,
        url: "/pages/products/cards",
      },
      {
        id: "cards-issuing-design",
        target: "tour-cards-issuing-design",
        title: "Diseño de Tarjetas",
        content:
          "Gestiona y crea diseños de tarjetas personalizados.",
        position: "bottom" as const,
        url: "/pages/products/cards/issuing/design",
      },
      {
        id: "cards-create-design",
        target: "tour-cards-create-design",
        title: "Crear Nuevo Diseño",
        content:
          "Crea un nuevo diseño de tarjeta de débito o crédito con tu marca.",
        position: "top" as const,
        url: "/pages/products/cards/issuing/design",
      },
      {
        id: "cards-design-editor",
        target: "tour-cards-design-editor",
        title: "Panel de Personalización",
        content:
          "Personaliza tu tarjeta: nombre del titular, color (sólido o gradiente), acabado (estándar, grabado o metálico) y franquicia (Visa o Mastercard).",
        position: "left" as const,
      },
      {
        id: "cards-transactions",
        target: "tour-cards-transactions",
        title: "Transacciones",
        content:
          "Ver y administrar todas las transacciones emitidas en su plataforma.",
        position: "bottom" as const,
        url: "/pages/products/cards/transactions",
      },
      {
        id: "cards-diligence-list",
        target: "tour-cards-diligence-list",
        title: "Diligencia",
        content:
          "Revisa el estado de todas las diligencias debidas realizadas. Puedes ver el estado de cada proces y fecha de envío.",
        position: "bottom" as const,
        url: "/pages/products/cards/diligence",
      },
    ],
    payments: [
      {
        id: "payments-product",
        target: "tour-product-payments",
        title: "Pagos y transferencias",
        content:
          "Permite configurar diferentes métodos de pago, incluyendo servicios básicos, transferencias, claves personalizadas y códigos QR.",
        position: "right" as const,
      },
      {
        id: "payments-basic-services",
        target: "tour-payments-basic-services",
        title: "Servicios Básicos",
        content:
          "Configura los servicios básicos de pago disponibles para tus usuarios.",
        position: "right" as const,
        url: "/pages/products/payments/servicios-basicos",
      },
      {
        id: "transfers-config",
        target: "tour-transfers-config",
        title: "Configuración de Transferencias",
        content:
          "Gestiona las transferencias internas e interbancarias.",
        position: "right" as const,
        url: "/pages/products/payments/transfers",
      },
      {
        id: "transfers-preview",
        target: "tour-transfers-preview",
        title: "Vista Previa del Dispositivo",
        content:
          "Visualiza cómo se verá la interfaz de transferencias en dispositivos móviles. La experiencia está diseñada para ser clara, segura y fácil de usar.",
        position: "right" as const,
        url: "/pages/products/payments/transfers",
      },
      {
        id: "payments-custom-keys",
        target: "tour-payments-custom-keys",
        title: "Claves Personalizadas",
        content:
          "Configura claves de pago para habilitar transacciones mediante cédula, teléfono o correo electrónico.",
        position: "right" as const,
        url: "/pages/products/payments/custom-keys",
      },
      {
        id: "payments-custom-keys-config",
        target: "tour-payments-custom-keys-config",
        title: "Configuración de Claves",
        content:
          "Personaliza los tipos de claves disponibles.",
        position: "left" as const,
        url: "/pages/products/payments/custom-keys",
      },
      {
        id: "payments-custom-keys-preview",
        target: "tour-payments-custom-keys-preview",
        title: "Vista Previa de Claves",
        content:
          "Visualiza cómo tus usuarios verán y usarán las claves personalizadas en dispositivos móviles.",
        position: "right" as const,
        url: "/pages/products/payments/custom-keys",
      },
      {
        id: "payments-qr",
        target: "tour-payments-qr",
        title: "Pagos con Código QR",
        content:
          "Tus usuarios pueden escanear códigos QR para realizar pagos de manera instantánea.",
        position: "right" as const,
        url: "/pages/products/payments/qr",
      },
      {
        id: "payments-qr-config",
        target: "tour-payments-qr-config",
        title: "Configuración de QR",
        content:
          "Configura webhooks para recibir notificaciones de eventos de pago y define qué eventos quieres recibir.",
        position: "left" as const,
        url: "/pages/products/payments/qr",
      },
      {
        id: "payments-qr-preview",
        target: "tour-payments-qr-preview",
        title: "Vista Previa de QR",
        content:
          "Visualiza cómo se verá la interfaz de pagos con código QR en dispositivos móviles.",
        position: "right" as const,
        url: "/pages/products/payments/qr",
      },
    ],
    tx: [
      {
        id: "tx-international-transfers",
        target: "tour-tx-international-transfers",
        title: "Transferencias Internacionales",
        content:
          "Configura y gestiona transferencias internacionales para procesar envíos de dinero a nivel global de forma segura.",
        position: "right" as const,
        url: "/pages/products/tx/transferencias-internacionales",
      },
      {
        id: "tx-config",
        target: "tour-tx-config",
        title: "Configuración de Regiones",
        content:
          "Define las regiones donde estarán disponibles las transferencias internacionales. Configura países de origen y destino, tipos de cambio, métodos de pago y comisiones aplicables según las regulaciones locales.",
        position: "left" as const,
        url: "/pages/products/tx/transferencias-internacionales",
      },
      {
        id: "tx-preview",
        target: "tour-tx-preview",
        title: "Vista Previa del Dispositivo",
        content:
          "Visualiza cómo se verá la interfaz de transferencias internacionales en dispositivos móviles.",
        position: "right" as const,
        url: "/pages/products/tx/transferencias-internacionales",
      },
    ],
    ai: [
      {
        id: "ai-product",
        target: "tour-product-ai",
        title: "IA - Alaiza",
        content:
          "Alaiza es el asistente de inteligencia artificial de Zelify que te ayuda a responder consultas y dar soporte al cliente.",
        position: "right" as const,
      },
      {
        id: "ai-alaiza-config",
        target: "tour-ai-alaiza-config",
        title: "Configuración de Alaiza",
        content:
          "Personaliza el comportamiento, respuestas y capacidades de Alaiza según tus necesidades.",
        position: "left" as const,
        url: "/pages/products/ai/alaiza",
      },
      {
        id: "ai-alaiza-preview",
        target: "tour-ai-alaiza-preview",
        title: "Vista Previa del Chat",
        content:
          "Visualiza cómo se verá la interfaz de chat con Alaiza en dispositivos móviles.",
        position: "right" as const,
        url: "/pages/products/ai/alaiza",
      },
      {
        id: "ai-behavior-analysis",
        target: "tour-ai-behavior-analysis",
        title: "Análisis de Comportamiento",
        content:
          "Analiza el comportamiento de tus usuarios, detecta patrones y configura alertas personalizadas y recordatorios.",
        position: "right" as const,
        url: "/pages/products/ai/behavior-analysis",
      },
      {
        id: "ai-behavior-categories",
        target: "tour-behavior-categories",
        title: "Categorías de Análisis",
        content:
          "Habilita o deshabilita categorías específicas de análisis.",
        position: "left" as const,
        url: "/pages/products/ai/behavior-analysis",
      },
      {
        id: "ai-behavior-preview",
        target: "tour-behavior-preview",
        title: "Notificaciones instantáneas",
        content:
          "Recibe notificaciones de celular en tiempo real.",
        position: "right" as const,
        url: "/pages/products/ai/behavior-analysis",
      },
      {
        id: "ai-financial-education",
        target: "tour-ai-financial-education",
        title: "Educación Financiera",
        content:
          "Ofrece módulos educativos personalizados para mejorar la salud financiera de tus usuarios. Gestiona contenido que ayuda a tus clientes a tomar mejores decisiones financieras.",
        position: "right" as const,
        url: "/pages/products/ai/financial-education",
      },
      {
        id: "ai-financial-academy",
        target: "tour-financial-academy",
        title: "Videos Educativos",
        content:
          "Añade videos educativos a la sección 'Academy' para generar contenido personalizado.",
        position: "left" as const,
        url: "/pages/products/ai/financial-education",
      },
      {
        id: "ai-financial-blogs",
        target: "tour-financial-blogs",
        title: "Blogs y Consejos",
        content:
          "Gestiona artículos y consejos financieros escritos. Publica contenido relevante para ayudar a tus usuarios a entender mejor sus finanzas.",
        position: "left" as const,
        url: "/pages/products/ai/financial-education",
      },
      {
        id: "ai-financial-preview",
        target: "tour-financial-preview",
        title: "Vista Previa Móvil",
        content:
          "Previsualiza los módulos educativos tal como los verán tus usuarios en la aplicación móvil, asegurando una experiencia de aprendizaje óptima.",
        position: "right" as const,
        url: "/pages/products/ai/financial-education",
      },
    ],
    discounts: [
      {
        id: "discounts-product",
        target: "tour-product-discounts",
        title: "Descuentos y Cupones",
        content:
          "El módulo de Descuentos y Cupones te permite crear, gestionar y analizar cupones de descuento para promocionar tus productos, de tus socios y del ecosistema de Zelify.",
        position: "right" as const,
      },
      {
        id: "discounts-list",
        target: "tour-discounts-list",
        title: "Configuración de Descuentos",
        content:
          "Desde una sola pantalla accede a los descuentos generales que estarán disponibles en la aplicación.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons/discounts",
      },
      {
        id: "discounts-config-panel",
        target: "tour-discounts-config-panel",
        title: "Panel de Configuración",
        content:
          "Ajusta los detalles de tus campañas. Modifica precios, textos, imágenes y colores para alinear las promociones con la identidad de tu marca y estrategia comercial.",
        position: "left" as const,
        url: "/pages/products/discounts-coupons/discounts",
      },
      {
        id: "discounts-coupons",
        target: "tour-discounts-coupons",
        title: "Gestión de Cupones",
        content:
          "Visualiza y gestiona todos tus cupones de descuento. Puedes ver el estado de cada cupón, fechas de validez, límites de uso y hacer clic en cualquier cupón para ver los detalles completos y editarlos.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons",
      },
      {
        id: "discounts-create",
        target: "tour-discounts-create",
        title: "Crear Nuevo Cupón",
        content:
          "Crea nuevos cupones personalizados desde cero.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons/create",
      },
      {
        id: "discounts-coupon-detail",
        target: "tour-discounts-coupon-detail",
        title: "Detalles del Cupón",
        content:
          "Revisa la información completa de cualquier cupón.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons",
      },
      {
        id: "discounts-analytics",
        target: "tour-discounts-analytics",
        title: "Analítica y Uso",
        content:
          "Monitorea el rendimiento de tus cupones con análisis detallados.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons/analytics",
      },
    ],
  },
  en: {
    auth: [
      {
        id: "auth-product",
        target: "tour-product-auth",
        title: "Authentication",
        content:
          "Handles user login, registration, and device information. You can expand to see its options and functionalities.",
        position: "right" as const,
      },
      {
        id: "auth-authentication",
        target: "tour-auth-authentication",
        title: "Authentication",
        content:
          "This is the main authentication option. Here you can configure user login and registration.",
        position: "right" as const,
        url: "/pages/products/auth/authentication",
      },
      {
        id: "auth-preview",
        target: "tour-auth-preview",
        title: "Authentication Interface",
        content:
          "Zelify provides an interface for your users to log in easily",
        position: "right" as const,
      },
      {
        id: "branding-customization",
        target: "tour-branding-content",
        title: "Brand Customization",
        content:
          "Customize your company's visual identity by adapting corporate colors and adding your logo so that the authentication interface reflects your business brand.",
        position: "left" as const,
      },
      {
        id: "auth-preview-register",
        target: "tour-auth-preview",
        title: "Registration View",
        content:
          "Here you can see the user registration interface. Zelify allows you to customize fields and registration flow according to your business needs.",
        position: "right" as const,
      },
      {
        id: "auth-preview-otp",
        target: "tour-auth-preview",
        title: "Code Verification",
        content:
          "Zelify provides a verification system using temporary codes that can be sent via email, SMS, or WhatsApp, ensuring security and authenticity of users during the registration process.",
        position: "right" as const,
      },
      {
        id: "auth-geolocalization",
        target: "tour-geolocalization",
        title: "Geolocation",
        content:
          "Geolocation allows tracking and validating user locations, providing additional security and location-based features for your application.",
        position: "right" as const,
        url: "/pages/products/auth/geolocalization",
      },
      {
        id: "geolocalization-device",
        target: "tour-geolocalization-device",
        title: "Mobile Preview",
        content:
          "Zelify will request the user's location permission through the native operating system modal, ensuring a familiar and secure experience.",
        position: "right" as const,
      },
      {
        id: "geolocalization-search",
        target: "tour-geolocalization-search",
        title: "Location Search",
        content:
          "You can search for detailed information about any location by entering its coordinates. The system will provide complete data about the specified location.",
        position: "left" as const,
      },
      {
        id: "geolocalization-results",
        target: "tour-geolocalization-results",
        title: "Search Results",
        content:
          "Zelify provides detailed and structured information about the location, including formatted address, country, city, streets, postal code, and additional technical data.",
        position: "bottom" as const,
      },
      {
        id: "device-information",
        target: "tour-device-information",
        title: "Device Information",
        content:
          "This is the device intelligence service to determine how reliable a device is. Zelify analyzes multiple device factors to determine its reliability level and detect potential security risks.",
        position: "right" as const,
        url: "/pages/products/auth/device-information",
      },
      {
        id: "device-information-table",
        target: "tour-device-information-table",
        title: "Device Registry",
        content:
          "Here is a registry of all devices that have activity once location permission is accepted. Each record contains unique device information and its activity history.",
        position: "bottom" as const,
      },
      {
        id: "device-information-first-row",
        target: "tour-device-information-first-row",
        title: "Select Device",
        content:
          "You can click on any record to see complete device details, including location information, browser and operating system characteristics.",
        position: "bottom" as const,
      },
      {
        id: "device-information-modal",
        target: "tour-device-information-modal",
        title: "Device Information",
        content:
          "Zelify provides detailed information about device reliability. You can see if the device uses VPN, if it's impersonating an attacker, its trust level, and other security factors that help determine if the device is reliable or presents risks.",
        position: "bottom" as const,
      },
    ],
    aml: [
      {
        id: "aml-product",
        target: "tour-product-aml",
        title: "AML - Global List Validation",
        content:
          "The AML module allows you to validate people and entities against global sanctions lists, PEPs, and other compliance databases to ensure regulatory compliance.",
        position: "right" as const,
      },
      {
        id: "aml-validation-global-list",
        target: "tour-aml-validation-global-list",
        title: "Global List Validation",
        content:
          "Here you can perform AML validations by entering the identification document number. The system will search multiple global sanctions and PEP lists.",
        position: "right" as const,
        url: "/pages/products/aml/validation-global-list",
      },
      {
        id: "aml-preview",
        target: "tour-aml-preview",
        title: "Device Preview",
        content:
          "Blacklist validation is performed automatically during the identity verification process, integrating AML with Identity for real-time validations.",
        position: "right" as const,
        url: "/pages/products/aml/validation-global-list",
      },
      {
        id: "aml-validations-list",
        target: "tour-aml-validations-list",
        title: "Validation History",
        content:
          "Here you can see the complete history of all your AML validations performed, including their status, creation date, and results from searches in global lists.",
        position: "bottom" as const,
        url: "/pages/products/aml/validation-global-list",
      },
      {
        id: "aml-list-config",
        target: "tour-aml-list-config",
        title: "AML List Configuration",
        content:
          "Select and configure the blacklists you want to use in your validations. You can activate or deactivate specific lists, create custom groups, and manage data sources according to your compliance needs.",
        position: "bottom" as const,
        url: "/pages/products/aml/validation-global-list",
      },
    ],
    identity: [
      {
        id: "identity-product",
        target: "tour-product-identity",
        title: "Identity - Workflow",
        content:
          "The Identity module allows you to configure custom workflows for user identity verification, including document capture and biometric verification.",
        position: "right" as const,
      },
      {
        id: "identity-new-workflow-button",
        target: "tour-identity-new-workflow-button",
        title: "Create New Workflow",
        content:
          "You can create a new identity verification workflow by country. Each country can have its own custom workflow with different document requirements and verification methods according to local regulations.",
        position: "left" as const,
        url: "/pages/products/identity/workflow",
      },
      {
        id: "identity-workflow-preview",
        target: "tour-identity-workflow-preview",
        title: "Device Preview",
        content:
          "Visualize how the identity verification flow will look on mobile and web devices. Zelify allows you to see exactly the experience your users will have on their devices.",
        position: "right" as const,
        url: "/pages/products/identity/workflow",
      },
      {
        id: "identity-workflow-config",
        target: "tour-identity-workflow-config-country",
        title: "Workflow Configuration",
        content:
          "You can configure the identity verification flow for each country (Ecuador, Mexico, Colombia). Each country can have different requirements and regulations, so you can customize the flow according to local needs.",
        position: "left" as const,
        url: "/pages/products/identity/workflow",
      },
      {
        id: "identity-workflow-config-documents",
        target: "tour-identity-workflow-config-documents",
        title: "Document Types",
        content:
          "Select the document types allowed for verification: Driver's license, National ID, or Passport. You can enable one or several according to your business requirements.",
        position: "left" as const,
        url: "/pages/products/identity/workflow",
      },
    ],
    connect: [
      {
        id: "connect-product",
        target: "tour-product-connect",
        title: "Connect",
        content:
          "The Connect module allows secure linking of your users' bank accounts, facilitating integration with financial services and payments.",
        position: "right" as const,
      },
      {
        id: "connect-bank-account-linking",
        target: "tour-connect-bank-account-linking",
        title: "Bank Account Linking",
        content:
          "Configure the bank account linking process. Zelify provides a secure and easy-to-use interface for your users to connect their bank accounts.",
        position: "right" as const,
        url: "/pages/products/connect/bank-account-linking",
      },
      {
        id: "connect-config",
        target: "tour-connect-config",
        title: "Country Configuration",
        content:
          "Select the countries where bank linking services will be available. You can configure different options for each country according to local regulations.",
        position: "left" as const,
      },
      {
        id: "connect-preview",
        target: "tour-connect-preview",
        title: "Device Preview",
        content:
          "You can connect to different banks in the selected local market. The interface allows you to securely and intuitively link bank accounts from any device.",
        position: "right" as const,
      },
      {
        id: "connect-credentials",
        target: "tour-connect-credentials",
        title: "Credential Entry",
        content:
          "The user simply enters their bank credentials to connect their account. The process is secure and performed automatically once access data is provided.",
        position: "right" as const,
        url: "/pages/products/connect/bank-account-linking",
      },
      {
        id: "connect-wallet",
        target: "tour-connect-wallet",
        title: "Wallet and Cash-in",
        content:
          "Once the bank account is connected, the user can perform a cash-in or fund deposit from their wallet. The interface allows secure fund management and deposits from linked bank accounts.",
        position: "right" as const,
        url: "/pages/products/connect/bank-account-linking",
      },
    ],
    cards: [
      {
        id: "cards-product",
        target: "tour-product-cards",
        title: "Cards",
        content:
          "The Cards module allows you to design, issue, and manage custom cards for your users. Includes tools to customize visual design, monitor transactions, and perform due diligence comprehensively.",
        position: "right" as const,
      },
      {
        id: "cards-preview-main",
        target: "tour-cards-preview-main",
        title: "Main Preview",
        content:
          "Visualize how cards will look on mobile devices. The preview shows the card with all available actions for your users.",
        position: "right" as const,
        url: "/pages/products/cards",
      },
      {
        id: "cards-issuing-design",
        target: "tour-cards-issuing-design",
        title: "Card Design",
        content:
          "Manage available card designs. You can create multiple custom designs with different colors, gradients, card networks, and finishes to offer variety to your users.",
        position: "bottom" as const,
        url: "/pages/products/cards/issuing/design",
      },
      {
        id: "cards-create-design",
        target: "tour-cards-create-design",
        title: "Create New Design",
        content:
          "Create a new card design from scratch. Define the design name and customize all visual aspects to reflect your brand identity.",
        position: "top" as const,
        url: "/pages/products/cards/issuing/design",
      },
      {
        id: "cards-design-editor",
        target: "tour-cards-design-editor",
        title: "Customization Panel",
        content:
          "Customize every detail of your card: cardholder name, color type (solid or gradient), gradient colors, card finish (standard, embossed, or metallic), and card network (Visa or Mastercard).",
        position: "left" as const,
      },
      {
        id: "cards-transactions",
        target: "tour-cards-transactions",
        title: "Transactions",
        content:
          "View and manage all transactions issued on your platform.",
        position: "bottom" as const,
        url: "/pages/products/cards/transactions",
      },
      {
        id: "cards-diligence-list",
        target: "tour-cards-diligence-list",
        title: "Diligence",
        content:
          "Review the status of all due diligence processes performed. You can see the status of each process, submission date, and click on any item to view complete details.",
        position: "bottom" as const,
        url: "/pages/products/cards/diligence",
      },
    ],
    payments: [
      {
        id: "payments-product",
        target: "tour-product-payments",
        title: "Payments and Transfers",
        content:
          "The Payments and Transfers module allows you to configure different payment methods, including basic services, transfers, custom keys, and QR codes, to facilitate your users' transactions.",
        position: "right" as const,
      },
      {
        id: "payments-basic-services",
        target: "tour-payments-basic-services",
        title: "Basic Services",
        content:
          "Configure basic payment services available for your users. Define enabled payment methods, transaction limits, and customize the experience according to your needs.",
        position: "right" as const,
        url: "/pages/products/payments/servicios-basicos",
      },
      {
        id: "transfers-config",
        target: "tour-transfers-config",
        title: "Transfer Configuration",
        content:
          "Manage national and international transfers. Configure available transfer options and define regions where services will be available.",
        position: "right" as const,
        url: "/pages/products/payments/transfers",
      },
      {
        id: "transfers-preview",
        target: "tour-transfers-preview",
        title: "Device Preview",
        content:
          "Visualize how the transfer interface will look on mobile devices. The experience is designed to be clear, secure, and easy to use, allowing your users to make transfers intuitively.",
        position: "right" as const,
        url: "/pages/products/payments/transfers",
      },
      {
        id: "payments-custom-keys",
        target: "tour-payments-custom-keys",
        title: "Custom Keys",
        content:
          "Configure custom payment keys that your users can use to make transactions quickly and securely. Allows payments via ID, phone, or email without needing to enter complete banking data.",
        position: "right" as const,
        url: "/pages/products/payments/custom-keys",
      },
      {
        id: "payments-custom-keys-config",
        target: "tour-payments-custom-keys-config",
        title: "Key Configuration",
        content:
          "Customize available key types, configure notifications, contact alerts, and security options such as two-factor authentication and automatic logout.",
        position: "left" as const,
        url: "/pages/products/payments/custom-keys",
      },
      {
        id: "payments-custom-keys-preview",
        target: "tour-payments-custom-keys-preview",
        title: "Keys Preview",
        content:
          "Visualize how your users will see and use custom keys on mobile devices. The interface shows the list of contacts with configured keys and allows quick payments.",
        position: "right" as const,
        url: "/pages/products/payments/custom-keys",
      },
      {
        id: "payments-qr",
        target: "tour-payments-qr",
        title: "QR Code Payments",
        content:
          "Enable payments via QR codes. Your users can scan QR codes to make payments instantly and contactless, improving the payment experience and reducing transaction time.",
        position: "right" as const,
        url: "/pages/products/payments/qr",
      },
      {
        id: "payments-qr-config",
        target: "tour-payments-qr-config",
        title: "QR Configuration",
        content:
          "Configure webhooks to receive payment event notifications and define which events you want to receive (successful payments, failed, refunds, etc.).",
        position: "left" as const,
        url: "/pages/products/payments/qr",
      },
      {
        id: "payments-qr-preview",
        target: "tour-payments-qr-preview",
        title: "QR Preview",
        content:
          "Visualize how the QR code payment interface will look on mobile devices. The experience allows scanning QR codes and making payments quickly and securely.",
        position: "right" as const,
        url: "/pages/products/payments/qr",
      },
    ],
    tx: [
      {
        id: "tx-international-transfers",
        target: "tour-tx-international-transfers",
        title: "International Transfers",
        content:
          "Configure and manage international transfers. Zelify provides the necessary tools to process global money transfers securely, with support for multiple countries and currencies.",
        position: "right" as const,
        url: "/pages/products/tx/transferencias-internacionales",
      },
      {
        id: "tx-config",
        target: "tour-tx-config",
        title: "Region Configuration",
        content:
          "Define regions where international transfers will be available. Configure origin and destination countries, exchange rates, payment methods, and applicable fees according to local regulations.",
        position: "left" as const,
        url: "/pages/products/tx/transferencias-internacionales",
      },
      {
        id: "tx-preview",
        target: "tour-tx-preview",
        title: "Device Preview",
        content:
          "Visualize how the international transfer interface will look on mobile devices. The experience is optimized to guide users through the international sending process, showing exchange rates, fees, and estimated times.",
        position: "right" as const,
        url: "/pages/products/tx/transferencias-internacionales",
      },
    ],
    ai: [
      {
        id: "ai-product",
        target: "tour-product-ai",
        title: "AI - Alaiza",
        content:
          "Alaiza is Zelify's artificial intelligence assistant that helps you automate tasks, answer queries, and improve your users' experience through intelligent conversations and behavior analysis.",
        position: "right" as const,
      },
      {
        id: "ai-alaiza-config",
        target: "tour-ai-alaiza-config",
        title: "Alaiza Configuration",
        content:
          "Customize Alaiza's behavior, responses, and capabilities. Define message length limits, maximum number of conversations, chat access frequency, file limits, and other settings according to your business needs.",
        position: "left" as const,
        url: "/pages/products/ai/alaiza",
      },
      {
        id: "ai-alaiza-preview",
        target: "tour-ai-alaiza-preview",
        title: "Chat Preview",
        content:
          "Visualize how the chat interface with Alaiza will look on mobile devices. Try different conversations and see how the assistant responds to your users' queries. The interface is designed to be intuitive and facilitate interaction with the AI assistant.",
        position: "right" as const,
        url: "/pages/products/ai/alaiza",
      },
      {
        id: "ai-behavior-analysis",
        target: "tour-ai-behavior-analysis",
        title: "Behavior Analysis",
        content:
          "Analyze user behavior to detect patterns and prevent fraud using advanced artificial intelligence. Observe key metrics and configure custom alerts.",
        position: "right" as const,
        url: "/pages/products/ai/behavior-analysis",
      },
      {
        id: "ai-behavior-categories",
        target: "tour-behavior-categories",
        title: "Analysis Categories",
        content:
          "Enable or disable specific analysis categories (expenses, income, savings) to tailor detection to your needs.",
        position: "left" as const,
        url: "/pages/products/ai/behavior-analysis",
      },
      {
        id: "ai-behavior-preview",
        target: "tour-behavior-preview",
        title: "Detection Preview",
        content:
          "Visualize how the system detects and reports anomalous behavior in real-time, simulating different risk scenarios.",
        position: "right" as const,
        url: "/pages/products/ai/behavior-analysis",
      },
      {
        id: "ai-financial-education",
        target: "tour-ai-financial-education",
        title: "Financial Education",
        content:
          "Offer personalized educational modules to improve your users' financial health. Manage content that helps your clients make better financial decisions.",
        position: "right" as const,
        url: "/pages/products/ai/financial-education",
      },
      {
        id: "ai-financial-academy",
        target: "tour-financial-academy",
        title: "Educational Videos",
        content:
          "Add educational videos to the 'Academy' section. You can configure titles, URLs, and thumbnails to create an engaging learning library.",
        position: "left" as const,
        url: "/pages/products/ai/financial-education",
      },
      {
        id: "ai-financial-blogs",
        target: "tour-financial-blogs",
        title: "Blogs and Tips",
        content:
          "Manage written financial articles and tips. Publish relevant content to help your users better understand their finances.",
        position: "left" as const,
        url: "/pages/products/ai/financial-education",
      },
      {
        id: "ai-financial-preview",
        target: "tour-financial-preview",
        title: "Mobile Preview",
        content:
          "Preview educational modules exactly as your users will see them in the mobile app, ensuring an optimal learning experience.",
        position: "right" as const,
        url: "/pages/products/ai/financial-education",
      },
    ],
    discounts: [
      {
        id: "discounts-product",
        target: "tour-product-discounts",
        title: "Discounts and Coupons",
        content:
          "The Discounts and Coupons module allows you to create, manage, and analyze discount coupons to promote your products and services, increasing user engagement and fostering loyalty.",
        position: "right" as const,
      },
      {
        id: "discounts-list",
        target: "tour-discounts-list",
        title: "Discounts Configuration",
        content:
          "Configure general plans and discounts available in the application. Define tiers, benefits, and customize how offers are displayed.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons/discounts",
      },
      {
        id: "discounts-config-panel",
        target: "tour-discounts-config-panel",
        title: "Configuration Panel",
        content:
          "Adjust your campaign details. Modify prices, texts, images, and colors to align promotions with your brand identity and business strategy.",
        position: "left" as const,
        url: "/pages/products/discounts-coupons/discounts",
      },
      {
        id: "discounts-coupons",
        target: "tour-discounts-coupons",
        title: "Coupon Management",
        content:
          "View and manage all your discount coupons. You can see the status of each coupon, validity dates, usage limits, and click on any coupon to view complete details and edit them.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons",
      },
      {
        id: "discounts-create",
        target: "tour-discounts-create",
        title: "Create New Coupon",
        content:
          "Create new custom coupons from scratch. Define the coupon name, discount type (fixed amount or percentage), application conditions, validity dates, usage limits, and configure usage rules according to your marketing needs.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons/create",
      },
      {
        id: "discounts-coupon-detail",
        target: "tour-discounts-coupon-detail",
        title: "Coupon Details",
        content:
          "Review the complete information of any coupon. You can see all details, usage statistics, creation and expiration dates, and edit the coupon configuration when necessary.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons",
      },
      {
        id: "discounts-analytics",
        target: "tour-discounts-analytics",
        title: "Analytics and Usage",
        content:
          "Monitor your coupons' performance with detailed analytics. Analyze how many times they've been used, which coupons are most popular, conversion rates, and get valuable insights to optimize your discount campaigns and increase ROI.",
        position: "bottom" as const,
        url: "/pages/products/discounts-coupons/analytics",
      },
    ],
  },
};