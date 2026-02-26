import type { Metadata } from "next";
import { AlaizaPageContent } from "./_components/alaiza-page-content";

export const metadata: Metadata = {
  title: "Alaiza",
};

export default function AlaizaPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <AlaizaPageContent />
    </div>
  );
}

