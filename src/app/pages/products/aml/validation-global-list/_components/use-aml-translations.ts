"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type AMLTranslations = {
  config: {
    title: string;
    description: string;
    newGroup: string;
    selectGroup: string;
    default: string;
    allLists: string;
    listScreening: string;
    listNotScreening: string;
    notInGroup: string;
    createGroup: string;
    groupName: string;
    groupNamePlaceholder: string;
    groupDescription: string;
    groupDescriptionPlaceholder: string;
    selectLists: string;
    create: string;
    cancel: string;
  };
  pageTitle: string;
  backToValidations: string;
  newValidation: string;
  newValidationDesc: string;
  country: string;
  selectCountry: string;
  documentNumber: string;
  documentNumberPlaceholder: string;
  verify: string;
  cancel: string;
  progressSteps: string[];
  validationsTitle: string;
  validationsDesc: string;
  validationsTable: {
    name: string;
    verification: string;
    created: string;
    actions: string;
    view: string;
    noValidations: string;
  };
  status: {
    approved: string;
    pending: string;
  };
  faceScan: {
    scanning: string;
    yourFace: string;
    completingVerification: string;
    validatingBlacklists: string;
    back: string;
    startingCamera: string;
    validatingInternalLists: string;
    validatingInternalList: string;
    validatingGlobalLists: string;
    verificationComplete: string;
  };
  personalization: {
    title: string;
    lightMode: string;
    darkMode: string;
    logo: string;
    logoLightMode: string;
    logoDarkMode: string;
    dragLogoHere: string;
    selectFile: string;
    fileFormats: string;
    themeColor: string;
    saveChanges: string;
    invalidFileType: string;
    fileTooLarge: string;
    errorProcessingImage: string;
  };
  detailTitle: string;
  detail: {
    name: string;
    country: string;
    documentNumber: string;
    createdAt: string;
    status: string;
  };
  listsTitle: string;
  matchFound: string;
  matchInfoTitle: string;
  matchList: string;
  matchScore: string;
  matchSource: string;
  matchDate: string;
  successTitle: string;
  successDesc: string;
  selectGroupForValidation: string;
  defaultGroup: string;
  allListsOption: string;
  form: {
    pepToggleTitle: string;
    pepToggleDescription: string;
    searchingPepStep: string;
    checkingListStep: string;
    finishingVerificationFallback: string;
    countryRequired: string;
    documentNumberRequired: string;
    documentNumberMinLength: string;
    listSingular: string;
    listPlural: string;
    scopeInThisGroup: string;
    scopeActive: string;
    listsSummary: string;
    verifyingInLists: string;
  };
  lists: {
    [key: string]: {
      title: string;
      category: string;
      description: string;
      country: string;
    };
  };
};

