import type { Metadata } from "next";
import { AuthenticationPageContent } from "./_components/authentication-page-content";

export const metadata: Metadata = {
  title: "Authentication",
};

export default function AuthenticationPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <AuthenticationPageContent />
    </div>
  );
}
