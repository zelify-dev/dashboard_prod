"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "./use-language-translations";

export type UiTranslations = {
  header: {
    title: string;
    searchPlaceholder: string;
    toggleSidebar: string;
    breadcrumbRoot: string;
  };
  languageToggle: {
    switchToSpanish: string;
    switchToEnglish: string;
  };
  sidebar: {
    closeMenu: string;
    mainMenu: string;
    products: string;
    onboarding: string;
    menuItems: {
      dashboard: string;
      calendar: string;
      organization: string;
      zelifyKeys: string;
      allProducts: string;
      logs: string;
      webhooks: string;
      auth: string;
      aml: string;
      identity: string;
      connect: string;
      cards: string;
      transfers: string;
      tx: string;
      ai: string;
      payments: string;
      notifications: string;
      discountsCoupons: string;
      insurance: string;
      businessInfo: string;
      kyb: string;
      amlDocumentation: string;
      technicalDocumentation: string;
      subItems: {
        ecommerce: string;
        profile: string;
        teams: string;
        authentication: string;
        geolocalization: string;
        deviceInformation: string;
        validationGlobalList: string;
        workflow: string;
        bankAccountLinking: string;
        issuing: string;
        design: string;
        transactions: string;
        diligence: string;
        basicService: string;
        transfers: string;
        internationalTransfers: string;
        alaiza: string;
        behaviorAnalysis: string;
        financialEducation: string;
        customKeys: string;
        qr: string;
        templates: string;
        domains: string;
        coupons: string;
        createCoupon: string;
        analyticsUsage: string;
        insuranceAssistance: string;
        quoteInsurance: string;
        discounts: string;
      };
      lockedTooltip: string;
    };
  };
  notification: {
    viewNotifications: string;
    notifications: string;
    new: string;
    seeAllNotifications: string;
    items: {
      piterJoined: string;
      congratulateHim: string;
      newMessage: string;
      devidSentMessage: string;
      newPaymentReceived: string;
      checkEarnings: string;
      jollyCompletedTasks: string;
      assignNewTask: string;
      romanJoined: string;
    };
  };
  userInfo: {
    myAccount: string;
    userInformation: string;
    viewProfile: string;
    accountSettings: string;
    logOut: string;
    props?: any;
  };
  themeToggle: {
    switchToLight: string;
    switchToDark: string;
  };
  logsPage: {
    search: {
      label: string;
      placeholder: string;
      ariaLabel: string;
    };
    filters: {
      type: string;
      institution: string;
      environment: string;
      errorCodesPlaceholder: string;
      resetAriaLabel: string;
      resetTitle: string;
    };
    values: {
      logTypes: {
        apiRequest: string;
        webhook: string;
        linkEvent: string;
      };
      environments: {
        production: string;
        sandbox: string;
      };
    };
    table: {
      type: string;
      description: string;
      institution: string;
      env: string;
      timestamp: string;
      response: string;
      payload: string;
      emptyTitle: string;
      emptySubtitle: string;
      prodShort: string;
      sandboxShort: string;
    };
    pagination: {
      firstPage: string;
      previousPage: string;
      nextPage: string;
      lastPage: string;
    };
  };
  webhooksPage: {
    newWebhook: string;
    configureWebhook: string;
    cancel: string;
    sections: {
      event: {
        title: string;
        description: string;
        selectPlaceholder: string;
      };
      webhook: {
        title: string;
        endpointPlaceholder: string;
        configureButton: string;
      };
    };
    validation: {
      eventRequired: string;
      endpointRequired: string;
      urlSchemeRequired: string;
    };
    table: {
      endpoint: string;
      events: string;
      created: string;
      actions: string;
      delete: string;
    };
    empty: {
      message: string;
    };
    deleteModal: {
      title: string;
      description: string;
      cancel: string;
      delete: string;
    };
    events: {
      walletTransactionEvent: string;
      bankIncomeRefreshUpdate: string;
      bankIncomeRefreshComplete: string;
      accountUpdate: string;
      transactionUpdate: string;
      identityVerificationComplete: string;
      linkEvent: string;
      paymentStatusUpdate: string;
    };
  };
  organizationTeams: {
    createTeamButton: string;
    emptyTitle: string;
    emptyMessage: string;
    section: {
      description: string;
      productsOfInterest: string;
      members: (count: number) => string;
    };
    actions: {
      addMember: string;
      cancel: string;
      createTeam: string;
    };
    badges: {
      admin: string;
    };
    defaults: {
      teamName: string;
      teamDescription: string;
      memberName: string;
    };
    createTeamModal: {
      title: string;
      teamNameLabel: string;
      teamNamePlaceholder: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      mentionProductsLater: string;
      productsLabel: string;
    };
    addMemberModal: {
      title: string;
      fullNameLabel: string;
      fullNamePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      submit: string;
    };
  };
  profilePage: {
    title: string;
    description: string;
    form: {
      businessName: string;
      businessNamePlaceholder: string;
      website: string;
      websitePlaceholder: string;
      address: string;
      addressPlaceholder: string;
      saveButton: string;
      branding: {
        title: string;
        logoLabel: string;
        logoHelper: string;
        uploadButton: string;
        colorLabel: string;
      };
    };
  };
  settings: {
    pageTitle: string;
    personalInformation: string;
    fullName: string;
    phoneNumber: string;
    emailAddress: string;
    username: string;
    bio: string;
    writeYourBioHere: string;
    cancel: string;
    save: string;
    yourPhoto: string;
    editYourPhoto: string;
    delete: string;
    update: string;
    clickToUpload: string;
    orDragAndDrop: string;
    fileFormats: string;
  };
  tourModal: {
    selectProductsTitle: string;
    selectProductsDescription: string;
    selectAll: string;
    deselectAll: string;
    cancel: string;
    continue: string;
    welcomeTitle: string;
    welcomeDescription: string;
    selectedProducts: string;
    back: string;
    startTour: string;
  };
  tourOverlay: {
    previous: string;
    next: string;
    finish: string;
    pause: string;
    resume: string;
    step: string;
    of: string;
  };
};

