import type { Metadata } from "next";
import { LogsPageClient } from "./_components/logs-page-client";

export const metadata: Metadata = {
  title: "Logs",
};

export default function LogsPage() {
  return <LogsPageClient />;
}
