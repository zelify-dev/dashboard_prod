import type { Metadata } from "next";
import { DeviceInformationPageContent } from "./_components/device-information-page-content";

export const metadata: Metadata = {
  title: "Device information",
};

export default function DeviceInformationPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <DeviceInformationPageContent />
    </div>
  );
}
