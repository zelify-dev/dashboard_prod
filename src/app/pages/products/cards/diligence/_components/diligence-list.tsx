"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";
import { formatLocalDateOnly, formatLocalTimeOnly } from "@/lib/date-utils";
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
    submittedDate: "2026-03-09T09:00:00Z",
    reviewedDate: "2026-03-11T14:30:00Z",
    reviewer: "Sarah Johnson",
    riskLevel: "low",
    documents: 5,
  },
  {
    id: "dil_002",
    cardholderName: "Jane Smith",
    cardNumber: "**** 7890",
    status: "in_review",
    submittedDate: "2026-03-10T11:20:00Z",
    riskLevel: "medium",
    documents: 7,
  },
  {
    id: "dil_003",
    cardholderName: "Robert Johnson",
    cardNumber: "**** 1234",
    status: "rejected",
    submittedDate: "2026-03-12T15:45:00Z",
    reviewedDate: "2026-03-13T10:15:00Z",
    reviewer: "Michael Brown",
    riskLevel: "high",
    documents: 3,
  },
  {
    id: "dil_004",
    cardholderName: "Emily Davis",
    cardNumber: "**** 5678",
    status: "pending",
    submittedDate: "2026-03-14T08:30:00Z",
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
    <div className="rounded-2xl border border-gray-100 bg-white py-5 px-6" data-tour-id="tour-cards-diligence-list">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-100">
            <TableHead className="min-w-[150px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.cardholder}</TableHead>
            <TableHead className="min-w-[120px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.card}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.status}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.riskLevel}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.submittedDate}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.reviewedDate}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.reviewer}</TableHead>
            <TableHead className="text-right text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.documents}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {diligences.map((diligence) => (
            <TableRow
              key={diligence.id}
              className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/50"
              onClick={() => onDiligenceClick(diligence)}
            >
              <TableCell className="min-w-[150px] py-3">
                <p className="text-sm font-normal text-dark">
                  {diligence.cardholderName}
                </p>
              </TableCell>

              <TableCell className="min-w-[120px] py-3">
                <p className="text-sm font-light text-dark-6">{diligence.cardNumber}</p>
              </TableCell>

              <TableCell className="py-3">
                <div
                  className={cn(
                    "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider",
                    diligence.status === "approved" ? "bg-zelify-midnight text-zelify-green" :
                    diligence.status === "in_review" ? "bg-orange-50 text-orange-600 border border-orange-200/40" :
                    diligence.status === "rejected" ? "bg-red-50 text-red-600 border border-red-200/40" :
                    "bg-gray-100 text-dark-6 border border-gray-200/50"
                  )}
                >
                  {t.status[diligence.status] ?? diligence.status}
                </div>
              </TableCell>

              <TableCell className="py-3">
                <div
                  className={cn(
                    "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider",
                    diligence.riskLevel === "low" ? "bg-zelify-midnight text-zelify-green" :
                    diligence.riskLevel === "medium" ? "bg-orange-50 text-orange-600 border border-orange-200/40" :
                    "bg-red-50 text-red-600 border border-red-200/40"
                  )}
                >
                  {t.risk[diligence.riskLevel]} {t.risk.suffix}
                </div>
              </TableCell>

              <TableCell className="py-3">
                <p className="text-xs font-light text-dark">
                  {formatLocalDateOnly(diligence.submittedDate)}
                </p>
                <p className="mt-[3px] text-xs font-light text-dark-6">
                  {formatLocalTimeOnly(diligence.submittedDate)}
                </p>
              </TableCell>

              <TableCell className="py-3">
                {diligence.reviewedDate ? (
                  <>
                    <p className="text-xs font-light text-dark">
                      {formatLocalDateOnly(diligence.reviewedDate)}
                    </p>
                    <p className="mt-[3px] text-xs font-light text-dark-6">
                      {formatLocalTimeOnly(diligence.reviewedDate)}
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-light text-dark-6">-</p>
                )}
              </TableCell>

              <TableCell className="py-3">
                <p className="text-sm font-light text-dark-6">
                  {diligence.reviewer || "-"}
                </p>
              </TableCell>

              <TableCell className="text-right py-3">
                <span className="text-xs font-light text-dark-6">
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

