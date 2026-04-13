"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import type { TemplateKey } from "./notifications-data";

type TemplateCopy = Record<
  TemplateKey,
  {
    name: string;
    subject: string;
    description: string;
  }
>;

type NotificationsTranslations = {
  breadcrumb: string;
  domainsBreadcrumb: string;
  pageTitle: string;
  pageDescription: string;
  header: {
    templatesBadge: string;
  };
  categorySelector: {
    title: string;
    mailing: {
      label: string;
      description: string;
    };
    notifications: {
      label: string;
      description: string;
    };
  };
  summaryCards: {
    total: string;
    active: string;
    lastUpdated: string;
  };
  categories: {
    title: string;
    subtitle: string;
    selectedChannelLabel: (channel: string) => string;
    newNamePlaceholder: string;
    newDescriptionPlaceholder: string;
    createButton: string;
    customDescriptionFallback: string;
    card: {
      label: string;
      templatesCount: (count: number) => string;
    };
    empty: string;
  };
  createTemplate: {
    badge: string;
    title: (category: string) => string;
    titleFallback: string;
    subtitle: string;
    templateNameLabel: string;
    templateNamePlaceholder: string;
    htmlLabel: string;
    fromLabel: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    saving: string;
    createButton: string;
    otpOnlyVariablesHint: string;
    otpVariablesInlineHint: string;
    previewFallbackTitle: string;
    previewFallbackBody: string;
  };
  remote: {
    remoteTemplateName: string;
    remoteTemplateDescription: string;
    noRemoteTemplates: string;
  };
  validation: {
    completeNameAndHtml: string;
    templateNameRequired: string;
    templateHtmlRequired: string;
    otpMissingRequiredVars: string;
    otpMissingRequiredVarsField: string;
    otpOnlyAllowedVars: string;
    otpRemoveDisallowedVars: (vars: string) => string;
    templateNameUnique: string;
    templateNameDuplicate: string;
    createdSuccess: string;
    createdError: string;
  };
  templateList: {
    title: string;
    lastUsed: string;
    selectCategory: string;
    ctr: string;
    openRate: string;
    customTemplateFallback: string;
    empty: string;
    status: {
      active: string;
      inactive: string;
      draft: string;
    };
    channel: {
      email: string;
      push: string;
    };
  };
  previewPanel: {
    title: string;
    html: string;
    live: string;
    activate: string;
    save: string;
    delete: string;
    activeBadge: string;
    noSelection: string;
  };
  alerts: {
    saved: string;
    activated: string;
    deleted: string;
  };
  templateEditor: {
    templateNotFound: string;
    backToTemplates: string;
    requiredVariables: string;
    required: string;
    fromLabel: string;
    recipientLabel: string;
    subjectLabel: string;
    recipientPlaceholder: string;
    deleteProgress: string;
    activateProgress: string;
    saveProgress: string;
    remoteTemplateFetchError: string;
    remoteTemplateNotFound: string;
    saveError: string;
    activateError: string;
    deleteError: string;
    remoteIdMissing: string;
  };
  domains: {
    pageTitle: string;
    pageSubtitle: string;
    domainsLabel: string;
    addDomainButton: string;
    domainSubdomainLabel: string;
    domainSubdomainPlaceholder: string;
    domainLabel: string;
    dnsTitle: string;
    verifyDnsButton: string;
    verifyDnsLoading: string;
    loadingSettings: string;
    refreshFromServer: string;
    createdLabel: string;
    updatedLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    modalTitle: string;
    modalHint: string;
    modalCancel: string;
    modalCreate: string;
    modalCreating: string;
    orgMissing: string;
    loadError: string;
    create409: string;
    create404: string;
    createError: string;
    dnsRecordsTableTitle: string;
    dnsPublicTableTitle: string;
    tableCategory: string;
    tableType: string;
    tableName: string;
    tableValue: string;
    tableTtl: string;
    tablePriority: string;
    tableStatus: string;
    publicLookupFqdn: string;
    publicMatch: string;
    publicExpected: string;
    publicObserved: string;
    publicError: string;
    allRecordsMatch: string;
    partialRecordsMatch: string;
    checkedAt: string;
    copyValue: string;
    copied: string;
    status: {
      verified: string;
      pending: string;
      failed: string;
      dnsWarning: string;
      yes: string;
      no: string;
    };
  };
  groups: Record<string, { name: string; description: string }>;
  templates: TemplateCopy;
};

