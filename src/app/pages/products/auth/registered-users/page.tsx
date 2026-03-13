import type { Metadata } from "next";
import { RegisteredUsersContent } from "./_components/registered-users-content";

export const metadata: Metadata = {
  title: "Registered users",
};

export default function RegisteredUsersPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <RegisteredUsersContent />
    </div>
  );
}
