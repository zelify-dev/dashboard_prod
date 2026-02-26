"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GeolocalizationContent } from "./geolocalization-content";
import { useGeolocalizationTranslations } from "./use-geolocalization-translations";

export function GeolocalizationPageContent() {
  const translations = useGeolocalizationTranslations();

  return (
    <>
      <Breadcrumb pageName={translations.pageTitle} />
      <GeolocalizationContent />
    </>
  );
}
