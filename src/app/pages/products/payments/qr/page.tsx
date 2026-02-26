import type { Metadata } from "next";
import { QRPageContent } from "./_components/qr-page-content";

export const metadata: Metadata = {
  title: "QR",
};

export default function QRPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <QRPageContent />
    </div>
  );
}

