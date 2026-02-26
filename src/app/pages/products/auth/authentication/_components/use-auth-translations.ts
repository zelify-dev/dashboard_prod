"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import type { RegistrationFieldId } from "./authentication-config";

type AuthTranslations = {
  breadcrumb: string;
  preview: {
    backButton: string;
    loginTitle: string;
    providerAction: string;
    or: string;
    phoneLabel: string;
    phonePlaceholder: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    signInButton: string;
    registerTitle: string;
    registerButton: string;
    enterPrefix: string;
    mobilePreviewTitle: string;
    webPreviewTitle: string;
    mobileLabel: string;
    webLabel: string;
    switchToMobileView: string;
    switchToWebView: string;
    // Registration flow
    step1Title: string;
    step1Subtitle: string;
    step2Title: string;
    step2Subtitle: string;
    step3Title: string;
    step3Subtitle: string;
    step4Title: string;
    step4Subtitle: string;
    step5Title: string;
    step5Subtitle: string;
    continueButton: string;
    verifyButton: string;
    resendCode: string;
    didntReceiveCode: string;
    alreadyHaveAccount: string;
    signInLink: string;
    createAccountButton: string;
    termsAndPrivacy: string;
    progressStep: string;
    otpPlaceholder: string;
    selectCountry: string;
    phoneNumberPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    successAnimation: string;
    welcomeBack: string;
    orCreateAccount: string;
    orContinueWith: string;
  };
  config: {
    serviceTypeTitle: string;
    switchToLogin: string;
    switchToRegister: string;
    login: string;
    register: string;
    loginMethodTitle: string;
    registrationFieldsTitle: string;
    loginMethods: {
      phone: string;
      username: string;
      email: string;
      oauth: string;
    };
    oauthProvidersTitle: string;
    registerFieldsDescription: string;
    required: string;
    customBrandingTitle: string;
    themeLabel: string;
    lightMode: string;
    darkMode: string;
    modeName: {
      light: string;
      dark: string;
    };
    logoLabel: string;
    changeLogo: string;
    uploadLogo: string;
    logoHint: string;
    colorPalette: string;
    customColorTheme: string;
    saveButton: string;
    saving: string;
    customFieldsTitle: string;
    customFieldsDescription: string;
    addCustomField: string;
    maxCustomFields: string;
    fieldLabel: string;
    fieldType: string;
    fieldPlaceholder: string;
    fieldOptions: string;
    addOption: string;
    removeField: string;
    fieldTypes: {
      text: string;
      email: string;
      number: string;
      tel: string;
      date: string;
      textarea: string;
      select: string;
    };
  };
  registrationFields: Record<RegistrationFieldId, string>;
};

