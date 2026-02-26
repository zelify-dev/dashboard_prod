"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type FinancialEducationTranslations = {
  breadcrumb: string;
  configPanel: {
    academyVideos: {
      title: string;
      description: string;
      addButton: string;
      fields: {
        title: string;
        videoUrl: string;
        thumbnailUrl: string;
      };
      delete: string;
      empty: string;
      newTitle: string;
    };
    blogs: {
      title: string;
      description: string;
      addButton: string;
      fields: {
        title: string;
        blogUrl: string;
        excerpt: string;
      };
      delete: string;
      empty: string;
      newTitle: string;
    };
  };
};

const FINANCIAL_EDUCATION_TRANSLATIONS: Record<Language, FinancialEducationTranslations> = {
  en: {
    breadcrumb: "Financial Education",
    configPanel: {
      academyVideos: {
        title: "Academy Videos",
        description: "Manage the educational videos shown in the Learn section",
        addButton: "Add Video",
        fields: {
          title: "Title",
          videoUrl: "Video URL",
          thumbnailUrl: "Thumbnail URL",
        },
        delete: "Delete",
        empty: "No videos configured. Add one to get started.",
        newTitle: "New Video",
      },
      blogs: {
        title: "Financial Tips Blogs",
        description: "Manage the articles and financial tips shown in the Learn section",
        addButton: "Add Blog",
        fields: {
          title: "Title",
          blogUrl: "Blog URL",
          excerpt: "Excerpt",
        },
        delete: "Delete",
        empty: "No blogs configured. Add one to get started.",
        newTitle: "New Blog",
      },
    },
  },
  es: {
    breadcrumb: "Educación Financiera",
    configPanel: {
      academyVideos: {
        title: "Videos de Academy",
        description: "Gestiona los videos educativos que se mostrarán en la sección Learn",
        addButton: "Agregar Video",
        fields: {
          title: "Título",
          videoUrl: "URL del Video",
          thumbnailUrl: "URL de Thumbnail",
        },
        delete: "Eliminar",
        empty: "No hay videos configurados. Agrega uno para comenzar.",
        newTitle: "Nuevo Video",
      },
      blogs: {
        title: "Blogs de Consejos Financieros",
        description: "Gestiona los artículos y consejos financieros que se mostrarán en la sección Learn",
        addButton: "Agregar Blog",
        fields: {
          title: "Título",
          blogUrl: "URL del Blog",
          excerpt: "Extracto",
        },
        delete: "Eliminar",
        empty: "No hay blogs configurados. Agrega uno para comenzar.",
        newTitle: "Nuevo Blog",
      },
    },
  },
};

export function useFinancialEducationTranslations() {
  return useLanguageTranslations(FINANCIAL_EDUCATION_TRANSLATIONS);
}