const AML_TRANSLATIONS: Record<Language, AMLTranslations> = {
  es: {
    config: {
      title: "Configuración de Listas AML",
      description: "Gestiona las listas de verificación AML y crea grupos personalizados para tus búsquedas",
      newGroup: "Nuevo grupo de listas AML",
      selectGroup: "Seleccionar grupo de listas",
      default: "Por defecto",
      allLists: "Todas las listas",
      listScreening: "Esta lista está siendo verificada",
      listNotScreening: "Esta lista no está siendo verificada",
      notInGroup: "No está en este grupo",
      createGroup: "Crear nuevo grupo de listas",
      groupName: "Nombre del grupo",
      groupNamePlaceholder: "Ej: Listas críticas, Verificación básica, etc.",
      groupDescription: "Descripción (opcional)",
      groupDescriptionPlaceholder: "Describe el propósito de este grupo...",
      selectLists: "Seleccionar listas para este grupo",
      create: "Crear",
      cancel: "Cancelar",
    },
    pageTitle: "Validación de listas globales",
    backToValidations: "Volver a validaciones",
    newValidation: "Nueva validación AML",
    newValidationDesc: "Ingrese el número de documento de identificación para realizar la búsqueda",
    country: "País",
    selectCountry: "Seleccione un país",
    documentNumber: "Número de documento de identificación",
    documentNumberPlaceholder: "Ingrese el número de documento",
    verify: "Verificar",
    cancel: "Cancelar",
    progressSteps: [
      "Buscando en lista PEP...",
      "Verificando lista OFAC...",
      "Consultando Sanctions List...",
      "Revisando Watchlist...",
      "Analizando Adverse Media...",
      "Verificando bases de datos globales...",
      "Finalizando verificación...",
    ],
    validationsTitle: "Validaciones AML",
    validationsDesc: "Administra tus validaciones AML",
    validationsTable: {
      name: "Nombre",
      verification: "Verificación",
      created: "Fecha",
      actions: "Acciones",
      view: "Ver",
      noValidations: "No se encontraron validaciones. Crea tu primera validación AML para comenzar.",
    },
    status: {
      approved: "Aprobado",
      pending: "Pendiente",
    },
    faceScan: {
      scanning: "Escaneando",
      yourFace: "tu rostro",
      completingVerification: "Completando verificación",
      validatingBlacklists: "Validando listas negras...",
      back: "Atrás",
      startingCamera: "Iniciando cámara...",
      validatingInternalLists: "Validando en listas internas...",
      validatingInternalList: "Validando en lista interna...",
      validatingGlobalLists: "Validando en listas globales...",
      verificationComplete: "Verificación exitosa",
    },
    personalization: {
      title: "Personalización",
      lightMode: "Modo Claro",
      darkMode: "Modo Oscuro",
      logo: "Logo",
      logoLightMode: "(Modo Claro)",
      logoDarkMode: "(Modo Oscuro)",
      dragLogoHere: "Arrastra tu logo aquí o",
      selectFile: "selecciona un archivo",
      fileFormats: "PNG, JPG, SVG (Max. 5MB)",
      themeColor: "Color del Tema",
      saveChanges: "Guardar Cambios",
      invalidFileType: "Tipo de archivo inválido. Por favor usa PNG, JPG, WEBP o SVG.",
      fileTooLarge: "Archivo muy grande. Máximo 5MB.",
      errorProcessingImage: "Error al procesar la imagen",
    },
    detailTitle: "Detalle de Validación AML",
    detail: {
      name: "Nombre",
      country: "País",
      documentNumber: "Número de Documento",
      createdAt: "Fecha de Creación",
      status: "Estado",
    },
    listsTitle: "Listas AML Verificadas",
    matchFound: "Coincidencia encontrada",
    matchInfoTitle: "Información de la coincidencia en lista AML",
    matchList: "Lista AML",
    matchScore: "Puntaje de coincidencia",
    matchSource: "Fuente",
    matchDate: "Fecha de encuentro",
    successTitle: "Validación exitosa",
    successDesc: "No se encontraron coincidencias en ninguna lista AML. El documento está limpio.",
    selectGroupForValidation: "Grupo de listas para verificación",
    defaultGroup: "Grupo por defecto",
    allListsOption: "Todas las listas activas",
    form: {
      pepToggleTitle: "Validar la lista PEPs de {{country}}",
      pepToggleDescription: "Incluir la verificación de Personas Expuestas Políticamente (PEPs) de {{country}}",
      searchingPepStep: "Buscando en lista PEPs de {{country}}...",
      checkingListStep: "Verificando {{title}} - {{category}}...",
      finishingVerificationFallback: "Finalizando verificación...",
      countryRequired: "Seleccione un país",
      documentNumberRequired: "Ingrese el número de documento",
      documentNumberMinLength: "El número de documento debe tener al menos 5 caracteres",
      listSingular: "lista",
      listPlural: "listas",
      scopeInThisGroup: "en este grupo",
      scopeActive: "activas",
      listsSummary: "{{count}} {{listLabel}} {{scope}} serán verificadas",
      verifyingInLists: "Verificando en {{count}} {{listLabel}}...",
    },
    lists: {
      "ofac-sdn": {
        title: "US Treasury - OFAC",
        category: "Nacionales Especialmente Designados",
        description: "Incluye Nacionales Especialmente Designados (SDN) y Personas Bloqueadas; individuos y empresas que actúan en nombre de países objetivo y/o terroristas y traficantes de narcóticos, con quienes las personas estadounidenses tienen prohibido tratar.",
        country: "Estados Unidos",
      },
      "ofac-fse": {
        title: "US Treasury - OFAC",
        category: "Evasores de Sanciones Extranjeros",
        description: "Incluye personas extranjeras que han facilitado transacciones engañosas para o en nombre de personas sujetas a sanciones estadounidenses, o en violación de sanciones estadounidenses sobre Siria o Irán según la Orden Ejecutiva 13608.",
        country: "Estados Unidos",
      },
      "ofac-plc": {
        title: "US Treasury - OFAC",
        category: "Consejo Legislativo Palestino",
        description: "Incluye miembros del Consejo Legislativo Palestino (PLC) elegidos en la lista de cualquier Organización Terrorista Extranjera, siempre que no estén nombrados en la lista de Nacionales Especialmente Designados de OFAC.",
        country: "Estados Unidos",
      },
      "ofac-ssi": {
        title: "US Treasury - OFAC",
        category: "Identificaciones de Sanciones Sectoriales",
        description: "Incluye personas que operan en sectores de la economía rusa identificados por el Secretario del Tesoro, relacionados con acciones en Crimea y Ucrania, con quienes las personas estadounidenses tienen prohibido tratar.",
        country: "Estados Unidos",
      },
      "ofac-nsdn": {
        title: "US Treasury - OFAC",
        category: "Sanciones No-SDN Basadas en Menú",
        description: "Incluye personas sujetas a ciertas sanciones que son menos que sanciones de bloqueo completo, enumeradas registro por registro.",
        country: "Estados Unidos",
      },
      "fbi-wanted": {
        title: "US Department of Justice",
        category: "Lista de Buscados del FBI",
        description: "Incluye individuos buscados por el FBI por una variedad de delitos violentos y no violentos, sospechosos de terrorismo, y personas secuestradas y desaparecidas.",
        country: "Estados Unidos",
      },
      "eu-consolidated": {
        title: "Servicio Europeo de Acción Exterior",
        category: "Lista Consolidada de Sanciones",
        description: "Incluye grupos y entidades sujetas a sanciones financieras relacionadas con la Política Común de Seguridad y Asuntos Exteriores de la UE, necesarias para prevenir conflictos o responder a crisis emergentes o actuales.",
        country: "Unión Europea",
      },
      "uk-consolidated": {
        title: "UK Her Majesty's Treasury",
        category: "Lista Consolidada de Sanciones",
        description: "Incluye grupos y entidades sujetas a sanciones designadas bajo regulaciones hechas bajo la Ley de Sanciones y Prevención del Lavado de Dinero de 2018.",
        country: "Reino Unido",
      },
      "cia-chiefs": {
        title: "Internacional",
        category: "Lista de Jefes de Estado y Miembros del Gabinete de la CIA",
        description: "Incluye jefes de estado y miembros del gabinete de gobiernos extranjeros alrededor del mundo.",
        country: "Global",
      },
      "interpol-red": {
        title: "Internacional",
        category: "Avisos Rojos de Interpol para Personas Buscadas",
        description: "Incluye fugitivos buscados ya sea para enjuiciamiento o para cumplir una sentencia. Un Aviso Rojo es una solicitud a las fuerzas del orden en todo el mundo para localizar y arrestar provisionalmente a una persona pendiente de extradición, entrega o acción legal similar.",
        country: "Global",
      },
      "un-consolidated": {
        title: "Internacional",
        category: "Sanciones Consolidadas de las Naciones Unidas",
        description: "Incluye todos los individuos y entidades sujetas a medidas impuestas por el Consejo de Seguridad de la ONU para mantener o restaurar la paz y seguridad internacional.",
        country: "Global",
      },
      "world-bank": {
        title: "Internacional",
        category: "Lista del Banco Mundial de Firmas e Individuos Inelegibles",
        description: "Incluye individuos y empresas que el Banco Mundial ha sancionado debido a fraude y corrupción.",
        country: "Global",
      },
      "state-nonproliferation": {
        title: "US Department of State",
        category: "Sanciones de No Proliferación",
        description: "Incluye individuos extranjeros, entidades privadas y gobiernos que han sido designados bajo varias autoridades legales por participar en actividades de proliferación.",
        country: "Estados Unidos",
      },
      "state-aeca": {
        title: "US Department of State",
        category: "AECA Descalificados",
        description: "Incluye personas estatutariamente descalificadas bajo las Regulaciones de Tráfico Internacional de Armas (ITAR) o que han violado o conspirado para violar la Ley de Control de Exportación de Armas (AECA).",
        country: "Estados Unidos",
      },
      "gsa-epls": {
        title: "US General Services Administration",
        category: "Sistema de Lista de Partes Excluidas",
        description: "Registros de exclusión activos ingresados por el gobierno federal de EE.UU. identificando aquellas partes excluidas de recibir contratos federales, ciertos subcontratos y cierta asistencia financiera y no financiera federal y beneficios.",
        country: "Estados Unidos",
      },
      "bis-denied": {
        title: "Bureau of Industry and Security",
        category: "Lista de Personas Denegadas",
        description: "Incluye individuos que han tenido privilegios de exportación denegados por orden escrita del Departamento de Comercio.",
        country: "Estados Unidos",
      },
      "australia-dfat": {
        title: "Australia DFAT",
        category: "Lista Consolidada de Sanciones",
        description: "Incluye todas las personas y entidades que están sujetas a sanciones financieras específicas bajo la ley de sanciones australiana. Los listados pueden ser ciudadanos australianos, nacionales extranjeros o residentes en Australia o en el extranjero.",
        country: "Australia",
      },
      "canada-consolidated": {
        title: "Gobierno de Canadá",
        category: "Lista Consolidada de Sanciones",
        description: "Incluye individuos y entidades sujetas a regulaciones de sanciones específicas hechas bajo la Ley de Medidas Económicas Especiales (SEMA) y la Ley de Justicia para Víctimas de Funcionarios Extranjeros Corruptos (JVCFOA).",
        country: "Canadá",
      },
      "ecuador-uafe": {
        title: "UAFE - Unidad de Análisis Financiero y Económico",
        category: "Lista de Personas y Entidades Sancionadas",
        description: "Incluye personas y entidades sancionadas por la Unidad de Análisis Financiero y Económico (UAFE) de Ecuador por actividades relacionadas con lavado de activos, financiamiento del terrorismo y otros delitos financieros.",
        country: "Ecuador",
      },
    },
  },
  en: {
    config: {
      title: "AML Lists Configuration",
      description: "Manage AML verification lists and create custom groups for your searches",
      newGroup: "New AML list group",
      selectGroup: "Select list group",
      default: "Default",
      allLists: "All lists",
      listScreening: "This list is being screened",
      listNotScreening: "This list is not being screened",
      notInGroup: "Not in this group",
      createGroup: "Create new list group",
      groupName: "Group name",
      groupNamePlaceholder: "E.g: Critical lists, Basic verification, etc.",
      groupDescription: "Description (optional)",
      groupDescriptionPlaceholder: "Describe the purpose of this group...",
      selectLists: "Select lists for this group",
      create: "Create",
      cancel: "Cancel",
    },
    pageTitle: "Global List Validation",
    backToValidations: "Back to Validations",
    newValidation: "New AML Validation",
    newValidationDesc: "Enter the identification document number to perform the search",
    country: "Country",
    selectCountry: "Select a country",
    documentNumber: "Identification Document Number",
    documentNumberPlaceholder: "Enter document number",
    verify: "Verify",
    cancel: "Cancel",
    progressSteps: [
      "Searching in PEP list...",
      "Checking OFAC list...",
      "Consulting Sanctions List...",
      "Reviewing Watchlist...",
      "Analyzing Adverse Media...",
      "Checking global databases...",
      "Finishing verification...",
    ],
    validationsTitle: "AML Validations",
    validationsDesc: "Manage your AML validation checks",
    validationsTable: {
      name: "Name",
      verification: "Verification",
      created: "Created",
      actions: "Actions",
      view: "View",
      noValidations: "No validations found. Create your first AML validation to get started.",
    },
    status: {
      approved: "Approved",
      pending: "Pending",
    },
    faceScan: {
      scanning: "Scanning",
      yourFace: "your face",
      completingVerification: "Completing verification",
      validatingBlacklists: "Validating blacklists...",
      back: "Back",
      startingCamera: "Starting camera...",
      validatingInternalLists: "Validating internal lists...",
      validatingInternalList: "Validating internal list...",
      validatingGlobalLists: "Validating global lists...",
      verificationComplete: "Verification complete",
    },
    personalization: {
      title: "Personalization",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      logo: "Logo",
      logoLightMode: "(Light Mode)",
      logoDarkMode: "(Dark Mode)",
      dragLogoHere: "Drag your logo here or",
      selectFile: "select a file",
      fileFormats: "PNG, JPG, SVG (Max. 5MB)",
      themeColor: "Theme Color",
      saveChanges: "Save Changes",
      invalidFileType: "Invalid file type. Please use PNG, JPG, WEBP or SVG.",
      fileTooLarge: "File too large. Max 5MB.",
      errorProcessingImage: "Error processing image",
    },
    detailTitle: "AML Validation Detail",
    detail: {
      name: "Name",
      country: "Country",
      documentNumber: "Document Number",
      createdAt: "Created At",
      status: "Status",
    },
    listsTitle: "Verified AML Lists",
    matchFound: "Match Found",
    matchInfoTitle: "Match Information in AML List",
    matchList: "AML List",
    matchScore: "Match Score",
    matchSource: "Source",
    matchDate: "Match Date",
    successTitle: "Successful Validation",
    successDesc: "No matches found in any AML list. The document is clean.",
    selectGroupForValidation: "List group for verification",
    defaultGroup: "Default group",
    allListsOption: "All active lists",
    form: {
      pepToggleTitle: "Validate PEP list for {{country}}",
      pepToggleDescription: "Include Politically Exposed Persons (PEPs) verification for {{country}}",
      searchingPepStep: "Searching in PEP list for {{country}}...",
      checkingListStep: "Checking {{title}} - {{category}}...",
      finishingVerificationFallback: "Finishing verification...",
      countryRequired: "Select a country",
      documentNumberRequired: "Enter document number",
      documentNumberMinLength: "The document number must have at least 5 characters",
      listSingular: "list",
      listPlural: "lists",
      scopeInThisGroup: "in this group",
      scopeActive: "active",
      listsSummary: "{{count}} {{listLabel}} {{scope}} will be verified",
      verifyingInLists: "Verifying in {{count}} {{listLabel}}...",
    },
    lists: {
      "ofac-sdn": {
        title: "US Treasury - OFAC",
        category: "Specially Designated Nationals",
        description: "Includes Specially Designated Nationals (SDN) And Blocked Persons; individuals and companies acting on behalf of targeted countries and/or terrorists and narcotics traffickers, who U.S. persons are prohibited from dealing with.",
        country: "United States",
      },
      "ofac-fse": {
        title: "US Treasury - OFAC",
        category: "Foreign Sanctions Evaders",
        description: "Includes foreign persons who have facilitated deceptive transactions for or on behalf of persons subject to U.S. sanctions, or in violation of U.S. sanctions on Syria or Iran pursuant to Executive Order 13608.",
        country: "United States",
      },
      "ofac-plc": {
        title: "US Treasury - OFAC",
        category: "Palestinian Legislative Council",
        description: "Includes members of the Palestinian Legislative Council (PLC) elected on the slate of any Foreign Terrorist Organization, provided that they are not named on the OFAC Specially Designated Nationals list.",
        country: "United States",
      },
      "ofac-ssi": {
        title: "US Treasury - OFAC",
        category: "Sectoral Sanctions Identifications",
        description: "Includes persons operating in sectors of the Russian economy identified by the Secretary of the Treasury, relating to actions in Crimea and Ukraine, who U.S. persons are prohibited from dealing with.",
        country: "United States",
      },
      "ofac-nsdn": {
        title: "US Treasury - OFAC",
        category: "Non-SDN Menu-Based Sanctions",
        description: "Includes persons subject to certain sanctions that are less than full blocking sanctions, enumerated on a record-by-record basis.",
        country: "United States",
      },
      "fbi-wanted": {
        title: "US Department of Justice",
        category: "FBI Wanted List",
        description: "Includes individuals wanted by the FBI for a variety of violent and non-violent crimes, terrorism suspects, and kidnapped and missing persons.",
        country: "United States",
      },
      "eu-consolidated": {
        title: "European External Action Service",
        category: "Consolidated List of Sanctions",
        description: "Includes groups and entities subject to financial sanctions relating to the EU Common Foreign and Security Policy, necessary to prevent conflict or respond to emerging or current crises.",
        country: "European Union",
      },
      "uk-consolidated": {
        title: "UK Her Majesty's Treasury",
        category: "Consolidated List of Sanctions",
        description: "Includes groups and entities subject to sanctions designated under regulations made under the Sanctions and Anti-Money Laundering Act 2018.",
        country: "United Kingdom",
      },
      "cia-chiefs": {
        title: "International",
        category: "CIA List of Chiefs of State and Cabinet Members",
        description: "Includes chiefs of state and cabinet members of foreign governments around the world.",
        country: "Global",
      },
      "interpol-red": {
        title: "International",
        category: "Interpol Red Notices for Wanted Persons",
        description: "Includes fugitives wanted either for prosecution or to serve a sentence. A Red Notice is a request to law enforcement worldwide to locate and provisionally arrest a person pending extradition, surrender, or similar legal action.",
        country: "Global",
      },
      "un-consolidated": {
        title: "International",
        category: "United Nations Consolidated Sanctions",
        description: "Includes all individuals and entities subject to measures imposed by the UN Security Council to maintain or restore international peace and security.",
        country: "Global",
      },
      "world-bank": {
        title: "International",
        category: "World Bank Listing of Ineligible Firms and Individuals",
        description: "Includes individuals and businesses that the World Bank have sanctioned due to fraud and corruption.",
        country: "Global",
      },
      "state-nonproliferation": {
        title: "US Department of State",
        category: "Nonproliferation Sanctions",
        description: "Includes foreign individuals, private entities, and governments that have been designated under various legal authorities for engaging in proliferation activities.",
        country: "United States",
      },
      "state-aeca": {
        title: "US Department of State",
        category: "AECA Debarred",
        description: "Includes persons statutorily debarred under the International Traffic in Arms Regulations (ITAR) or who've violated or conspired to violate the Arms Export Control Act (AECA).",
        country: "United States",
      },
      "gsa-epls": {
        title: "US General Services Administration",
        category: "Excluded Party List System",
        description: "Active exclusion records entered by the U.S. Federal government identifying those parties excluded from receiving Federal contracts, certain subcontracts, and certain Federal financial and non-financial assistance and benefits.",
        country: "United States",
      },
      "bis-denied": {
        title: "Bureau of Industry and Security",
        category: "Denied Persons List",
        description: "Includes individuals who have had export privileges denied by written order of the Department of Commerce.",
        country: "United States",
      },
      "australia-dfat": {
        title: "Australia DFAT",
        category: "Consolidated List of Sanctions",
        description: "Includes all persons and entities who are subject to targeted financial sanctions under Australian sanctions law. Those listed may be Australian citizens, foreign nationals, or residents in Australia or overseas.",
        country: "Australia",
      },
      "canada-consolidated": {
        title: "Government of Canada",
        category: "Consolidated List of Sanctions",
        description: "Includes individuals and entities subject to specific sanctions regulations made under the Special Economic Measures Act (SEMA) and the Justice for Victims of Corrupt Foreign Officials Act (JVCFOA).",
        country: "Canada",
      },
      "ecuador-uafe": {
        title: "UAFE - Financial and Economic Analysis Unit",
        category: "List of Sanctioned Persons and Entities",
        description: "Includes persons and entities sanctioned by the Financial and Economic Analysis Unit (UAFE) of Ecuador for activities related to money laundering, terrorism financing, and other financial crimes.",
        country: "Ecuador",
      },
    },
  },
};

// Exportar para uso en otros archivos
export { AML_TRANSLATIONS };

export function useAMLTranslations() {
  return useLanguageTranslations(AML_TRANSLATIONS);
}
