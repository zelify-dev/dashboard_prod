import type { Metadata } from "next";
import { NotificationsDomainsPageContent } from "../_components/notifications-domains-page-content";

export const metadata: Metadata = {
  title: "Notifications / Domains",
};

export default function NotificationsDomainsPage() {
  return <NotificationsDomainsPageContent />;
}
