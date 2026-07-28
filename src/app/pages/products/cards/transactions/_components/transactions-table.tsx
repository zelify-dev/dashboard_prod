"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatLocalDateOnly, formatLocalTimeOnly } from "@/lib/date-utils";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";

export type Transaction = {
  id: string;
  cardNumber: string;
  cardholderName: string;
  amount: number;
  currency: string;
  merchant: string;
  category: "shopping" | "foodAndBeverage" | "transportation" | "electronics" | "cash";
  status: "completed" | "pending" | "declined" | "refunded";
  date: string;
  type: "purchase" | "withdrawal" | "refund";
};

const mockTransactions: Transaction[] = [
  {
    id: "txn_001",
    cardNumber: "**** 4532",
    cardholderName: "John Doe",
    amount: 125.50,
    currency: "USD",
    merchant: "Amazon",
    category: "shopping",
    status: "completed",
    date: "2026-03-09T10:30:00Z",
    type: "purchase",
  },
  {
    id: "txn_002",
    cardNumber: "**** 7890",
    cardholderName: "Jane Smith",
    amount: 45.00,
    currency: "USD",
    merchant: "Starbucks",
    category: "foodAndBeverage",
    status: "completed",
    date: "2026-03-09T08:15:00Z",
    type: "purchase",
  },
  {
    id: "txn_003",
    cardNumber: "**** 4532",
    cardholderName: "John Doe",
    amount: 250.00,
    currency: "USD",
    merchant: "Shell Gas Station",
    category: "transportation",
    status: "pending",
    date: "2026-03-10T14:20:00Z",
    type: "purchase",
  },
  {
    id: "txn_004",
    cardNumber: "**** 1234",
    cardholderName: "Robert Johnson",
    amount: 89.99,
    currency: "USD",
    merchant: "Best Buy",
    category: "electronics",
    status: "declined",
    date: "2026-03-11T16:45:00Z",
    type: "purchase",
  },
  {
    id: "txn_005",
    cardNumber: "**** 7890",
    cardholderName: "Jane Smith",
    amount: 125.50,
    currency: "USD",
    merchant: "Amazon",
    category: "shopping",
    status: "refunded",
    date: "2026-03-12T11:00:00Z",
    type: "refund",
  },
  {
    id: "txn_006",
    cardNumber: "**** 4532",
    cardholderName: "John Doe",
    amount: 500.00,
    currency: "USD",
    merchant: "ATM Withdrawal",
    category: "cash",
    status: "completed",
    date: "2026-03-12T09:30:00Z",
    type: "withdrawal",
  },
];

interface TransactionsTableProps {
  onTransactionClick: (transaction: Transaction) => void;
}

export function TransactionsTable({ onTransactionClick }: TransactionsTableProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].transactions;
  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "bg-[#219653]/[0.08] text-[#219653]";
      case "pending":
        return "bg-[#FFA70B]/[0.08] text-[#FFA70B]";
      case "declined":
        return "bg-[#D34053]/[0.08] text-[#D34053]";
      case "refunded":
        return "bg-[#3B82F6]/[0.08] text-[#3B82F6]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white py-5 px-6">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-100">
            <TableHead className="min-w-[120px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.card}</TableHead>
            <TableHead className="min-w-[150px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.merchant}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.category}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.amount}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.date}</TableHead>
            <TableHead className="text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.status}</TableHead>
            <TableHead className="text-right text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.type}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {mockTransactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/50"
              onClick={() => onTransactionClick(transaction)}
            >
              <TableCell className="min-w-[120px] py-3">
                <h5 className="text-sm font-normal text-dark">{transaction.cardNumber}</h5>
                <p className="mt-[3px] text-xs font-light text-dark-6">
                  {transaction.cardholderName}
                </p>
              </TableCell>

              <TableCell className="min-w-[150px] py-3">
                <p className="text-sm font-light text-dark-6">{transaction.merchant}</p>
              </TableCell>

              <TableCell className="py-3">
                <p className="text-xs font-light text-dark-6">
                  {t.categories[transaction.category] ?? transaction.category}
                </p>
              </TableCell>

              <TableCell className="py-3">
                <p className="text-sm font-normal text-dark">
                  {formatAmount(transaction.amount, transaction.currency)}
                </p>
              </TableCell>

              <TableCell className="py-3">
                <p className="text-xs font-light text-dark">
                  {formatLocalDateOnly(transaction.date)}
                </p>
                <p className="mt-[3px] text-xs font-light text-dark-6">
                  {formatLocalTimeOnly(transaction.date)}
                </p>
              </TableCell>

              <TableCell className="py-3">
                <div
                  className={cn(
                    "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider",
                    transaction.status === "completed" ? "bg-zelify-midnight text-zelify-green" :
                    transaction.status === "pending" ? "bg-orange-50 text-orange-600 border border-orange-200/40" :
                    transaction.status === "declined" ? "bg-red-50 text-red-600 border border-red-200/40" :
                    "bg-gray-100 text-dark-6 border border-gray-200/50"
                  )}
                >
                  {t.status[transaction.status] ?? transaction.status}
                </div>
              </TableCell>

              <TableCell className="text-right py-3">
                <span className="text-xs font-light text-dark-6">
                  {t.types[transaction.type] ?? transaction.type}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export { mockTransactions };
