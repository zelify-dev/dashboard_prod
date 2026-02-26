"use client";

import { useState, useEffect } from "react";
import { useGeolocalizationTranslations } from "./use-geolocalization-translations";
import { MobilePreview } from "./mobile-preview";
import { useTour } from "@/contexts/tour-context";
import { cn } from "@/lib/utils";

interface LocationInfo {
  formatted?: string;
  country?: string;
  country_code?: string;
  ISO_3166_1_alpha_2?: string;
  ISO_3166_1_alpha_3?: string;
  city?: string;
  _normalized_city?: string;
  state?: string;
  borough?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  road?: string;
  main_street?: string;
  secondary_street?: string;
  house_number?: string;
  postcode?: string;
  continent?: string;
  political_union?: string;
  _type?: string;
  _category?: string;
  confidence?: number;
  [key: string]: any;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | undefined }) {
  if (!value) return null;

  return (
    <div className="rounded-lg border border-stroke bg-white p-2.5 dark:border-dark-3 dark:bg-dark-2">
      <div className="mb-1 flex items-center gap-1.5">
        <div className="flex-shrink-0 text-primary">
          {icon}
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
          {label}
        </p>
      </div>
      <p className="text-xs font-semibold text-dark dark:text-white truncate" title={value.toString()}>
        {value}
      </p>
    </div>
  );
}

function CopyButton({ jsonData }: { jsonData: LocationInfo }) {
  const [copied, setCopied] = useState(false);
  const translations = useGeolocalizationTranslations();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
    >
      {copied ? (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {translations.copyButton.copied}
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {translations.copyButton.copy}
        </>
      )}
    </button>
  );
}

// Función para formatear JSON con colores
function formatJSONWithColors(json: any): React.ReactNode {
  const jsonString = JSON.stringify(json, null, 2);
  const lines = jsonString.split('\n');

  // Colores para diferentes tipos de tokens
  const colors = {
    key: "text-blue-600 dark:text-blue-400",
    string: "text-green-600 dark:text-green-400",
    number: "text-orange-600 dark:text-orange-400",
    boolean: "text-purple-600 dark:text-purple-400",
    null: "text-gray-500 dark:text-gray-400",
    bracket: "text-gray-700 dark:text-gray-300",
    colon: "text-gray-700 dark:text-gray-300",
    comma: "text-gray-700 dark:text-gray-300",
  };

  return (
    <>
      {lines.map((line, lineIndex) => {
        const lineParts: React.ReactNode[] = [];
        let i = 0;

        while (i < line.length) {
          // Buscar strings (claves o valores)
          if (line[i] === '"') {
            const endQuote = line.indexOf('"', i + 1);
            if (endQuote !== -1) {
              const fullString = line.substring(i, endQuote + 1);
              // Verificar si es una clave (sigue un :)
              const restOfLine = line.substring(endQuote + 1).trim();
              const isKey = restOfLine.startsWith(':');

              lineParts.push(
                <span key={`${lineIndex}-${i}`} className={isKey ? colors.key : colors.string}>
                  {fullString}
                </span>
              );
              i = endQuote + 1;
              continue;
            }
          }

          // Buscar números (pueden estar después de : o al inicio de línea)
          const numberMatch = line.substring(i).match(/^(\d+\.?\d*)/);
          if (numberMatch && (i === 0 || line[i - 1] === ' ' || line[i - 1] === ':')) {
            lineParts.push(
              <span key={`${lineIndex}-${i}-num`} className={colors.number}>
                {numberMatch[1]}
              </span>
            );
            i += numberMatch[1].length;
            continue;
          }

          // Buscar booleanos
          if (line.substring(i).startsWith('true')) {
            lineParts.push(
              <span key={`${lineIndex}-${i}-bool`} className={colors.boolean}>
                true
              </span>
            );
            i += 4;
            continue;
          }
          if (line.substring(i).startsWith('false')) {
            lineParts.push(
              <span key={`${lineIndex}-${i}-bool`} className={colors.boolean}>
                false
              </span>
            );
            i += 5;
            continue;
          }

          // Buscar null
          if (line.substring(i).startsWith('null')) {
            lineParts.push(
              <span key={`${lineIndex}-${i}-null`} className={colors.null}>
                null
              </span>
            );
            i += 4;
            continue;
          }

          // Buscar llaves y corchetes
          if (line[i] === '{' || line[i] === '}' || line[i] === '[' || line[i] === ']') {
            lineParts.push(
              <span key={`${lineIndex}-${i}-bracket`} className={colors.bracket}>
                {line[i]}
              </span>
            );
            i++;
            continue;
          }

          // Buscar dos puntos
          if (line[i] === ':') {
            lineParts.push(
              <span key={`${lineIndex}-${i}-colon`} className={colors.colon}>
                :
              </span>
            );
            i++;
            continue;
          }

          // Buscar comas
          if (line[i] === ',') {
            lineParts.push(
              <span key={`${lineIndex}-${i}-comma`} className={colors.comma}>
                ,
              </span>
            );
            i++;
            continue;
          }

          // Carácter normal (espacios, indentación, etc.)
          lineParts.push(
            <span key={`${lineIndex}-${i}`}>
              {line[i]}
            </span>
          );
          i++;
        }

        return (
          <div key={lineIndex} className="leading-relaxed">
            {lineParts}
          </div>
        );
      })}
    </>
  );
}