const NOTIFICATIONS_TRANSLATIONS: Record<Language, NotificationsTranslations> = {
  es: {
    breadcrumb: "Notificaciones / Plantillas",
    domainsBreadcrumb: "Notificaciones / Dominios",
    pageTitle: "Centro de plantillas",
    pageDescription:
      "Administra tus notificaciones de mailing y push. Activa variaciones, revisa su código y publica cambios en segundos.",
    header: {
      templatesBadge: "Plantillas",
    },
    categorySelector: {
      title: "Canales disponibles",
      mailing: {
        label: "Mailing",
        description: "Plantillas HTML optimizadas para email y correos automatizados.",
      },
      notifications: {
        label: "Notificaciones",
        description: "Alertas push e in-app con mensajes cortos y contexto transaccional.",
      },
    },
    summaryCards: {
      total: "Plantillas disponibles",
      active: "Plantilla activa",
      lastUpdated: "Última actualización",
    },
    categories: {
      title: "Categorías",
      subtitle: "Gestiona tus categorías",
      selectedChannelLabel: (channel) => `Canal seleccionado: ${channel}`,
      newNamePlaceholder: "Nueva categoría",
      newDescriptionPlaceholder: "Descripción",
      createButton: "Crear categoría",
      customDescriptionFallback: "Categoría personalizada",
      card: {
        label: "Categoría",
        templatesCount: (count) => `Plantillas: ${count}`,
      },
      empty: "Aún no hay categorías para este canal.",
    },
    createTemplate: {
      badge: "Nueva plantilla",
      title: (category) => `Crear plantilla en ${category}`,
      titleFallback: "Crear plantilla en esta categoría",
      subtitle: "Los cambios se enviarán al endpoint externo y veremos si fue exitoso.",
      templateNameLabel: "Nombre de la plantilla",
      templateNamePlaceholder: "Recordatorio Cash-in",
      htmlLabel: "HTML",
      fromLabel: "From",
      subjectLabel: "Subject",
      subjectPlaceholder: "Tu código sigue activo",
      saving: "Guardando...",
      createButton: "Crear plantilla",
      otpOnlyVariablesHint: "Solo se permiten las variables ${safeName} y ${code} en el HTML.",
      otpVariablesInlineHint: "Solo se permiten las variables",
      previewFallbackTitle: "Vista previa",
      previewFallbackBody: "Pega tu HTML para verlo aquí.",
    },
    remote: {
      remoteTemplateName: "Plantilla remota",
      remoteTemplateDescription: "Plantilla sincronizada desde el endpoint remoto.",
      noRemoteTemplates:
        "Aún no existen plantillas registradas para este canal/categoría en el servicio remoto. Crea una plantilla y publícala para sincronizarla.",
    },
    validation: {
      completeNameAndHtml: "Completa el nombre y código HTML.",
      templateNameRequired: "El nombre de la plantilla es obligatorio.",
      templateHtmlRequired: "El HTML es obligatorio.",
      otpMissingRequiredVars: "El HTML debe incluir las variables obligatorias ${safeName} y ${code}.",
      otpMissingRequiredVarsField: "Incluye ${safeName} y ${code} en el HTML.",
      otpOnlyAllowedVars: "Solo se permiten las variables ${safeName} y ${code} en OTP.",
      otpRemoveDisallowedVars: (vars) => `Elimina variables no permitidas como ${vars}.`,
      templateNameUnique: "El nombre de la plantilla debe ser único.",
      templateNameDuplicate: "Ya existe una plantilla con este nombre.",
      createdSuccess: "Plantilla creada correctamente.",
      createdError: "No se pudo crear la plantilla.",
    },
    templateList: {
      title: "Previsualizaciones",
      lastUsed: "Último uso",
      selectCategory: "Selecciona una categoría",
      ctr: "CTR",
      openRate: "Open rate",
      customTemplateFallback: "Plantilla personalizada",
      empty: "Aún no hay plantillas en esta categoría. Crea una nueva para comenzar.",
      status: {
        active: "Activa",
        inactive: "Inactiva",
        draft: "Borrador",
      },
      channel: {
        email: "Email",
        push: "Push",
      },
    },
    previewPanel: {
      title: "Panel de edición",
      html: "Código HTML",
      live: "Vista previa",
      activate: "Activar plantilla",
      save: "Guardar cambios",
      delete: "Eliminar plantilla",
      activeBadge: "Activa",
      noSelection: "Selecciona una plantilla para ver el código y la vista previa",
    },
    alerts: {
      saved: "Plantilla guardada correctamente.",
      activated: "Plantilla activada para el canal seleccionado.",
      deleted: "Plantilla eliminada.",
    },
    templateEditor: {
      templateNotFound: "Plantilla no encontrada",
      backToTemplates: "Volver a plantillas",
      requiredVariables: "Variables requeridas",
      required: "obligatorio",
      fromLabel: "From",
      recipientLabel: "To",
      subjectLabel: "Subject",
      recipientPlaceholder: "usuario@correo.com",
      deleteProgress: "Eliminando...",
      activateProgress: "Activando...",
      saveProgress: "Guardando...",
      remoteTemplateFetchError: "No se pudo obtener la plantilla remota.",
      remoteTemplateNotFound: "No existe una plantilla remota con este nombre.",
      saveError: "No se pudo guardar la plantilla.",
      activateError: "No se pudo activar la plantilla.",
      deleteError: "No se pudo eliminar la plantilla.",
      remoteIdMissing: "No se pudo obtener el identificador remoto de la plantilla.",
    },
    domains: {
      pageTitle: "Dominio y envío de correo",
      pageSubtitle:
        "Un dominio por organización. Publica los registros DNS que indica la plataforma y verifica contra DNS público cuando lo necesites.",
      domainsLabel: "Dominios",
      addDomainButton: "Configurar dominio",
      domainSubdomainLabel: "Dominio o subdominio",
      domainSubdomainPlaceholder: "mail.empresa.com",
      domainLabel: "Dominio configurado",
      dnsTitle: "Registros DNS esperados",
      verifyDnsButton: "Verificar DNS público",
      verifyDnsLoading: "Consultando DNS…",
      loadingSettings: "Cargando configuración…",
      refreshFromServer: "Actualizar datos",
      createdLabel: "Creado",
      updatedLabel: "Actualizado",
      emptyTitle: "Aún no hay dominio de envío",
      emptyDescription:
        "Crea la configuración con el dominio o subdominio desde el que enviarás correo (por ejemplo mail.tuempresa.com). Solo puede existir una configuración por organización.",
      modalTitle: "Nuevo dominio de envío",
      modalHint: "Debe coincidir con el host que usarás en los registros (FQDN tipo nombre.dominio).",
      modalCancel: "Cancelar",
      modalCreate: "Crear configuración",
      modalCreating: "Creando…",
      orgMissing: "No hay organización en sesión; no se puede cargar la configuración.",
      loadError: "No se pudo cargar la configuración de dominio.",
      create409: "Esta organización ya tiene un dominio configurado. Solo se permite uno.",
      create404: "La organización no existe o no tienes acceso.",
      createError: "No se pudo crear la configuración.",
      dnsRecordsTableTitle: "Registros a publicar",
      dnsPublicTableTitle: "Resultado de verificación DNS",
      tableCategory: "Categoría",
      tableType: "Tipo",
      tableName: "Nombre",
      tableValue: "Valor",
      tableTtl: "TTL",
      tablePriority: "Prioridad",
      tableStatus: "Estado",
      publicLookupFqdn: "FQDN consultado",
      publicMatch: "Coincide",
      publicExpected: "Valor esperado",
      publicObserved: "Observado",
      publicError: "Error de consulta",
      allRecordsMatch: "Todos los registros coinciden con la configuración esperada.",
      partialRecordsMatch: "Al menos un registro no coincide o no se pudo resolver.",
      checkedAt: "Verificado el",
      copyValue: "Copiar",
      copied: "Copiado",
      status: {
        verified: "Verificado",
        pending: "Pendiente",
        failed: "Error",
        dnsWarning: "Revisar",
        yes: "Sí",
        no: "No",
      },
    },
    groups: {
      "otp-flows": {
        name: "OTP",
        description: "Notificaciones de verificación y códigos de un solo uso.",
      },
      "security-alerts": {
        name: "Alertas de seguridad",
        description: "Correos críticos para accesos sospechosos o bloqueos.",
      },
      "monthly-reports": {
        name: "Reportes mensuales",
        description: "Resúmenes y reportes periódicos para tus clientes.",
      },
      "login-alerts": {
        name: "Alertas de inicio de sesión",
        description: "Notifica accesos exitosos y novedades de autenticación.",
      },
      "account-statements": {
        name: "Estados de cuenta",
        description: "Reportes automáticos con movimientos y saldos.",
      },
      transactions: {
        name: "Transacciones",
        description: "Actualizaciones sobre transferencias y cash-ins.",
      },
      payments: {
        name: "Pagos",
        description: "Confirmaciones y recordatorios de pagos programados.",
      },
      "push-transfers": {
        name: "Push cash-outs",
        description: "Notificaciones push transaccionales.",
      },
      "push-alerts": {
        name: "Alertas push",
        description: "Alertas in-app y push para cash-outs inusuales.",
      },
    },
    templates: {
      otpCode: {
        name: "Envío de código OTP",
        subject: "Tu código para continuar",
        description: "Entrega códigos de verificación seguros por correo electrónico.",
      },
      otpReminder: {
        name: "Recordatorio de OTP",
        subject: "Tu código sigue activo",
        description: "Envía un recordatorio antes de que el código expire.",
      },
      securityAlert: {
        name: "Alerta de seguridad",
        subject: "Nuevo inicio de sesión detectado",
        description: "Envía advertencias inmediatas cuando se detectan accesos inusuales.",
      },
      monthlySummary: {
        name: "Resumen mensual",
        subject: "Actividad y métricas del mes",
        description: "Compila la actividad de la cuenta y próximos pagos.",
      },
      transferPush: {
        name: "Push de transferencias",
        subject: "Cash-out confirmado",
        description: "Mensaje corto para confirmar envíos salientes exitosos.",
      },
      cashOutAlert: {
        name: "Alerta de cash-out",
        subject: "Revisa este movimiento",
        description: "Pide confirmación cuando detectas retiros con riesgo.",
      },
    },
  },
  en: {
    breadcrumb: "Notifications / Templates",
    domainsBreadcrumb: "Notifications / Domains",
    pageTitle: "Templates workspace",
    pageDescription:
      "Manage your email and push templates. Activate variations, inspect their code and publish changes in seconds.",
    header: {
      templatesBadge: "Templates",
    },
    categorySelector: {
      title: "Channels",
      mailing: {
        label: "Mailing",
        description: "HTML templates optimized for onboarding and automated email flows.",
      },
      notifications: {
        label: "Notifications",
        description: "Push or in-app alerts with compact transactional messaging.",
      },
    },
    summaryCards: {
      total: "Templates available",
      active: "Active template",
      lastUpdated: "Last edit",
    },
    categories: {
      title: "Categories",
      subtitle: "Manage categories",
      selectedChannelLabel: (channel) => `Selected channel: ${channel}`,
      newNamePlaceholder: "New category",
      newDescriptionPlaceholder: "Description",
      createButton: "Create category",
      customDescriptionFallback: "Custom category",
      card: {
        label: "Category",
        templatesCount: (count) => `Templates: ${count}`,
      },
      empty: "No categories yet for this channel.",
    },
    createTemplate: {
      badge: "New template",
      title: (category) => `Create template in ${category}`,
      titleFallback: "Create template in this category",
      subtitle: "Changes will be sent to the external endpoint and we will confirm whether it was successful.",
      templateNameLabel: "Template name",
      templateNamePlaceholder: "Cash-in reminder",
      htmlLabel: "HTML",
      fromLabel: "From",
      subjectLabel: "Subject",
      subjectPlaceholder: "Your code is still valid",
      saving: "Saving...",
      createButton: "Create template",
      otpOnlyVariablesHint: "Only ${safeName} and ${code} variables are allowed in the HTML.",
      otpVariablesInlineHint: "Only variables",
      previewFallbackTitle: "Preview",
      previewFallbackBody: "Paste your HTML to see it here.",
    },
    remote: {
      remoteTemplateName: "Remote template",
      remoteTemplateDescription: "Template synced from the remote endpoint.",
      noRemoteTemplates:
        "No templates exist yet for this channel/category on the remote service. Create one and publish it to sync.",
    },
    validation: {
      completeNameAndHtml: "Fill in the name and HTML code.",
      templateNameRequired: "Template name is required.",
      templateHtmlRequired: "HTML is required.",
      otpMissingRequiredVars: "HTML must include the required variables ${safeName} and ${code}.",
      otpMissingRequiredVarsField: "Include ${safeName} and ${code} in the HTML.",
      otpOnlyAllowedVars: "Only ${safeName} and ${code} variables are allowed for OTP.",
      otpRemoveDisallowedVars: (vars) => `Remove disallowed variables such as ${vars}.`,
      templateNameUnique: "Template name must be unique.",
      templateNameDuplicate: "A template with this name already exists.",
      createdSuccess: "Template created successfully.",
      createdError: "Could not create template.",
    },
    templateList: {
      title: "Preview gallery",
      lastUsed: "Last triggered",
      selectCategory: "Select a category",
      ctr: "CTR",
      openRate: "Open rate",
      customTemplateFallback: "Custom template",
      empty: "No templates in this category yet. Create one to get started.",
      status: {
        active: "Active",
        inactive: "Inactive",
        draft: "Draft",
      },
      channel: {
        email: "Email",
        push: "Push",
      },
    },
    previewPanel: {
      title: "Editing panel",
      html: "HTML code",
      live: "Live preview",
      activate: "Activate template",
      save: "Save changes",
      delete: "Delete template",
      activeBadge: "Active",
      noSelection: "Pick a template to display its code and preview",
    },
    alerts: {
      saved: "Template saved successfully.",
      activated: "Template activated for the selected channel.",
      deleted: "Template deleted.",
    },
    templateEditor: {
      templateNotFound: "Template not found",
      backToTemplates: "Back to templates",
      requiredVariables: "Required variables",
      required: "required",
      fromLabel: "From",
      recipientLabel: "To",
      subjectLabel: "Subject",
      recipientPlaceholder: "user@email.com",
      deleteProgress: "Deleting...",
      activateProgress: "Activating...",
      saveProgress: "Saving...",
      remoteTemplateFetchError: "Could not fetch remote template.",
      remoteTemplateNotFound: "No remote template exists with this name.",
      saveError: "Could not save template.",
      activateError: "Could not activate template.",
      deleteError: "Could not delete template.",
      remoteIdMissing: "Could not get remote template id.",
    },
    domains: {
      pageTitle: "Sending domain & email",
      pageSubtitle:
        "One domain per organization. Publish the DNS records shown here and run a public DNS check when you need confirmation.",
      domainsLabel: "Domains",
      addDomainButton: "Set up domain",
      domainSubdomainLabel: "Domain or subdomain",
      domainSubdomainPlaceholder: "mail.company.com",
      domainLabel: "Configured domain",
      dnsTitle: "Expected DNS records",
      verifyDnsButton: "Verify public DNS",
      verifyDnsLoading: "Resolving DNS…",
      loadingSettings: "Loading settings…",
      refreshFromServer: "Refresh data",
      createdLabel: "Created",
      updatedLabel: "Updated",
      emptyTitle: "No sending domain yet",
      emptyDescription:
        "Create a setting with the domain or subdomain you send from (e.g. mail.yourcompany.com). Only one configuration is allowed per organization.",
      modalTitle: "New sending domain",
      modalHint: "Use the host you will publish in DNS (FQDN like name.domain).",
      modalCancel: "Cancel",
      modalCreate: "Create configuration",
      modalCreating: "Creating…",
      orgMissing: "No organization in session; cannot load settings.",
      loadError: "Could not load domain settings.",
      create409: "This organization already has a domain configured. Only one is allowed.",
      create404: "Organization not found or you do not have access.",
      createError: "Could not create the configuration.",
      dnsRecordsTableTitle: "Records to publish",
      dnsPublicTableTitle: "Public DNS verification",
      tableCategory: "Category",
      tableType: "Type",
      tableName: "Name",
      tableValue: "Value",
      tableTtl: "TTL",
      tablePriority: "Priority",
      tableStatus: "Status",
      publicLookupFqdn: "Lookup FQDN",
      publicMatch: "Matches",
      publicExpected: "Expected value",
      publicObserved: "Observed",
      publicError: "Lookup error",
      allRecordsMatch: "All records match the expected configuration.",
      partialRecordsMatch: "At least one record does not match or could not be resolved.",
      checkedAt: "Checked at",
      copyValue: "Copy",
      copied: "Copied",
      status: {
        verified: "Verified",
        pending: "Pending",
        failed: "Error",
        dnsWarning: "Review",
        yes: "Yes",
        no: "No",
      },
    },
    groups: {
      "otp-flows": {
        name: "OTP",
        description: "Verification notifications and one-time codes.",
      },
      "security-alerts": {
        name: "Security alerts",
        description: "Critical emails for suspicious access or blocks.",
      },
      "monthly-reports": {
        name: "Monthly reports",
        description: "Recurring summaries and reports for your users.",
      },
      "login-alerts": {
        name: "Login alerts",
        description: "Notify successful logins and authentication updates.",
      },
      "account-statements": {
        name: "Statements",
        description: "Automated reports with movements and balances.",
      },
      transactions: {
        name: "Transactions",
        description: "Updates about transfers and cash-ins.",
      },
      payments: {
        name: "Payments",
        description: "Confirmations and scheduled payment reminders.",
      },
      "push-transfers": {
        name: "Push cash-outs",
        description: "Transactional push notifications.",
      },
      "push-alerts": {
        name: "Push alerts",
        description: "In-app and push alerts for unusual cash-outs.",
      },
    },
    templates: {
      otpCode: {
        name: "OTP delivery",
        subject: "Your verification code",
        description: "Send secure verification codes via email.",
      },
      otpReminder: {
        name: "OTP reminder",
        subject: "Your code is still valid",
        description: "Remind users to finish verification before the code expires.",
      },
      securityAlert: {
        name: "Security alert",
        subject: "New login detected",
        description: "Warns users when unusual access attempts appear.",
      },
      monthlySummary: {
        name: "Monthly summary",
        subject: "Activity recap",
        description: "Shares account metrics and next scheduled payment.",
      },
      transferPush: {
        name: "Transfer push",
        subject: "Cash-out confirmed",
        description: "Short push to confirm outgoing transfers.",
      },
      cashOutAlert: {
        name: "Cash-out alert",
        subject: "Review this movement",
        description: "Requests confirmation for risky withdrawals.",
      },
    },
  },
};

export function useNotificationsTranslations() {
  return useLanguageTranslations(NOTIFICATIONS_TRANSLATIONS);
}
