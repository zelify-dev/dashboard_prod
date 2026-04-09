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
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { createAMLScreening } from "@/lib/aml-api";

function formatTranslation(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.split(`{{${key}}}`).join(String(value));
  }, template);
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
  const { countryName: orgCountryName } = useOrganizationCountry();
  const [country, setCountry] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(defaultSelectedGroupId);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [entityType, setEntityType] = useState<string>("individual");
  const [dob, setDob] = useState("");
  const [minScore, setMinScore] = useState(0.88);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<{ country?: string; documentNumber?: string; fullName?: string }>({});
  
  // useEffect(() => {
  //   if (orgCountryName) setCountry(orgCountryName);
  // }, [orgCountryName]);
  
  // Obtener listas dinámicas basadas en el idioma
  const amlLists = useMemo(() => getAMLists(language), [language]);
  
  // Mostrar todos los países, pero usar el de la organización como valor inicial
  const countryOptions = useMemo(() => 
    countries.map(c => ({ value: c, label: c })),
    []
  );

  const groupOptions = useMemo(() => [
    { value: "", label: translations.allListsOption },
    ...groups.map(g => ({ value: g.id, label: g.name }))
  ], [groups, translations.allListsOption]);

  const entityTypeOptions = useMemo(() => [
    { value: "individual", label: translations.config.individual },
    { value: "entity", label: translations.config.entity },
    { value: "vessel", label: translations.config.vessel },
    { value: "aircraft", label: translations.config.aircraft },
  ], [translations.config]);

  // const nationalityOptions = useMemo(() => 
  //   countries.map(c => ({ value: c, label: c })),
  //   []
  // );

  // Obtener las listas que se usarán para la verificación
  const getListsForVerification = (): string[] => {
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      return group?.sources || [];
    }
    // Si no hay grupo seleccionado, usar todas las listas activas
    return amlLists.filter((list) => list.enabled).map((list) => list.id);
  };

  // Generar pasos de búsqueda dinámicos basados en las listas que se verificarán
  const getSearchSteps = (): string[] => {
    const listIds = getListsForVerification();
    const steps: string[] = [];
    
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
    [selectedGroupId, groups, amlLists, translations.progressSteps, translations.form, country]
  );

  useEffect(() => {
    if (!isSearching) return;

    const duration = 3000 + Math.random() * 2000; // 3-5 segundos
    const startTime = Date.now();
    
    // Obtener las listas al inicio de la búsqueda
    let verifiedListIds: string[];
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      verifiedListIds = group?.sources || [];
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
        
        // Ejecutar el screening real en el backend
        const triggerScreening = async () => {
          try {
            const listIds = getListsForVerification();
            const res = await createAMLScreening({
              name: fullName,
              validation_group_id: selectedGroupId || undefined,
              data_source: selectedGroupId ? undefined : listIds.join(","),
              entity_type: entityType,
              date_of_birth: dob || undefined,
              nationality: country || undefined, // Using country as nationality for simplification
              country: country || undefined,
              min_score: minScore,
              identifier: documentNumber || undefined
            });

            // Crear validación local con los datos reales
            const pendingValidation: AMLValidation = {
              id: res.screening_id,
              name: fullName,
              documentNumber,
              country,
              verification: "pending",
              verifiedListIds,
              groupId: currentGroupId || undefined,
              createdAt: new Date().toISOString().split("T")[0],
              rawDetail: res, // Guardar respuesta inicial
            };

            onStartVerification(pendingValidation);
            
            // Resetear
            setIsSearching(false);
            setProgress(0);
            setCurrentStep(0);
            setFullName("");
            setDocumentNumber("");
            setSelectedGroupId(defaultSelectedGroupId);
          } catch (err) {
            console.error("Error at final screening stage:", err);
            setIsSearching(false);
          }
        };

        triggerScreening();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isSearching, country, documentNumber, selectedGroupId, searchSteps, onStartVerification, defaultSelectedGroupId, groups, amlLists, fullName, entityType, dob, minScore]);

  const validateForm = (): boolean => {
    const newErrors: { country?: string; documentNumber?: string; fullName?: string } = {};
    
    // Solo el nombre completo es estrictamente requerido para el screening
    if (!fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    }
    
    // El país y número de documento son opcionales para refinar la búsqueda
    if (documentNumber.trim() && documentNumber.trim().length < 5) {
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
    ? selectedGroup?.sources.length || 0
    : amlLists.filter((list) => list.enabled).length);
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

        {/* Nombre Completo */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-semibold text-dark dark:text-white">
            Nombre Completo del Sujeto
            <span className="ml-1 text-red-500">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) {
                setErrors(prev => ({ ...prev, fullName: undefined }));
              }
            }}
            disabled={isSearching}
            placeholder="Ej: Patricio Maldonado"
            className={cn(
              "block w-full rounded-lg border px-4 py-3 text-sm text-dark placeholder-dark-6 transition-colors focus:outline-none focus:ring-1 dark:bg-dark-2 dark:text-white dark:placeholder-dark-6 disabled:opacity-50",
              errors.fullName
                ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
                : "border-stroke focus:border-primary focus:ring-primary dark:border-dark-3"
            )}
            required
          />
          {errors.fullName && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>
          )}
        </div>
        
        {/* País (Opcional) */}
        <div className="space-y-2">
          <label htmlFor="country" className="block text-sm font-semibold text-dark dark:text-white">
            Nacionalidad / Residencia
            <span className="ml-1 text-xs font-medium text-dark-6">(Opcional)</span>
          </label>
          <SimpleSelect
            options={countryOptions}
            value={country}
            placeholder={translations.selectCountry}
            onChange={(value) => {
              setCountry(value);
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

        {/* Toggle para Opciones Avanzadas */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <svg 
              className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {translations.config.advancedOptions}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-6 rounded-lg border border-dashed border-stroke p-5 dark:border-dark-3 md:grid-cols-2">
            {/* Tipo de Entidad */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-dark dark:text-white">
                {translations.config.entityType}
              </label>
              <SimpleSelect
                options={entityTypeOptions}
                value={entityType}
                onChange={setEntityType}
                className="w-full"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-dark dark:text-white">
                {translations.config.dateOfBirth}
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="block w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition-colors focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
            </div>

            {/* Puntaje de Confianza */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-dark dark:text-white">
                {translations.config.confidenceScore}
              </label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.01"
                    value={minScore}
                    onChange={(e) => setMinScore(parseFloat(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-dark-3 outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-primary [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                    style={{
                      background: `linear-gradient(to right, #3C50E0 0%, #3C50E0 ${(minScore - 0.5) / 0.5 * 100}%, #E2E8F0 ${(minScore - 0.5) / 0.5 * 100}%, #E2E8F0 100%)`
                    }}
                  />
                </div>
                <span className="min-w-[50px] rounded-full bg-primary/10 px-3 py-1 text-center text-[12px] font-bold text-primary border border-primary/20 shadow-sm">
                  {Math.round(minScore * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}


        {/* Número de documento (Opcional) */}
        <div className="space-y-2">
          <label htmlFor="documentNumber" className="block text-sm font-semibold text-dark dark:text-white">
            {translations.documentNumber}
            <span className="ml-1 text-xs font-medium text-dark-6">(Opcional)</span>
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