// Función auxiliar para obtener continente (simplificada)
function getContinentFromCountry(countryCode?: string): string | undefined {
  if (!countryCode) return undefined;
  const code = countryCode.toLowerCase();

  // Mapeo básico de algunos países a continentes
  const europe = ['de', 'fr', 'es', 'it', 'uk', 'gb', 'nl', 'be', 'at', 'ch', 'pl', 'se', 'no', 'dk', 'fi', 'ie', 'pt', 'gr'];
  const asia = ['cn', 'jp', 'in', 'kr', 'th', 'vn', 'id', 'ph', 'my', 'sg', 'ae', 'sa', 'il', 'tr'];
  const americas = ['us', 'ca', 'mx', 'br', 'ar', 'co', 'cl', 'pe', 've'];
  const africa = ['za', 'eg', 'ng', 'ke', 'ma', 'dz'];
  const oceania = ['au', 'nz', 'fj', 'pg'];

  if (europe.includes(code)) return 'Europe';
  if (asia.includes(code)) return 'Asia';
  if (americas.includes(code)) return 'Americas';
  if (africa.includes(code)) return 'Africa';
  if (oceania.includes(code)) return 'Oceania';

  return undefined;
}

// Función auxiliar para obtener unión política
function getPoliticalUnionFromCountry(countryCode?: string): string | undefined {
  if (!countryCode) return undefined;
  const code = countryCode.toLowerCase();

  const euCountries = ['de', 'fr', 'es', 'it', 'nl', 'be', 'at', 'pl', 'se', 'dk', 'fi', 'ie', 'pt', 'gr', 'cz', 'hu', 'ro', 'bg', 'hr', 'sk', 'si', 'ee', 'lv', 'lt', 'mt', 'cy', 'lu'];
  if (euCountries.includes(code)) return 'European Union';

  return undefined;
}

