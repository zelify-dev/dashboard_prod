"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui-elements/button";
import { AMLValidation } from "./aml-validations-list";
import { useAMLTranslations } from "./use-aml-translations";
import { AMLListGroup } from "./aml-list-config";
import { getAMLists } from "./aml-lists-data";
import { SimpleSelect } from "@/components/FormElements/simple-select";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

function formatTranslation(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.split(`{{${key}}}`).join(String(value));
  }, template);
}

// Componente Toggle
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        enabled ? "bg-primary" : "bg-gray-300 dark:bg-dark-3"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

interface AMLValidationFormProps {
  onStartVerification: (validation: AMLValidation) => void;
  onCancel: () => void;
  groups?: AMLListGroup[];
  selectedGroupId?: string | null;
}

const countries = [
  "Ecuador",
  "Mexico",
  "Brazil",
  "Colombia",
  "United States",
  "Argentina",
  "Chile",
  "Peru",
  "Venezuela",
  "Panama",
  "Costa Rica",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Paraguay",
  "Uruguay",
  "Bolivia",
];

const firstNames = [
  "Carlos", "María", "Juan", "Ana", "Luis", "Laura", "Pedro", "Carmen",
  "José", "Patricia", "Miguel", "Sandra", "Roberto", "Andrea", "Fernando", "Monica",
  "Ricardo", "Gabriela", "Daniel", "Isabel", "Alejandro", "Lucía", "Francisco", "Elena",
  "Andrés", "Claudia", "Javier", "Natalia", "Diego", "Valentina", "Sergio", "Camila",
  "Manuel", "Sofía", "Antonio", "Paula", "Rafael", "Daniela", "Eduardo", "Mariana",
  "David", "Carolina", "Jorge", "Alejandra", "Pablo", "Fernanda", "Gustavo", "Adriana",
  "Alberto", "Cristina", "Mario", "Verónica", "Oscar", "Tatiana", "Hector", "Diana"
];

const lastNames = [
  "García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez",
  "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez",
  "Muñoz", "Romero", "Alonso", "Gutiérrez", "Navarro", "Torres", "Domínguez", "Vázquez",
  "Ramos", "Gil", "Ramírez", "Serrano", "Blanco", "Suárez", "Molina", "Morales",
  "Ortega", "Delgado", "Castro", "Ortiz", "Rubio", "Marín", "Sanz", "Iglesias",
  "Nuñez", "Medina", "Garrido", "Cortés", "Castillo", "Santos", "Lozano", "Guerrero"
];

