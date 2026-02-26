"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Diligence = {
  id: string;
  cardholderName: string;
  cardNumber: string;
  status: "pending" | "approved" | "rejected" | "in_review";
  submittedDate: string;
  reviewedDate?: string;
  reviewer?: string;
  riskLevel: "low" | "medium" | "high";
  documents: number;
};

const mockDiligences: Diligence[] = [
  {
    id: "dil_001",
    cardholderName: "John Doe",
    cardNumber: "**** 4532",
    status: "approved",
    submittedDate: "2024-01-10T09:00:00Z",
    reviewedDate: "2024-01-12T14:30:00Z",
    reviewer: "Sarah Johnson",
    riskLevel: "low",
    documents: 5,
  },
  {
    id: "dil_002",
    cardholderName: "Jane Smith",
    cardNumber: "**** 7890",
    status: "in_review",
    submittedDate: "2024-01-14T11:20:00Z",
    riskLevel: "medium",
    documents: 7,
  },
  {
    id: "dil_003",
    cardholderName: "Robert Johnson",
    cardNumber: "**** 1234",
    status: "rejected",
    submittedDate: "2024-01-08T15:45:00Z",
    reviewedDate: "2024-01-09T10:15:00Z",
    reviewer: "Michael Brown",
    riskLevel: "high",
    documents: 3,
  },
  {
    id: "dil_004",
    cardholderName: "Emily Davis",
    cardNumber: "**** 5678",
    status: "pending",
    submittedDate: "2024-01-15T08:30:00Z",
    riskLevel: "low",
    documents: 6,
  },
];

interface DiligenceListProps {
  diligences: Diligence[];
  onDiligenceClick: (diligence: Diligence) => void;
}

export function DiligenceList({ diligences, onDiligenceClick }: DiligenceListProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].diligence;
  const locale = language === "es" ? "es-ES" : "en-US";

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(date));

  const formatTime = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(date));

  const getStatusColor = (status: Diligence["status"]) => {
    switch (status) {
      case "approved":
        return "bg-[#219653]/[0.08] text-[#219653]";
      case "in_review":
        return "bg-[#FFA70B]/[0.08] text-[#FFA70B]";
      case "rejected":
        return "bg-[#D34053]/[0.08] text-[#D34053]";
      case "pending":
        return "bg-gray-100 text-gray-600 dark:bg-dark-3 dark:text-dark-6";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getRiskLevelColor = (riskLevel: Diligence["riskLevel"]) => {
    switch (riskLevel) {
      case "low":
        return "bg-[#219653]/[0.08] text-[#219653]";
      case "medium":
        return "bg-[#FFA70B]/[0.08] text-[#FFA70B]";
      case "high":
        return "bg-[#D34053]/[0.08] text-[#D34053]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5" data-tour-id="tour-cards-diligence-list">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[150px] xl:pl-7.5">{t.table.cardholder}</TableHead>
            <TableHead className="min-w-[120px]">{t.table.card}</TableHead>
            <TableHead>{t.table.status}</TableHead>
            <TableHead>{t.table.riskLevel}</TableHead>
            <TableHead>{t.table.submittedDate}</TableHead>
            <TableHead>{t.table.reviewedDate}</TableHead>
            <TableHead>{t.table.reviewer}</TableHead>
            <TableHead className="text-right xl:pr-7.5">{t.table.documents}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {diligences.map((diligence) => (
            <TableRow
              key={diligence.id}
              className="cursor-pointer border-[#eee] dark:border-dark-3 hover:bg-gray-50 dark:hover:bg-dark-2"
              onClick={() => onDiligenceClick(diligence)}
            >
              <TableCell className="min-w-[150px] xl:pl-7.5">
                <p className="font-medium text-dark dark:text-white">
                  {diligence.cardholderName}
                </p>
              </TableCell>

              <TableCell className="min-w-[120px]">
                <p className="text-dark dark:text-white">{diligence.cardNumber}</p>
              </TableCell>

              <TableCell>
                <div
                  className={cn(
                    "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium capitalize",
                    getStatusColor(diligence.status)
                  )}
                >
                  {t.status[diligence.status] ?? diligence.status}
                </div>
              </TableCell>

              <TableCell>
                <div
                  className={cn(
                    "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium capitalize",
                    getRiskLevelColor(diligence.riskLevel)
                  )}
                >
                  {t.risk[diligence.riskLevel]} {t.risk.suffix}
                </div>
              </TableCell>

              <TableCell>
                <p className="text-dark dark:text-white">
                  {formatDate(diligence.submittedDate)}
                </p>
                <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                  {formatTime(diligence.submittedDate)}
                </p>
              </TableCell>

              <TableCell>
                {diligence.reviewedDate ? (
                  <>
                    <p className="text-dark dark:text-white">
                      {formatDate(diligence.reviewedDate)}
                    </p>
                    <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                      {formatTime(diligence.reviewedDate)}
                    </p>
                  </>
                ) : (
                  <p className="text-dark-6 dark:text-dark-6">-</p>
                )}
              </TableCell>

              <TableCell>
                <p className="text-dark dark:text-white">
                  {diligence.reviewer || "-"}
                </p>
              </TableCell>

              <TableCell className="text-right xl:pr-7.5">
                <span className="text-sm text-dark-6 dark:text-dark-6">
                  {diligence.documents} {t.filesSuffix}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export { mockDiligences };