const UI_TRANSLATIONS: Record<Language, UiTranslations> = {
  en: {
    header: {
      title: "Dashboard",
      searchPlaceholder: "Search",
      toggleSidebar: "Toggle Sidebar",
      breadcrumbRoot: "Dashboard",
    },
    languageToggle: {
      switchToSpanish: "Switch language to Spanish",
      switchToEnglish: "Switch language to English",
    },

    sidebar: {
      closeMenu: "Close Menu",
      mainMenu: "MAIN MENU",
      products: "PRODUCTS",
      onboarding: "ONBOARDING",
      menuItems: {
        dashboard: "Dashboard",
        calendar: "Calendar",
        organization: "Organization",
        zelifyKeys: "Zelify Keys",
        allProducts: "All products",
        logs: "Logs",
        webhooks: "Webhooks",
        auth: "Auth",
        aml: "AML",
        identity: "Identity",
        connect: "Connect",
        cards: "Cards",
        transfers: "Transfers",
        tx: "Tx",
        ai: "AI",
        payments: "Payments and Transfers",
        notifications: "Notifications",
        discountsCoupons: "Discounts & Coupons",
        insurance: "Insurance",
        businessInfo: "Business Information",
        kyb: "KYB",
        amlDocumentation: "AML Documentation",
        technicalDocumentation: "Technical Documentation",
        subItems: {
          ecommerce: "Panel",
          profile: "Company Profile",
          teams: "Teams",
          authentication: "Authentication",
          geolocalization: "Geolocalization",
          deviceInformation: "Device information",
          validationGlobalList: "Global list validation",
          workflow: "Workflow",
          bankAccountLinking: "Bank account linking",
          issuing: "Issuing",
          design: "Design",
          transactions: "Transactions",
          diligence: "Diligence",
          basicService: "Basic Service",
          transfers: "Transfers",
          internationalTransfers: "International transfers",
          alaiza: "Alaiza",
          behaviorAnalysis: "Behavior Analysis",
          financialEducation: "Financial Education",
          customKeys: "Custom Keys",
          qr: "QR",
          templates: "Templates",
          domains: "Domains",
          coupons: "Coupons",
          createCoupon: "Create Coupon",
          analyticsUsage: "Analytics & Usage",
          insuranceAssistance: "Insurance Assistance",
          quoteInsurance: "Quote Insurance",
          discounts: "Discounts",
        },
        lockedTooltip:
          "This section is disabled for the user until the onboarding section is completed",
      },
    },
    notification: {
      viewNotifications: "View Notifications",
      notifications: "Notifications",
      new: "new",
      seeAllNotifications: "See all notifications",
      items: {
        piterJoined: "Piter Joined the Team!",
        congratulateHim: "Congratulate him",
        newMessage: "New message",
        devidSentMessage: "Devid sent a new message",
        newPaymentReceived: "New Payment received",
        checkEarnings: "Check your earnings",
        jollyCompletedTasks: "Jolly completed tasks",
        assignNewTask: "Assign new task",
        romanJoined: "Roman Joined the Team!",
      },
    },
    userInfo: {
      myAccount: "My Account",
      userInformation: "User information",
      viewProfile: "View profile",
      accountSettings: "Account Settings",
      logOut: "Log out",
    },
    themeToggle: {
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
    },
    logsPage: {
      search: {
        label: "Client User ID",
        placeholder: "Search by the client_user_id configured on the link_token",
        ariaLabel: "Search",
      },
      filters: {
        type: "Type",
        institution: "Institution",
        environment: "Environment",
        errorCodesPlaceholder: "Error Codes",
        resetAriaLabel: "Reset filters",
        resetTitle: "Reset all filters",
      },
      values: {
        logTypes: {
          apiRequest: "API request",
          webhook: "Webhook",
          linkEvent: "Link event",
        },
        environments: {
          production: "Production",
          sandbox: "Sandbox",
        },
      },
      table: {
        type: "Type",
        description: "Description",
        institution: "Institution",
        env: "Env",
        timestamp: "Timestamp",
        response: "Response",
        payload: "Payload",
        emptyTitle: "No logs found, try another set of filters",
        emptySubtitle: "We only store logs for the last 14 days. Try different filters.",
        prodShort: "Prod",
        sandboxShort: "Sandbox",
      },
      pagination: {
        firstPage: "First page",
        previousPage: "Previous page",
        nextPage: "Next page",
        lastPage: "Last page",
      },
    },
    webhooksPage: {
      newWebhook: "New webhook",
      configureWebhook: "Configure Webhook",
      cancel: "Cancel",
      sections: {
        event: {
          title: "Event",
          description:
            "This shows webhooks for the products that your team is enabled for. To configure listeners for webhook events not listed here, see the API reference.",
          selectPlaceholder: "Select Event",
        },
        webhook: {
          title: "Webhook",
          endpointPlaceholder: "Endpoint URL",
          configureButton: "Configure",
        },
      },
      validation: {
        eventRequired: "Event is required",
        endpointRequired: "Endpoint URL is required",
        urlSchemeRequired: "URL must start with http:// or https://",
      },
      table: {
        endpoint: "Endpoint",
        events: "Events",
        created: "Created",
        actions: "Actions",
        delete: "Delete",
      },
      empty: {
        message: 'No webhooks configured. Click "New webhook" to get started.',
      },
      deleteModal: {
        title: "Delete Webhook",
        description:
          "Are you sure you want to delete this webhook? This action cannot be undone and you will stop receiving notifications for this event.",
        cancel: "Cancel",
        delete: "Delete",
      },
      events: {
        walletTransactionEvent: "Wallet transaction event",
        bankIncomeRefreshUpdate: "Bank Income Refresh Update",
        bankIncomeRefreshComplete: "Bank Income Refresh Complete",
        accountUpdate: "Account Update",
        transactionUpdate: "Transaction Update",
        identityVerificationComplete: "Identity Verification Complete",
        linkEvent: "Link Event",
        paymentStatusUpdate: "Payment Status Update",
      },
    },
    organizationTeams: {
      createTeamButton: "Create Team",
      emptyTitle: "Teams",
      emptyMessage: "No teams created yet.",
      section: {
        description: "Description",
        productsOfInterest: "Products of interest",
        members: (count) => `Members (${count})`,
      },
      actions: {
        addMember: "Add Member",
        cancel: "Cancel",
        createTeam: "Create Team",
      },
      badges: {
        admin: "Admin",
      },
      defaults: {
        teamName: "Administrators",
        teamDescription: "System administrators team",
        memberName: "Default user",
      },
      createTeamModal: {
        title: "Create New Team",
        teamNameLabel: "Team Name",
        teamNamePlaceholder: "e.g. Development Team",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Describe the team's purpose and goals...",
        mentionProductsLater: "Mention products later",
        productsLabel: "Products of interest",
      },
      addMemberModal: {
        title: "Add Team Member",
        fullNameLabel: "Full Name",
        fullNamePlaceholder: "e.g. Jane Doe",
        emailLabel: "Email",
        emailPlaceholder: "e.g. jane.doe@example.com",
        phoneLabel: "Mobile phone (optional)",
        phonePlaceholder: "e.g. +1 555 123 4567",
        submit: "Add Member",
      },
    },
    profilePage: {
      title: "General Information",
      description: "Complete your business general information",
      form: {
        businessName: "Business Name",
        businessNamePlaceholder: "Enter your business name",
        website: "Website",
        websitePlaceholder: "https://example.com",
        address: "Headquarters address",
        addressPlaceholder: "Enter the full address of the headquarters",
        saveButton: "Save general information",
        branding: {
          title: "Branding",
          logoLabel: "Logo",
          logoHelper: "Drag, paste or select an image (PNG, JPG, SVG, WEBP)",
          uploadButton: "Select file",
          colorLabel: "Primary Color",
        },
      },
    },
    settings: {
      pageTitle: "Settings",
      personalInformation: "Personal Information",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      emailAddress: "Email Address",
      username: "Username",
      bio: "BIO",
      writeYourBioHere: "Write your bio here",
      cancel: "Cancel",
      save: "Save",
      yourPhoto: "Your Photo",
      editYourPhoto: "Edit your photo",
      delete: "Delete",
      update: "Update",
      clickToUpload: "Click to upload",
      orDragAndDrop: "or drag and drop",
      fileFormats: "SVG, PNG, JPG or GIF (max, 800 X 800px)",
    },
    tourModal: {
      selectProductsTitle: "Select Products",
      selectProductsDescription:
        "Choose the products you want to include in the tour. You can select one or several products.",
      selectAll: "Select all",
      deselectAll: "Deselect all",
      cancel: "Cancel",
      continue: "Continue",
      welcomeTitle: "Welcome to the Tour",
      welcomeDescription:
        "A tour of the selected products will be shown below to help you learn about the main features of the application.",
      selectedProducts: "Selected products:",
      back: "Back",
      startTour: "Start Tour",
    },
    tourOverlay: {
      previous: "Previous",
      next: "Next",
      finish: "Finish",
      pause: "Pause tour",
      resume: "Resume tour",
      step: "Step",
      of: "of",
    },
  },
  es: {
    header: {
      title: "Panel",
      searchPlaceholder: "Buscar",
      toggleSidebar: "Alternar barra lateral",
      breadcrumbRoot: "Panel",
    },
    languageToggle: {
      switchToSpanish: "Cambiar idioma a español",
      switchToEnglish: "Cambiar idioma a inglés",
    },
    sidebar: {
      closeMenu: "Cerrar menú",
      mainMenu: "MENÚ PRINCIPAL",
      products: "PRODUCTOS",
      onboarding: "ONBOARDING",
      menuItems: {
        dashboard: "Panel",
        calendar: "Calendario",
        organization: "Organización",
        zelifyKeys: "Zelify Keys",
        allProducts: "Todos los productos",
        logs: "Registros",
        webhooks: "Webhooks",
        auth: "Autenticación",
        aml: "AML",
        identity: "Identidad",
        connect: "Connect",
        cards: "Tarjetas",
        transfers: "Transferencias",
        tx: "Tx",
        ai: "IA",
        payments: "Pagos y transferencias",
        notifications: "Notificaciones",
        discountsCoupons: "Descuentos y Cupones",
        insurance: "Seguros",
        businessInfo: "Información de negocio",
        kyb: "KYB",
        amlDocumentation: "Documentación AML",
        technicalDocumentation: "Documentación técnica",
        subItems: {
          ecommerce: "Panel",
          profile: "Perfil de la empresa",
          teams: "Equipos",
          authentication: "Autenticación",
          geolocalization: "Geolocalización",
          deviceInformation: "Información del dispositivo",
          validationGlobalList: "Validación de listas globales",
          workflow: "Flujo de trabajo",
          bankAccountLinking: "Vinculación de cuenta bancaria",
          issuing: "Emisión",
          design: "Diseño",
          transactions: "Transacciones",
          diligence: "Diligencia",
          basicService: "Servicios Básicos",
          transfers: "Transferencias",
          internationalTransfers: "Transferencias internacionales",
          alaiza: "Alaiza",
          behaviorAnalysis: "Análisis de Comportamiento",
          financialEducation: "Educación Financiera",
          customKeys: "Claves Personalizadas",
          qr: "QR",
          templates: "Plantillas",
          domains: "Domains",
          coupons: "Cupones",
          createCoupon: "Crear Cupón",
          analyticsUsage: "Análisis y Uso",
          insuranceAssistance: "Asistencia de Seguros",
          quoteInsurance: "Cotización de Seguros",
          discounts: "Descuentos",
        },
        lockedTooltip:
          "Esta sección está deshabilitada para el usuario cuando complete la sección de onboarding",
      },
    },
    notification: {
      viewNotifications: "Ver notificaciones",
      notifications: "Notificaciones",
      new: "nuevas",
      seeAllNotifications: "Ver todas las notificaciones",
      items: {
        piterJoined: "¡Piter se unió al equipo!",
        congratulateHim: "Felicítalo",
        newMessage: "Nuevo mensaje",
        devidSentMessage: "Devid envió un nuevo mensaje",
        newPaymentReceived: "Nuevo pago recibido",
        checkEarnings: "Revisa tus ganancias",
        jollyCompletedTasks: "Jolly completó tareas",
        assignNewTask: "Asignar nueva tarea",
        romanJoined: "¡Roman se unió al equipo!",
      },
    },
    userInfo: {
      myAccount: "Mi Cuenta",
      userInformation: "Información del usuario",
      viewProfile: "Ver perfil",
      accountSettings: "Configuración de cuenta",
      logOut: "Cerrar sesión",
    },
    themeToggle: {
      switchToLight: "Cambiar a modo claro",
      switchToDark: "Cambiar a modo oscuro",
    },
    logsPage: {
      search: {
        label: "ID de usuario cliente",
        placeholder: "Busca por el client_user_id configurado en el link_token",
        ariaLabel: "Buscar",
      },
      filters: {
        type: "Tipo",
        institution: "Institución",
        environment: "Ambiente",
        errorCodesPlaceholder: "Códigos de error",
        resetAriaLabel: "Reiniciar filtros",
        resetTitle: "Reiniciar todos los filtros",
      },
      values: {
        logTypes: {
          apiRequest: "Solicitud API",
          webhook: "Webhook",
          linkEvent: "Evento de vinculación",
        },
        environments: {
          production: "Producción",
          sandbox: "Sandbox",
        },
      },
      table: {
        type: "Tipo",
        description: "Descripción",
        institution: "Institución",
        env: "Amb",
        timestamp: "Fecha/Hora",
        response: "Respuesta",
        payload: "Payload",
        emptyTitle: "No se encontraron logs, prueba con otros filtros",
        emptySubtitle: "Solo guardamos logs de los últimos 14 días. Prueba filtros diferentes.",
        prodShort: "Prod",
        sandboxShort: "Sandbox",
      },
      pagination: {
        firstPage: "Primera página",
        previousPage: "Página anterior",
        nextPage: "Página siguiente",
        lastPage: "Última página",
      },
    },
    webhooksPage: {
      newWebhook: "Nuevo webhook",
      configureWebhook: "Configurar Webhook",
      cancel: "Cancelar",
      sections: {
        event: {
          title: "Evento",
          description:
            "Aquí ves webhooks de los productos habilitados para tu equipo. Para configurar listeners de eventos no listados aquí, revisa la referencia de la API.",
          selectPlaceholder: "Seleccionar evento",
        },
        webhook: {
          title: "Webhook",
          endpointPlaceholder: "URL del endpoint",
          configureButton: "Configurar",
        },
      },
      validation: {
        eventRequired: "El evento es obligatorio",
        endpointRequired: "La URL del endpoint es obligatoria",
        urlSchemeRequired: "La URL debe comenzar con http:// o https://",
      },
      table: {
        endpoint: "Endpoint",
        events: "Eventos",
        created: "Creado",
        actions: "Acciones",
        delete: "Eliminar",
      },
      empty: {
        message: 'No hay webhooks configurados. Haz clic en "Nuevo webhook" para comenzar.',
      },
      deleteModal: {
        title: "Eliminar Webhook",
        description:
          "¿Seguro que deseas eliminar este webhook? Esta acción no se puede deshacer y dejarás de recibir notificaciones para este evento.",
        cancel: "Cancelar",
        delete: "Eliminar",
      },
      events: {
        walletTransactionEvent: "Evento de transacción de wallet",
        bankIncomeRefreshUpdate: "Actualización de refresco de ingresos bancarios",
        bankIncomeRefreshComplete: "Refresco de ingresos bancarios completado",
        accountUpdate: "Actualización de cuenta",
        transactionUpdate: "Actualización de transacción",
        identityVerificationComplete: "Verificación de identidad completada",
        linkEvent: "Evento de vinculación",
        paymentStatusUpdate: "Actualización de estado de pago",
      },
    },
    organizationTeams: {
      createTeamButton: "Crear Equipo",
      emptyTitle: "Equipos",
      emptyMessage: "No hay equipos creados aún.",
      section: {
        description: "Descripción",
        productsOfInterest: "Productos de interés",
        members: (count) => `Miembros (${count})`,
      },
      actions: {
        addMember: "Añadir Miembro",
        cancel: "Cancelar",
        createTeam: "Crear Equipo",
      },
      badges: {
        admin: "Admin",
      },
      defaults: {
        teamName: "Administradores",
        teamDescription: "Equipo de administradores del sistema",
        memberName: "Usuario por defecto",
      },
      createTeamModal: {
        title: "Crear Nuevo Equipo",
        teamNameLabel: "Nombre del Equipo",
        teamNamePlaceholder: "Ej: Equipo de Desarrollo",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Describe el propósito y objetivos del equipo...",
        mentionProductsLater: "Mencionar productos más tarde",
        productsLabel: "Productos de interés",
      },
      addMemberModal: {
        title: "Añadir Miembro al Equipo",
        fullNameLabel: "Nombre Completo",
        fullNamePlaceholder: "Ej: Juan Pérez",
        emailLabel: "Email",
        emailPlaceholder: "Ej: juan.perez@example.com",
        phoneLabel: "Teléfono Móvil (Opcional)",
        phonePlaceholder: "Ej: +52 55 1234 5678",
        submit: "Añadir Miembro",
      },
    },
    profilePage: {
      title: "Información general",
      description: "Complete la información general de su negocio",
      form: {
        businessName: "Nombre del negocio",
        businessNamePlaceholder: "Ingrese el nombre de su empresa",
        website: "Sitio web",
        websitePlaceholder: "https://ejemplo.com",
        address: "Dirección de la sede principal",
        addressPlaceholder:
          "Ingrese la dirección completa de la sede principal",
        saveButton: "Guardar información general",
        branding: {
          title: "Personalización de marca",
          logoLabel: "Logo",
          logoHelper:
            "Arrastra, pega o selecciona una imagen (PNG, JPG, SVG, WEBP)",
          uploadButton: "Seleccionar archivo",
          colorLabel: "Color primario",
        },
      },
    },
    settings: {
      pageTitle: "Configuración",
      personalInformation: "Información Personal",
      fullName: "Nombre Completo",
      phoneNumber: "Número de Teléfono",
      emailAddress: "Correo Electrónico",
      username: "Nombre de Usuario",
      bio: "BIO",
      writeYourBioHere: "Escribe tu biografía aquí",
      cancel: "Cancelar",
      save: "Guardar",
      yourPhoto: "Tu Foto",
      editYourPhoto: "Editar tu foto",
      delete: "Eliminar",
      update: "Actualizar",
      clickToUpload: "Haz clic para subir",
      orDragAndDrop: "o arrastra y suelta",
      fileFormats: "SVG, PNG, JPG o GIF (máx., 800 X 800px)",
    },
    tourModal: {
      selectProductsTitle: "Selecciona los productos",
      selectProductsDescription:
        "Elige los productos que deseas incluir en el tour. Puedes seleccionar uno o varios productos.",
      selectAll: "Seleccionar todos",
      deselectAll: "Deseleccionar todos",
      cancel: "Cancelar",
      continue: "Continuar",
      welcomeTitle: "Bienvenido al Tour",
      welcomeDescription:
        "A continuación se mostrará un tour de los productos seleccionados que te ayudará a conocer las funcionalidades principales de la aplicación.",
      selectedProducts: "Productos seleccionados:",
      back: "Volver",
      startTour: "Comenzar Tour",
    },
    tourOverlay: {
      previous: "Anterior",
      next: "Siguiente",
      finish: "Finalizar",
      pause: "Pausar tour",
      resume: "Reanudar tour",
      step: "Paso",
      of: "de",
    },
  },
};

export function useUiTranslations() {
  return useLanguageTranslations(UI_TRANSLATIONS);
}
