import type { Metadata } from "next";
import { CustomKeysPageContent } from "./_components/custom-keys-page-content";

export const metadata: Metadata = {
  title: "Claves personalizadas",
};

export default function CustomKeysPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <CustomKeysPageContent />
    </div>
  );
}
