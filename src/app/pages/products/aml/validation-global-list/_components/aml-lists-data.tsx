import React from "react";
import ReactCountryFlag from "react-country-flag";
import { AMLList, AMLListGroup } from "./aml-list-config";
import type { Language } from "@/contexts/language-context";
import { useAMLTranslations } from "./use-aml-translations";

// Mapeo de países/regiones a códigos ISO de países (soporta español e inglés)
const countryCodeMap: Record<string, string> = {
  // Inglés
  "United States": "US",
  "United Kingdom": "GB",
  "European Union": "", // La UE no tiene código ISO estándar, usaremos icono especial
  "Australia": "AU",
  "Canada": "CA",
  "Ecuador": "EC",
  "Global": "", // Para listas globales, usaremos un icono especial
  // Español
  "Estados Unidos": "US",
  "Reino Unido": "GB",
  "Unión Europea": "", // La UE no tiene código ISO estándar, usaremos icono especial
  "Canadá": "CA",
};

// Componente helper para renderizar banderas
export function FlagIcon({ country, className }: { country: string; className?: string }) {
  // Normalizar el nombre del país para buscar en el mapeo
  const normalizedCountry = country.trim();
  const countryCode = countryCodeMap[normalizedCountry];
  
  // Verificar si es Unión Europea (en español o inglés)
  const isEuropeanUnion = normalizedCountry === "European Union" || normalizedCountry === "Unión Europea";
  
  if (!countryCode) {
    // Icono especial para Unión Europea (bandera de la UE)
    if (isEuropeanUnion) {
      return (
        <svg className={className || "h-6 w-6"} viewBox="0 0 20 14" fill="none">
          <rect width="20" height="14" fill="#003399" />
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const centerX = 10 + 3.5 * Math.cos(angle);
            const centerY = 7 + 3.5 * Math.sin(angle);
            const radius = 0.5;
            const points = [];
            for (let j = 0; j < 10; j++) {
              const a = (j * 36 - 90) * (Math.PI / 180);
              const r = j % 2 === 0 ? radius : radius * 0.4;
              points.push(`${centerX + r * Math.cos(a)},${centerY + r * Math.sin(a)}`);
            }
            return (
              <polygon key={i} points={points.join(" ")} fill="#FFCC00" />
            );
          })}
        </svg>
      );
    }
    
    // Icono global para listas internacionales
    return (
      <svg className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  
  return (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: "1.5rem",
        height: "1.5rem",
      }}
      className={className}
    />
  );
}

// Función para obtener las listas AML con traducciones
export function getAMLists(language: Language = "es"): AMLList[] {
  // Importar traducciones dinámicamente
  const translations = require("./use-aml-translations").AML_TRANSLATIONS[language];
  
  const listIds = [
    "ofac-sdn", "ofac-fse", "ofac-plc", "ofac-ssi", "ofac-nsdn",
    "fbi-wanted", "eu-consolidated", "uk-consolidated", "cia-chiefs",
    "interpol-red", "un-consolidated", "world-bank", "state-nonproliferation",
    "state-aeca", "gsa-epls", "bis-denied", "australia-dfat", "canada-consolidated",
    "ecuador-uafe"
  ];

  // Función para obtener el icono de bandera basado en el país de la lista
  const getFlagIcon = (listId: string, country: string): React.ReactNode => {
    return <FlagIcon country={country} className="h-6 w-6" />;
  };

  const sourceMap: Record<string, string> = {
    "ofac-sdn": "US Treasury",
    "ofac-fse": "US Treasury",
    "ofac-plc": "US Treasury",
    "ofac-ssi": "US Treasury",
    "ofac-nsdn": "US Treasury",
    "fbi-wanted": "FBI",
    "eu-consolidated": "EEAS",
    "uk-consolidated": "UK Treasury",
    "cia-chiefs": "CIA",
    "interpol-red": "Interpol",
    "un-consolidated": "UN",
    "world-bank": "World Bank",
    "state-nonproliferation": "US State Department",
    "state-aeca": "US State Department",
    "gsa-epls": "GSA",
    "bis-denied": "BIS",
    "australia-dfat": "DFAT",
    "canada-consolidated": "Government of Canada",
    "ecuador-uafe": "UAFE",
  };

  const enabledMap: Record<string, boolean> = {
    "gsa-epls": false,
  };

  return listIds.map((id) => {
    const listData = translations.lists[id];
    return {
      id,
      title: listData.title,
      category: listData.category,
      description: listData.description,
      country: listData.country,
      icon: getFlagIcon(id, listData.country),
      enabled: enabledMap[id] !== undefined ? enabledMap[id] : true,
      source: sourceMap[id],
    };
  });
}