export function GeolocalizationContent() {
  const translations = useGeolocalizationTranslations();
  const { isTourActive, currentStep, steps } = useTour();
  const currentStepData = steps[currentStep];
  const [coordinates, setCoordinates] = useState("");
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCoordinates = (input: string): { lat: number; lng: number } | null => {
    const trimmed = input.trim();
    const parts = trimmed.split(",").map(p => p.trim());

    if (parts.length !== 2) {
      return null;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  };

  const performSearch = async (coordsString: string) => {
    const coords = parseCoordinates(coordsString);

    if (!coords) {
      setError(translations.form.errors.invalidFormat);
      return;
    }

    const { lat, lng } = coords;

    if (lat < -90 || lat > 90) {
      setError(translations.form.errors.latRange);
      return;
    }

    if (lng < -180 || lng > 180) {
      setError(translations.form.errors.lngRange);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Usar Nominatim para geocodificación inversa
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error(translations.form.errors.fetchFailed);
      }

      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;

        // Mapear datos de Nominatim al formato similar a OpenCage
        const mainStreet = addr.road || addr.street || addr.pedestrian;
        const secondaryStreet = addr.road && addr.street && addr.road !== addr.street ? addr.street :
          addr.pedestrian && addr.road && addr.pedestrian !== addr.road ? addr.pedestrian :
            undefined;

        setLocationInfo({
          formatted: data.display_name,
          country: addr.country,
          country_code: addr.country_code?.toLowerCase(),
          city: addr.city || addr.town || addr.village || addr.municipality,
          _normalized_city: addr.city || addr.town || addr.village || addr.municipality,
          state: addr.state || addr.region || addr.province,
          borough: addr.borough || addr.city_district,
          suburb: addr.suburb,
          neighbourhood: addr.neighbourhood || addr.suburb,
          quarter: addr.quarter,
          road: mainStreet,
          main_street: mainStreet ? `${mainStreet}${addr.house_number ? ` ${addr.house_number}` : ''}` : undefined,
          secondary_street: secondaryStreet,
          house_number: addr.house_number,
          postcode: addr.postcode,
          // Mapear continente basado en el país (simplificado)
          continent: getContinentFromCountry(addr.country_code),
          political_union: getPoliticalUnionFromCountry(addr.country_code),
        });
      } else {
        setError(translations.form.errors.notFound);
        setLocationInfo(null);
      }
    } catch (err: any) {
      console.error("Error fetching location:", err);
      setError(err.message || translations.form.errors.fetchFailed);
      setLocationInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(coordinates);
  };

  // Autocompletar coordenadas y buscar cuando el tour llegue al paso 10
  useEffect(() => {
    if (isTourActive && steps.length > 0 && currentStep === 9) { // Step 10 is index 9
      const currentStepData = steps[currentStep];
      if (currentStepData?.id === "geolocalization-search") {
        const defaultCoordinates = "-0.17630197947865153, -78.47928775338583";
        if (coordinates !== defaultCoordinates) {
          setCoordinates(defaultCoordinates);
          // Esperar un momento para que el input se actualice y luego buscar
          setTimeout(() => {
            performSearch(defaultCoordinates);
          }, 500);
        } else if (!locationInfo && !isLoading) {
          performSearch(defaultCoordinates);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive, currentStep, steps]);

  return (
    <div className="mt-6">
      {/* Two Column Layout: Form and Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Mobile Preview */}
        <div>
          <MobilePreview locationInfo={locationInfo} />
        </div>

        {/* Right Column: Form and Results */}
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2" data-tour-id="tour-geolocalization-search">
            {/* Form */}
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.form.coordinatesLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    placeholder={translations.form.placeholder}
                    className="flex-1 rounded-lg border border-stroke bg-gray-2 px-4 py-2.5 text-sm text-dark outline-none placeholder:text-dark-6 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:placeholder:text-dark-6"
                    data-tour-id="tour-geolocalization-input"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !coordinates.trim()}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    data-tour-id="tour-geolocalization-search-button"
                  >
                    {isLoading ? translations.form.searching : translations.form.search}
                  </button>
                </div>
                <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">
                  {translations.form.formatHint}
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <div className="flex items-start gap-2">
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </form>


          </div>

          {/* Location Information */}
          {locationInfo && (
            <div
              className={cn("space-y-4 rounded-lg bg-white p-4 shadow-sm dark:bg-dark-2 scroll-mt-32", isTourActive && currentStepData?.target === "tour-geolocalization-results" && "z-[102]")}
              data-tour-id="tour-geolocalization-results"
              style={{ minHeight: isTourActive && currentStepData?.target === "tour-geolocalization-results" ? "300px" : undefined }}
            >
              {/* Formatted Address - Featured */}
              {locationInfo.formatted && (
                <div className="rounded-lg border md:border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-3 dark:border-primary/30 dark:from-primary/10 dark:to-primary/20">
                  <div className="mb-1 flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                      {translations.highlightLabel}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-dark dark:text-white leading-tight">{locationInfo.formatted}</p>
                </div>
              )}

              {/* Location Details Cards */}
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-dark dark:text-white">
                    {translations.sections.locationDetails}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                    <InfoCard
                      icon={
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                      label={translations.infoLabels.country}
                      value={locationInfo.country}
                    />
                    <InfoCard
                      icon={
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V7m0 0L9 7" />
                        </svg>
                      }
                      label={translations.infoLabels.state}
                      value={locationInfo.state}
                    />
                    <InfoCard
                      icon={
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      }
                      label={translations.infoLabels.city}
                      value={locationInfo.city || locationInfo._normalized_city}
                    />
                    <InfoCard
                      icon={
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V7m0 0L9 7" />
                        </svg>
                      }
                      label={translations.infoLabels.mainStreet}
                      value={locationInfo.main_street}
                    />
                    {locationInfo.secondary_street && (
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        }
                        label={translations.infoLabels.secondaryStreet}
                        value={locationInfo.secondary_street}
                      />
                    )}
                    <InfoCard
                      icon={
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      }
                      label={translations.infoLabels.postalCode}
                      value={locationInfo.postcode}
                    />
                    <InfoCard
                      icon={
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                      label={translations.infoLabels.countryCode}
                      value={locationInfo.country_code?.toUpperCase()}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                {(locationInfo.borough || locationInfo.suburb || locationInfo.neighbourhood || locationInfo.quarter || locationInfo.continent || locationInfo.political_union) && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-dark dark:text-white">
                      {translations.sections.additionalInformation}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V7m0 0L9 7" />
                          </svg>
                        }
                        label={translations.infoLabels.borough}
                        value={locationInfo.borough}
                      />
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        }
                        label={translations.infoLabels.suburb}
                        value={locationInfo.suburb}
                      />
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        }
                        label={translations.infoLabels.neighbourhood}
                        value={locationInfo.neighbourhood}
                      />
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        }
                        label={translations.infoLabels.quarter}
                        value={locationInfo.quarter}
                      />
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        label={translations.infoLabels.continent}
                        value={locationInfo.continent}
                      />
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        }
                        label={translations.infoLabels.politicalUnion}
                        value={locationInfo.political_union}
                      />
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                {(locationInfo._type || locationInfo._category || locationInfo.ISO_3166_1_alpha_2 || locationInfo.ISO_3166_1_alpha_3) && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-dark dark:text-white">
                      {translations.sections.technicalDetails}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        }
                        label={translations.infoLabels.type}
                        value={locationInfo._type}
                      />
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        }
                        label={translations.infoLabels.category}
                        value={locationInfo._category}
                      />
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        }
                        label={translations.infoLabels.isoA2}
                        value={locationInfo.ISO_3166_1_alpha_2}
                      />
                      <InfoCard
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        }
                        label={translations.infoLabels.isoA3}
                        value={locationInfo.ISO_3166_1_alpha_3}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* JSON View */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dark dark:text-white">
                    {translations.sections.jsonData}
                  </h3>
                  <CopyButton jsonData={locationInfo} />
                </div>
                <div className="rounded-lg border border-stroke bg-gray-50 p-2.5 dark:border-dark-3 dark:bg-dark-3">
                  <pre className="overflow-auto text-[10px] font-mono leading-none" style={{ maxHeight: '200px' }}>
                    <code className="block whitespace-pre">
                      {formatJSONWithColors(locationInfo)}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