function generateRandomName(): string {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

export function AMLValidationForm({ 
  onStartVerification, 
  onCancel,
  groups = [],
  selectedGroupId: defaultSelectedGroupId = null,
}: AMLValidationFormProps) {
  const translations = useAMLTranslations();
  const { language } = useLanguage();
  const [country, setCountry] = useState<string>("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(defaultSelectedGroupId);
  const [includePEPs, setIncludePEPs] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<{ country?: string; documentNumber?: string }>({});
  
  // Obtener listas dinámicas basadas en el idioma
  const amlLists = useMemo(() => getAMLists(language), [language]);
  
  // Preparar opciones para los selects
  const countryOptions = useMemo(() => 
    countries.map(c => ({ value: c, label: c })),
    []
  );

  const groupOptions = useMemo(() => [
    { value: "", label: translations.allListsOption },
    ...groups.map(g => ({ value: g.id, label: g.name }))
  ], [groups, translations.allListsOption]);

  // Obtener las listas que se usarán para la verificación
  const getListsForVerification = (): string[] => {
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      return group?.listIds || [];
    }
    // Si no hay grupo seleccionado, usar todas las listas activas
    return amlLists.filter((list) => list.enabled).map((list) => list.id);
  };

  // Generar pasos de búsqueda dinámicos basados en las listas que se verificarán
  const getSearchSteps = (): string[] => {
    const listIds = getListsForVerification();
    const steps: string[] = [];
    
    // Si está habilitado PEPs, agregarlo primero
    if (includePEPs && country) {
      steps.push(formatTranslation(translations.form.searchingPepStep, { country }));
    }
    
    listIds.forEach(listId => {
      const list = amlLists.find(l => l.id === listId);
      if (list) {
        steps.push(formatTranslation(translations.form.checkingListStep, { title: list.title, category: list.category }));
      }
    });
    
    if (steps.length === 0) {
      return translations.progressSteps;
    }
    
    steps.push(
      translations.progressSteps[translations.progressSteps.length - 1] || translations.form.finishingVerificationFallback
    );
    return steps;
  };

  const searchSteps = useMemo(
    () => getSearchSteps(),
    [selectedGroupId, groups, amlLists, translations.progressSteps, translations.form, includePEPs, country]
  );

  useEffect(() => {
    if (!isSearching) return;

    const duration = 3000 + Math.random() * 2000; // 3-5 segundos
    const startTime = Date.now();
    
    // Obtener las listas al inicio de la búsqueda
    let verifiedListIds: string[];
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      verifiedListIds = group?.listIds || [];
    } else {
      verifiedListIds = amlLists.filter((list) => list.enabled).map((list) => list.id);
    }
    const currentGroupId = selectedGroupId;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, (elapsed / duration) * 100);
      
      // Actualizar step
      const stepIndex = Math.min(
        searchSteps.length - 1,
        Math.floor((elapsed / duration) * searchSteps.length)
      );
      
      setProgress(currentProgress);
      setCurrentStep(stepIndex);

      if (currentProgress >= 100) {
        clearInterval(interval);
        
        // Crear validación con estado "pending" y agregar a la tabla
        const pendingValidation: AMLValidation = {
          id: Date.now().toString(),
          name: generateRandomName(),
          documentNumber,
          country,
          verification: "pending",
          verifiedListIds,
          groupId: currentGroupId || undefined,
          includePEPs: includePEPs && country ? { country, enabled: true } : undefined,
          createdAt: new Date().toISOString().split("T")[0],
        };

        // Agregar a la lista con estado pending
        onStartVerification(pendingValidation);
        
        // Resetear el formulario
        setIsSearching(false);
        setProgress(0);
        setCurrentStep(0);
        setCountry("");
        setDocumentNumber("");
        setSelectedGroupId(defaultSelectedGroupId);
        setIncludePEPs(false);
        setErrors({});
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isSearching, country, documentNumber, selectedGroupId, includePEPs, searchSteps, onStartVerification, defaultSelectedGroupId, groups, amlLists]);

  const validateForm = (): boolean => {
    const newErrors: { country?: string; documentNumber?: string } = {};
    
    if (!country) {
      newErrors.country = translations.form.countryRequired;
    }
    
    if (!documentNumber.trim()) {
      newErrors.documentNumber = translations.form.documentNumberRequired;
    } else if (documentNumber.trim().length < 5) {
      newErrors.documentNumber = translations.form.documentNumberMinLength;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSearching(true);
    setProgress(0);
    setCurrentStep(0);
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const listsCount = (selectedGroupId 
    ? selectedGroup?.listIds.length || 0
    : amlLists.filter((list) => list.enabled).length) + (includePEPs && country ? 1 : 0);
  const listLabel = listsCount === 1 ? translations.form.listSingular : translations.form.listPlural;
  const scopeLabel = selectedGroupId ? translations.form.scopeInThisGroup : translations.form.scopeActive;
  const listsSummaryText = formatTranslation(translations.form.listsSummary, {
    count: listsCount,
    listLabel,
    scope: scopeLabel,
  });
  const verifyingInListsText = formatTranslation(translations.form.verifyingInLists, {
    count: listsCount,
    listLabel,
  });

  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2" data-tour-id="tour-aml-validation-form">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dark dark:text-white">{translations.newValidation}</h2>
        <p className="text-sm text-dark-6 dark:text-dark-6">
          {translations.newValidationDesc}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Selector de grupo */}
        {groups.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="group" className="block text-sm font-semibold text-dark dark:text-white">
              {translations.selectGroupForValidation}
            </label>
            <SimpleSelect
              options={groupOptions}
              value={selectedGroupId || ""}
              placeholder={translations.allListsOption}
              onChange={(value) => setSelectedGroupId(value || null)}
              isSearchable={groups.length > 5}
              className={cn(
                "w-full",
                errors.country && "react-select-error"
              )}
            />
            <p className="text-xs text-dark-6 dark:text-dark-6">
              {listsSummaryText}
            </p>
          </div>
        )}
        
        {/* País */}
        <div className="space-y-2">
          <label htmlFor="country" className="block text-sm font-semibold text-dark dark:text-white">
            {translations.country}
            <span className="ml-1 text-red-500">*</span>
          </label>
          <SimpleSelect
            options={countryOptions}
            value={country}
            placeholder={translations.selectCountry}
            onChange={(value) => {
              setCountry(value);
              // Si se cambia el país, deshabilitar PEPs si no hay país
              if (!value) {
                setIncludePEPs(false);
              }
              if (errors.country) {
                setErrors(prev => ({ ...prev, country: undefined }));
              }
            }}
            isSearchable={true}
            className={cn(
              "w-full",
              errors.country && "react-select-error"
            )}
          />
          {errors.country && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.country}</p>
          )}
        </div>

        {/* Toggle PEPs */}
        {country && (
          <div className="flex items-center justify-between rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-dark dark:text-white mb-1">
                {formatTranslation(translations.form.pepToggleTitle, { country })}
              </label>
              <p className="text-xs text-dark-6 dark:text-dark-6">
                {formatTranslation(translations.form.pepToggleDescription, { country })}
              </p>
            </div>
            <Toggle enabled={includePEPs} onChange={setIncludePEPs} />
          </div>
        )}

        {/* Número de documento */}
        <div className="space-y-2">
          <label htmlFor="documentNumber" className="block text-sm font-semibold text-dark dark:text-white">
            {translations.documentNumber}
            <span className="ml-1 text-red-500">*</span>
          </label>
          <input
            id="documentNumber"
            type="text"
            value={documentNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setDocumentNumber(value);
              if (errors.documentNumber) {
                setErrors(prev => ({ ...prev, documentNumber: undefined }));
              }
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={isSearching}
            placeholder={translations.documentNumberPlaceholder}
            className={cn(
              "block w-full rounded-lg border px-4 py-3 text-sm text-dark placeholder-dark-6 transition-colors focus:outline-none focus:ring-1 dark:bg-dark-2 dark:text-white dark:placeholder-dark-6 disabled:opacity-50",
              errors.documentNumber
                ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
                : "border-stroke focus:border-primary focus:ring-primary dark:border-dark-3"
            )}
            required
          />
          {errors.documentNumber && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.documentNumber}</p>
          )}
        </div>

        {/* Barra de progreso */}
        {isSearching && (
          <div className="space-y-4 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-dark dark:text-white">
                  {searchSteps[currentStep] || translations.status.pending}
                </span>
                <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-dark-6 dark:text-dark-6">
              <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{verifyingInListsText}</span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        {!isSearching && (
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              label={translations.verify}
              variant="primary"
              shape="rounded"
              size="small"
              className="flex-1"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <Button
              type="button"
              onClick={onCancel}
              label={translations.cancel}
              variant="outlineDark"
              shape="rounded"
              size="small"
            />
          </div>
        )}
      </form>
    </div>
  );
}
