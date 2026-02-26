"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../_components/cards-translations";
import { TransactionsTable, Transaction } from "./_components/transactions-table";
import { TransactionDetail } from "./_components/transaction-detail";

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
    date: "2024-01-15T10:30:00Z",
    type: "purchase",
  },
];

export default function CardsTransactionsPage() {
  const { language } = useLanguage();
  const t = cardsTranslations[language].transactions;
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={t.pageTitle} />
      <div className="mt-6" data-tour-id="tour-cards-transactions">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{t.title}</h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">{t.desc}</p>
        </div>
        <TransactionsTable onTransactionClick={setSelectedTransaction} />
      </div>
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}


