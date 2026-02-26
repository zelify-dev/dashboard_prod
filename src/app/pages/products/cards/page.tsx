import type { Metadata } from "next";
import { CardsPageContent } from "./_components/cards-page-content";

export const metadata: Metadata = {
  title: "Cards",
};

export default function CardsPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <CardsPageContent />
    </div>
  );
}
