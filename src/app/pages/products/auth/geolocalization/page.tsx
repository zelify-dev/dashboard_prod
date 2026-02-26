import type { Metadata } from "next";
import { GeolocalizationPageContent } from "./_components/geolocalization-page-content";

export const metadata: Metadata = {
  title: "Geolocalization",
};

export default function GeolocalizationPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <GeolocalizationPageContent />
    </div>
  );
}