// Listas AML basadas en las capturas de Plaid (versión estática para compatibilidad)
export const defaultAMLists: AMLList[] = [
  // US Treasury - OFAC
  {
    id: "ofac-sdn",
    title: "US Treasury - OFAC",
    category: "Specially Designated Nationals",
    description: "Includes Specially Designated Nationals (SDN) And Blocked Persons; individuals and companies acting on behalf of targeted countries and/or terrorists and narcotics traffickers, who U.S. persons are prohibited from dealing with.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "US Treasury",
  },
  {
    id: "ofac-fse",
    title: "US Treasury - OFAC",
    category: "Foreign Sanctions Evaders",
    description: "Includes foreign persons who have facilitated deceptive transactions for or on behalf of persons subject to U.S. sanctions, or in violation of U.S. sanctions on Syria or Iran pursuant to Executive Order 13608.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "US Treasury",
  },
  {
    id: "ofac-plc",
    title: "US Treasury - OFAC",
    category: "Palestinian Legislative Council",
    description: "Includes members of the Palestinian Legislative Council (PLC) elected on the slate of any Foreign Terrorist Organization, provided that they are not named on the OFAC Specially Designated Nationals list.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "US Treasury",
  },
  {
    id: "ofac-ssi",
    title: "US Treasury - OFAC",
    category: "Sectoral Sanctions Identifications",
    description: "Includes persons operating in sectors of the Russian economy identified by the Secretary of the Treasury, relating to actions in Crimea and Ukraine, who U.S. persons are prohibited from dealing with.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "US Treasury",
  },
  {
    id: "ofac-nsdn",
    title: "US Treasury - OFAC",
    category: "Non-SDN Menu-Based Sanctions",
    description: "Includes persons subject to certain sanctions that are less than full blocking sanctions, enumerated on a record-by-record basis.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "US Treasury",
  },
  {
    id: "fbi-wanted",
    title: "US Department of Justice",
    category: "FBI Wanted List",
    description: "Includes individuals wanted by the FBI for a variety of violent and non-violent crimes, terrorism suspects, and kidnapped and missing persons.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "FBI",
  },
  {
    id: "eu-consolidated",
    title: "European External Action Service",
    category: "Consolidated List of Sanctions",
    description: "Includes groups and entities subject to financial sanctions relating to the EU Common Foreign and Security Policy, necessary to prevent conflict or respond to emerging or current crises.",
    country: "European Union",
    icon: <FlagIcon country="European Union" className="h-6 w-6" />,
    enabled: true,
    source: "EEAS",
  },
  {
    id: "uk-consolidated",
    title: "UK Her Majesty's Treasury",
    category: "Consolidated List of Sanctions",
    description: "Includes groups and entities subject to sanctions designated under regulations made under the Sanctions and Anti-Money Laundering Act 2018.",
    country: "United Kingdom",
    icon: <FlagIcon country="United Kingdom" className="h-6 w-6" />,
    enabled: true,
    source: "UK Treasury",
  },
  {
    id: "cia-chiefs",
    title: "International",
    category: "CIA List of Chiefs of State and Cabinet Members",
    description: "Includes chiefs of state and cabinet members of foreign governments around the world.",
    country: "Global",
    icon: <FlagIcon country="Global" className="h-6 w-6" />,
    enabled: true,
    source: "CIA",
  },
  {
    id: "interpol-red",
    title: "International",
    category: "Interpol Red Notices for Wanted Persons",
    description: "Includes fugitives wanted either for prosecution or to serve a sentence. A Red Notice is a request to law enforcement worldwide to locate and provisionally arrest a person pending extradition, surrender, or similar legal action.",
    country: "Global",
    icon: <FlagIcon country="Global" className="h-6 w-6" />,
    enabled: true,
    source: "Interpol",
  },
  {
    id: "un-consolidated",
    title: "International",
    category: "United Nations Consolidated Sanctions",
    description: "Includes all individuals and entities subject to measures imposed by the UN Security Council to maintain or restore international peace and security.",
    country: "Global",
    icon: <FlagIcon country="Global" className="h-6 w-6" />,
    enabled: true,
    source: "UN",
  },
  {
    id: "world-bank",
    title: "International",
    category: "World Bank Listing of Ineligible Firms and Individuals",
    description: "Includes individuals and businesses that the World Bank have sanctioned due to fraud and corruption.",
    country: "Global",
    icon: <FlagIcon country="Global" className="h-6 w-6" />,
    enabled: true,
    source: "World Bank",
  },
  {
    id: "state-nonproliferation",
    title: "US Department of State",
    category: "Nonproliferation Sanctions",
    description: "Includes foreign individuals, private entities, and governments that have been designated under various legal authorities for engaging in proliferation activities.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "US State Department",
  },
  {
    id: "state-aeca",
    title: "US Department of State",
    category: "AECA Debarred",
    description: "Includes persons statutorily debarred under the International Traffic in Arms Regulations (ITAR) or who've violated or conspired to violate the Arms Export Control Act (AECA).",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "US State Department",
  },
  {
    id: "gsa-epls",
    title: "US General Services Administration",
    category: "Excluded Party List System",
    description: "Active exclusion records entered by the U.S. Federal government identifying those parties excluded from receiving Federal contracts, certain subcontracts, and certain Federal financial and non-financial assistance and benefits.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: false,
    source: "GSA",
  },
  {
    id: "bis-denied",
    title: "Bureau of Industry and Security",
    category: "Denied Persons List",
    description: "Includes individuals who have had export privileges denied by written order of the Department of Commerce.",
    country: "United States",
    icon: <FlagIcon country="United States" className="h-6 w-6" />,
    enabled: true,
    source: "BIS",
  },
  {
    id: "australia-dfat",
    title: "Australia DFAT",
    category: "Consolidated List of Sanctions",
    description: "Includes all persons and entities who are subject to targeted financial sanctions under Australian sanctions law. Those listed may be Australian citizens, foreign nationals, or residents in Australia or overseas.",
    country: "Australia",
    icon: <FlagIcon country="Australia" className="h-6 w-6" />,
    enabled: true,
    source: "DFAT",
  },
  {
    id: "canada-consolidated",
    title: "Government of Canada",
    category: "Consolidated List of Sanctions",
    description: "Includes individuals and entities subject to specific sanctions regulations made under the Special Economic Measures Act (SEMA) and the Justice for Victims of Corrupt Foreign Officials Act (JVCFOA).",
    country: "Canada",
    icon: <FlagIcon country="Canada" className="h-6 w-6" />,
    enabled: true,
    source: "Government of Canada",
  },
  {
    id: "ecuador-uafe",
    title: "UAFE - Unidad de Análisis Financiero y Económico",
    category: "Lista de Personas y Entidades Sancionadas",
    description: "Incluye personas y entidades sancionadas por la Unidad de Análisis Financiero y Económico (UAFE) de Ecuador por actividades relacionadas con lavado de activos, financiamiento del terrorismo y otros delitos financieros.",
    country: "Ecuador",
    icon: <FlagIcon country="Ecuador" className="h-6 w-6" />,
    enabled: true,
    source: "UAFE",
  },
];