const AUTH_TRANSLATIONS: Record<Language, AuthTranslations> = {
  en: {
    breadcrumb: "Authentication",
    preview: {
      backButton: "Back",
      loginTitle: "Sign In",
      providerAction: "Continue with",
      or: "or",
      phoneLabel: "Phone Number",
      phonePlaceholder: "+1 234 567 8900",
      usernameLabel: "Username",
      usernamePlaceholder: "username",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      signInButton: "Sign In",
      registerTitle: "Create Account",
      registerButton: "Create Account",
      enterPrefix: "Enter",
      mobilePreviewTitle: "Mobile Preview",
      webPreviewTitle: "Web Preview",
      mobileLabel: "Mobile",
      webLabel: "Web",
      switchToMobileView: "Switch to mobile view",
      switchToWebView: "Switch to web view",
      // Registration flow
      step1Title: "Create Account",
      step1Subtitle: "Enter your name and email address to get started. We'll send you a verification code.",
      step2Title: "Verify Your Email",
      step2Subtitle: "We've sent a 6-digit code to",
      step3Title: "Add Your Phone Number",
      step3Subtitle: "We'll send you a verification code via SMS to confirm your phone number.",
      step4Title: "Verify Your Phone",
      step4Subtitle: "We've sent a 6-digit code to",
      step5Title: "Complete Your Profile",
      step5Subtitle: "Complete the remaining information to finish setting up your account.",
      continueButton: "Continue",
      verifyButton: "Verify",
      resendCode: "Resend Code",
      didntReceiveCode: "Didn't receive the code?",
      alreadyHaveAccount: "Already have an account?",
      signInLink: "Sign In",
      createAccountButton: "Create Account",
      termsAndPrivacy: "By creating an account, you agree to our Terms of Service and Privacy Policy",
      progressStep: "Step {current} of {total}",
      otpPlaceholder: "202601",
      selectCountry: "Select Country",
      phoneNumberPlaceholder: "Phone number",
      showPassword: "Show",
      hidePassword: "Hide",
      successAnimation: "Verified successfully!",
      welcomeBack: "Welcome back",
      orCreateAccount: "Or create a new account",
      orContinueWith: "Or continue with",
    },
    config: {
      serviceTypeTitle: "Service Type",
      switchToLogin: "Switch to login service",
      switchToRegister: "Switch to register service",
      login: "Login",
      register: "Register",
      loginMethodTitle: "Login Method",
      registrationFieldsTitle: "Registration Fields",
      loginMethods: {
        phone: "Phone Number",
        username: "Username",
        email: "Email & Password",
        oauth: "OAuth (Social Login)",
      },
      oauthProvidersTitle: "OAuth Providers",
      registerFieldsDescription: "Customize the fields that appear in the registration form",
      required: "Required",
      customBrandingTitle: "Custom Branding",
      themeLabel: "Theme",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      modeName: {
        light: "Light",
        dark: "Dark",
      },
      logoLabel: "Logo",
      changeLogo: "Change Logo",
      uploadLogo: "Upload Logo",
      logoHint: "Drag and drop an image (PNG, JPG, SVG, GIF, WEBP) here, or paste from the clipboard. Max size: 5MB",
      colorPalette: "Color Palette",
      customColorTheme: "Custom Color Theme",
      saveButton: "Save Changes",
      saving: "Saving...",
      customFieldsTitle: "Custom Registration Fields",
      customFieldsDescription: "Add up to 3 additional custom fields to the registration form",
      addCustomField: "Add Custom Field",
      maxCustomFields: "Maximum 3 custom fields allowed",
      fieldLabel: "Field Label",
      fieldType: "Field Type",
      fieldPlaceholder: "Placeholder",
      fieldOptions: "Options (for select type)",
      addOption: "Add Option",
      removeField: "Remove Field",
      fieldTypes: {
        text: "Text",
        email: "Email",
        number: "Number",
        tel: "Phone",
        date: "Date",
        textarea: "Textarea",
        select: "Select",
      },
    },
    registrationFields: {
      username: "Username",
      fullName: "Full Name",
      phone: "Mobile Phone",
      address: "Address",
      email: "Email",
      idNumber: "ID Number",
      birthDate: "Date of Birth",
    },
  },
  es: {
    breadcrumb: "Autenticación",
    preview: {
      backButton: "Atrás",
      loginTitle: "Iniciar sesión",
      providerAction: "Continuar con",
      or: "o",
      phoneLabel: "Número de teléfono",
      phonePlaceholder: "+1 234 567 8900",
      usernameLabel: "Nombre de usuario",
      usernamePlaceholder: "usuario",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "correo@ejemplo.com",
      passwordLabel: "Contraseña",
      signInButton: "Iniciar sesión",
      registerTitle: "Crear cuenta",
      registerButton: "Crear cuenta",
      enterPrefix: "Ingresa",
      mobilePreviewTitle: "Vista previa móvil",
      webPreviewTitle: "Vista previa web",
      mobileLabel: "Móvil",
      webLabel: "Web",
      switchToMobileView: "Cambiar a la vista móvil",
      switchToWebView: "Cambiar a la vista web",
      // Registration flow
      step1Title: "Crear Cuenta",
      step1Subtitle: "Ingresa tu nombre y correo electrónico para comenzar. Te enviaremos un código de verificación.",
      step2Title: "Verifica Tu Correo",
      step2Subtitle: "Hemos enviado un código de 6 dígitos a",
      step3Title: "Agrega Tu Número de Teléfono",
      step3Subtitle: "Te enviaremos un código de verificación por SMS para confirmar tu número de teléfono.",
      step4Title: "Verifica Tu Teléfono",
      step4Subtitle: "Hemos enviado un código de 6 dígitos a",
      step5Title: "Completa Tu Perfil",
      step5Subtitle: "Completa la información restante para finalizar la configuración de tu cuenta.",
      continueButton: "Continuar",
      verifyButton: "Verificar",
      resendCode: "Reenviar Código",
      didntReceiveCode: "¿No recibiste el código?",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      signInLink: "Iniciar Sesión",
      createAccountButton: "Crear Cuenta",
      termsAndPrivacy: "Al crear una cuenta, aceptas nuestros Términos de Servicio y Política de Privacidad",
      progressStep: "Paso {current} de {total}",
      otpPlaceholder: "202601",
      selectCountry: "Seleccionar País",
      phoneNumberPlaceholder: "Número de teléfono",
      showPassword: "Mostrar",
      hidePassword: "Ocultar",
      successAnimation: "¡Verificado exitosamente!",
      welcomeBack: "Bienvenido de nuevo",
      orCreateAccount: "O crea una cuenta nueva",
      orContinueWith: "O continúa con",
    },
    config: {
      serviceTypeTitle: "Tipo de servicio",
      switchToLogin: "Cambiar al servicio de ingreso",
      switchToRegister: "Cambiar al servicio de registro",
      login: "Ingreso",
      register: "Registro",
      loginMethodTitle: "Método de ingreso",
      registrationFieldsTitle: "Campos de registro",
      loginMethods: {
        phone: "Número de teléfono",
        username: "Nombre de usuario",
        email: "Correo y contraseña",
        oauth: "OAuth (Inicio de sesión social)",
      },
      oauthProvidersTitle: "Proveedores OAuth",
      registerFieldsDescription: "Personaliza los campos que aparecen en el formulario de registro",
      required: "Obligatorio",
      customBrandingTitle: "Personalización de marca",
      themeLabel: "Tema",
      lightMode: "Modo claro",
      darkMode: "Modo oscuro",
      modeName: {
        light: "claro",
        dark: "oscuro",
      },
      logoLabel: "Logo",
      changeLogo: "Cambiar logo",
      uploadLogo: "Subir logo",
      logoHint: "Arrastra y suelta una imagen (PNG, JPG, SVG, GIF, WEBP) aquí, o pega desde el portapapeles. Tamaño máximo: 5MB",
      colorPalette: "Paleta de colores)",
      customColorTheme: "Tema de Color Personalizado",
      saveButton: "Guardar Cambios",
      saving: "Guardando...",
      customFieldsTitle: "Campos de Registro Personalizados",
      customFieldsDescription: "Agrega hasta 3 campos adicionales personalizados al formulario de registro",
      addCustomField: "Agregar Campo Personalizado",
      maxCustomFields: "Máximo 3 campos personalizados permitidos",
      fieldLabel: "Etiqueta del Campo",
      fieldType: "Tipo de Campo",
      fieldPlaceholder: "Placeholder",
      fieldOptions: "Opciones (para tipo select)",
      addOption: "Agregar Opción",
      removeField: "Eliminar Campo",
      fieldTypes: {
        text: "Texto",
        email: "Correo",
        number: "Número",
        tel: "Teléfono",
        date: "Fecha",
        textarea: "Área de texto",
        select: "Selección",
      },
    },
    registrationFields: {
      username: "Nombre de usuario",
      fullName: "Nombre completo",
      phone: "Teléfono móvil",
      address: "Dirección",
      email: "Correo electrónico",
      idNumber: "Cédula de ciudadanía",
      birthDate: "Fecha de nacimiento",
    },
  },
};

export function useAuthTranslations() {
  return useLanguageTranslations(AUTH_TRANSLATIONS);
}
