"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ServiceRegion } from "../../../payments/servicios-basicos/_components/basic-services-config";
import { useInternationalTransfersTranslations } from "./use-international-transfers-translations";

const currencyByRegion: Record<ServiceRegion, string> = {
  mexico: "MXN",
  brasil: "BRL",
  colombia: "COP",
  ecuador: "USD",
  estados_unidos: "USD",
};

const conversionMap: Record<
  ServiceRegion,
  { targetCurrency: string; targetCountry: string; rate: number; locale: string; targetLocale: string }
> = {
  mexico: { targetCurrency: "USD", targetCountry: "United States", rate: 0.058, locale: "es-MX", targetLocale: "en-US" },
  brasil: { targetCurrency: "COP", targetCountry: "Colombia", rate: 780, locale: "pt-BR", targetLocale: "es-CO" },
  colombia: { targetCurrency: "USD", targetCountry: "United States", rate: 0.00026, locale: "es-CO", targetLocale: "en-US" },
  ecuador: { targetCurrency: "EUR", targetCountry: "Europe", rate: 0.92, locale: "es-EC", targetLocale: "es-ES" },
  estados_unidos: { targetCurrency: "COP", targetCountry: "Colombia", rate: 3820, locale: "en-US", targetLocale: "es-CO" },
};

const formatCurrency = (value: number, currencyCode: string, locale = "es-MX") => {
  if (Number.isNaN(value)) return `0 ${currencyCode}`;
  return new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode, minimumFractionDigits: 2 }).format(value);
};

const formatExchangeRateValue = (value: number, locale = "en-US") => {
  const hasUnitPriceGreaterThanOne = value >= 1;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: hasUnitPriceGreaterThanOne ? 0 : 4,
    maximumFractionDigits: hasUnitPriceGreaterThanOne ? 2 : 4,
  }).format(value);
};

const formatExchangeRateText = (fromCurrency: string, toCurrency: string, rate: number, locale = "en-US") =>
  `1 ${fromCurrency} = ${formatExchangeRateValue(rate, locale)} ${toCurrency}`;

const RECIPIENTS: Array<{
  id: string;
  name: string;
  alias: string;
  bank: string;
  avatar: string;
  region: ServiceRegion;
}> = [
  {
    id: "lucia",
    name: "Lucía Gómez",
    alias: "@lucia.g",
    bank: "Banco Azteca · Mexico",
    avatar: "LG",
    region: "mexico",
  },
  {
    id: "mateo",
    name: "Mateo Rivas",
    alias: "@mateo",
    bank: "Colombia · Bancolombia",
    avatar: "MR",
    region: "mexico",
  },
  {
    id: "Juan",
    name: "Juan Pablo",
    alias: "@JP ",
    bank: "Chase · USA",
    avatar: "JP",
    region: "estados_unidos",
  },
  {
    id: "valentina",
    name: "Valentina Duarte",
    alias: "@vale",
    bank: "Itaú · Brazil",
    avatar: "VD",
    region: "brasil",
  },
  {
    id: "sebastian",
    name: "Sebastián Torres",
    alias: "@stw",
    bank: "Banco de Bogotá · Colombia",
    avatar: "ST",
    region: "colombia",
  },
  {
    id: "paula",
    name: "Paula Suárez",
    alias: "@paulas",
    bank: "Bancolombia · Colombia",
    avatar: "PS",
    region: "colombia",
  },
  {
    id: "andres",
    name: "Andrés Molina",
    alias: "@amolina",
    bank: "Banco Davivienda · Colombia",
    avatar: "AM",
    region: "colombia",
  },
];

type TransactionStatus = "completed" | "pending" | "failed";

type TransactionHistoryItem = {
  id: string;
  name: string;
  date: string;
  status: TransactionStatus;
  bank: string;
  reference: string;
  note: string;
  fee: string;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  conversionRate: number;
  region: ServiceRegion;
};

const TRANSACTION_HISTORY: TransactionHistoryItem[] = [
  {
    id: "t1",
    name: "Lucía Gómez",
    date: "Dec 12, 12:35",
    status: "completed",
    bank: "Banco Azteca · Mexico",
    reference: "ZW-985443",
    note: "Weekly payroll",
    fee: "$5.50 MXN",
    sendAmount: 1250,
    sendCurrency: "MXN",
    receiveAmount: 72.5,
    receiveCurrency: "USD",
    conversionRate: 0.058,
    region: "mexico",
  },
  {
    id: "t2",
    name: "Mateo Rivas",
    date: "Dec 11, 09:12",
    status: "pending",
    bank: "Colombia · Bancolombia",
    reference: "ZW-982131",
    note: "Sales advance",
    fee: "$4.10 COP",
    sendAmount: 850,
    sendCurrency: "MXN",
    receiveAmount: 49.3,
    receiveCurrency: "USD",
    conversionRate: 0.00027,
    region: "colombia",
  },
  {
    id: "t3",
    name: "Valentina Duarte",
    date: "Dec 09, 18:20",
    status: "completed",
    bank: "Itaú · Brazil",
    reference: "ZW-981456",
    note: "Professional fees",
    fee: "R$8.00 BRL",
    sendAmount: 2350,
    sendCurrency: "BRL",
    receiveAmount: 1833000,
    receiveCurrency: "COP",
    conversionRate: 780,
    region: "brasil",
  },
  {
    id: "t4",
    name: "Sebastián Torres",
    date: "Dec 06, 15:47",
    status: "failed",
    bank: "Banco de Bogotá · Colombia",
    note: "Partial payment",
    reference: "ZW-975612",
    fee: "$7.25 USD",
    sendAmount: 1100,
    sendCurrency: "USD",
    receiveAmount: 4200000,
    receiveCurrency: "COP",
    conversionRate: 3820,
    region: "estados_unidos",
  },
  {
    id: "t5",
    name: "Lucía Gómez",
    date: "Dec 04, 08:13",
    status: "completed",
    bank: "Banco Azteca · Mexico",
    reference: "ZW-973948",
    note: "Internal reimbursement",
    fee: "$3.90 MXN",
    sendAmount: 900,
    sendCurrency: "MXN",
    receiveAmount: 52.2,
    receiveCurrency: "USD",
    conversionRate: 0.058,
    region: "mexico",
  },
    {
    id: "t6",
    name: "Juan Pablo",
    date: "Dec 11, 09:12",
    status: "pending",
    bank: "Chase · USA",
    reference: "ZW-982131",
    note: "Sales advance",
    fee: "$4.10 COP",
    sendAmount: 850,
    sendCurrency: "MXN",
    receiveAmount: 49.3,
    receiveCurrency: "USD",
    conversionRate: 3820,
    region: "colombia",
  },
];

type Screen = "amount" | "recipients" | "summary" | "processing" | "success" | "history-detail";

export function InternationalTransfersPreviewPanel({ region }: { region: ServiceRegion }) {
  const translations = useInternationalTransfersTranslations();
  const [screen, setScreen] = useState<Screen>("amount");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState(translations.preview.defaultNote);
  const [confirmProgress, setConfirmProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const currency = currencyByRegion[region];
  const [selectedRecipient, setSelectedRecipient] = useState<typeof RECIPIENTS[number] | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<TransactionHistoryItem | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const filteredHistory = useMemo(() => TRANSACTION_HISTORY.filter((tx) => tx.region === region), [region]);
  const filteredRecipients = useMemo(() => RECIPIENTS.filter((recipient) => recipient.region !== region), [region]);
  const conversionDetails = useMemo(() => {
    const info = conversionMap[region];
    const parsedAmount = parseFloat(amount || "0");
    const sendAmountValue = Number.isFinite(parsedAmount) ? parsedAmount : 0;
    const receiveAmountValue = sendAmountValue * info.rate;
    return {
      sendAmountValue,
      receiveAmountValue,
      info,
    };
  }, [amount, region]);

  const handleRecipientSelect = (recipient: typeof RECIPIENTS[number]) => {
    setSelectedRecipient(recipient);
    setConfirmProgress(0);
    setScreen("summary");
  };

  const goBack = () => {
    if (screen === "recipients") setScreen("amount");
    else if (screen === "summary") {
      setConfirmProgress(0);
      setScreen("recipients");
    } else if (screen === "success") {
      setScreen("amount");
      setSelectedRecipient(null);
      setAmount("");
      setConfirmProgress(0);
    } else if (screen === "history-detail") {
      setScreen("amount");
      setSelectedHistory(null);
    } else if (screen === "processing") {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      setScreen("summary");
    }
  };

  const handleConfirm = () => {
    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
    setScreen("processing");
    processingTimeoutRef.current = setTimeout(() => {
      setScreen("success");
      processingTimeoutRef.current = null;
    }, 3000);
  };

  const getProgressFromPosition = (clientX: number) => {
    const track = sliderRef.current;
    if (!track) return 0;
    const { left, width } = track.getBoundingClientRect();
    const relative = Math.min(Math.max(clientX - left, 0), width);
    return (relative / width) * 100;
  };

  useEffect(() => {
    if (!isSliding) return;

    const handlePointerMove = (event: PointerEvent) => {
      setConfirmProgress(getProgressFromPosition(event.clientX));
    };

    const handlePointerUp = () => {
      setIsSliding(false);
      if (confirmProgress >= 95) {
        setConfirmProgress(100);
        setTimeout(() => {
          handleConfirm();
          setConfirmProgress(0);
        }, 200);
      } else {
        setConfirmProgress(0);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isSliding, confirmProgress]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const updateDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    updateDarkMode();

    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedRecipient && selectedRecipient.region === region) {
      setSelectedRecipient(null);
      if (screen === "summary") setScreen("recipients");
    }
  }, [region, screen, selectedRecipient]);

  const statusStyles: Record<TransactionStatus, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    failed: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  };

  // Update note when translations change (only if it's the default value)
  useEffect(() => {
    const defaultNotes = ["Weekly payment", "Pago semanal"];
    if (defaultNotes.includes(note)) {
      setNote(translations.preview.defaultNote);
    }
  }, [translations.preview.defaultNote]);

  const renderAmountScreen = () => (
    <div className="flex h-full flex-col">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">{translations.preview.amount.tag}</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{translations.preview.amount.title}</h2>
          <p className="text-sm text-slate-500 dark:text-white/60">{translations.preview.amount.subtitle}</p>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase text-slate-600 dark:text-white/50">{translations.preview.amount.amountLabel}</label>
          <div className="relative rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/15 dark:bg-black/30">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-3xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-white/30 pr-28"
            />
            <div className="absolute inset-y-0 right-3 flex items-center gap-2">
              <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900 dark:bg-white/10 dark:text-white">
                {currency}
              </span>
              <button
                onClick={() => setScreen("recipients")}
                disabled={!amount}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary transition hover:border-primary/60 disabled:opacity-40 dark:border-white/10 dark:bg-white/10"
                aria-label={translations.preview.amount.recipientAria}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 10h9" strokeLinecap="round" />
                  <path d="M12 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 10l14-7-4 14-3-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-auto space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-white/50">{translations.preview.amount.historyTag}</p>
              <p className="text-sm text-slate-600 dark:text-white/60">{translations.preview.amount.historyTitle}</p>
            </div>
            <span className="text-xs font-medium text-primary">{translations.preview.amount.viewAll}</span>
          </div>
          <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
            {filteredHistory.map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => {
                  setSelectedHistory(tx);
                  setScreen("history-detail");
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-100/80 bg-slate-50/80 px-3 py-2 text-left transition hover:border-primary/60 focus:outline-none dark:border-white/5 dark:bg-white/5"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{tx.name}</p>
                  <p className="text-xs text-slate-500 dark:text-white/60">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    -
                    {formatCurrency(tx.sendAmount, tx.sendCurrency, conversionMap[tx.region]?.locale ?? "es-MX")}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusStyles[tx.status]}`}
                  >
                    {translations.preview.statuses[tx.status]}
                  </span>
                </div>
              </button>
            ))}
            {filteredHistory.length === 0 && (
              <p className="text-center text-xs text-slate-500 dark:text-white/60">{translations.preview.amount.empty}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecipientsScreen = () => (
    <div className="flex h-full flex-col space-y-4">
      <button onClick={goBack} className="text-sm text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">
        {translations.preview.recipients.back}
      </button>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">{translations.preview.recipients.tag}</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{translations.preview.recipients.title}</h2>
      </div>
      <div className="space-y-3">
        {filteredRecipients.map((recipient) => (
          <button
            key={recipient.id}
            onClick={() => handleRecipientSelect(recipient)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 transition hover:border-primary/60 dark:border-white/10 dark:bg-black/30 dark:text-white"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold dark:bg-white/15">
                {recipient.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold">{recipient.name}</p>
                <p className="text-xs text-slate-500 dark:text-white/60">
                  {recipient.alias} · {recipient.bank}
                </p>
              </div>
            </div>
            <span className="text-xs text-primary">{translations.preview.recipients.selectAction}</span>
          </button>
        ))}
        {filteredRecipients.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-white/60">{translations.preview.recipients.empty}</p>
        )}
      </div>
    </div>
  );

  const renderSummaryScreen = () => (
    <div className="flex h-full flex-col space-y-4">
      <button onClick={goBack} className="text-sm text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">
        {translations.preview.summary.back}
      </button>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">{translations.preview.summary.tag}</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{translations.preview.summary.title}</h2>
        <p className="text-sm text-slate-500 dark:text-white/60">{translations.preview.summary.subtitle}</p>
      </div>
      {selectedRecipient && (
        <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/35 dark:shadow-none">
          <div className="space-y-4 pb-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-white/50">{translations.preview.summary.recipientLabel}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedRecipient.name}</p>
              <p className="text-xs text-slate-500 dark:text-white/60">{selectedRecipient.bank}</p>
            </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-white/50">{translations.preview.summary.amountLabel}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {amount || "0.00"} {currency}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">{translations.preview.summary.youSend}</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(
                  conversionDetails.sendAmountValue,
                  currency,
                  conversionDetails.info.locale
                )}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">{translations.preview.summary.exchangeRate}</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {formatExchangeRateText(currency, conversionDetails.info.targetCurrency, conversionDetails.info.rate, conversionDetails.info.targetLocale)}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">{translations.preview.summary.receivedIn} {conversionDetails.info.targetCountry}</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-300">
                {formatCurrency(
                  conversionDetails.receiveAmountValue,
                  conversionDetails.info.targetCurrency,
                  conversionDetails.info.targetLocale
                )}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-white/50">{translations.preview.summary.noteLabel}</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none dark:border-transparent dark:bg-white/10 dark:text-white"
            />
          </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wide dark:text-white/50">{translations.preview.summary.confirmLabel}</p>
        <div
          className="relative h-12 w-full select-none rounded-2xl border border-slate-200 bg-white dark:border-white/15 dark:bg-white/5"
          ref={sliderRef}
          onPointerDown={(event) => {
            setConfirmProgress(getProgressFromPosition(event.clientX));
            setIsSliding(true);
          }}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-2xl bg-gradient-to-r transition-all ${
              confirmProgress > 0 ? "from-emerald-400 to-emerald-500" : "from-primary to-primary/80"
            }`}
            style={{ width: `${confirmProgress}%` }}
          ></div>
          <div className="relative z-10 flex h-full items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-white/80">
            {confirmProgress >= 95 ? translations.preview.summary.releaseToConfirm : translations.preview.summary.slideToConfirm}
          </div>
          <div
            className="absolute top-1 bottom-1 flex w-11 items-center justify-center rounded-xl bg-white text-primary shadow-lg text-xs font-bold"
            style={{ transform: `translateX(calc(${confirmProgress}% - 0.5rem))` }}
          >
            ▶
          </div>
        </div>
      </div>
  </div>
  );

  const renderProcessingScreen = () => (
    <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500 dark:text-white/60">{translations.preview.processing.tag}</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{translations.preview.processing.title}</h2>
        <p className="text-sm text-slate-500 dark:text-white/60">{translations.preview.processing.subtitle}</p>
      </div>
    </div>
  );

  const renderHistoryDetailScreen = () => {
    if (!selectedHistory) return null;
    return (
      <div className="flex h-full flex-col">
        <button onClick={goBack} className="mb-4 text-sm text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">
          {translations.preview.historyDetail.back}
        </button>
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">{translations.preview.historyDetail.tag}</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{translations.preview.historyDetail.titlePrefix} {selectedHistory.name}</h2>
            <p className="text-sm text-slate-500 dark:text-white/60">{selectedHistory.date}</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/35 dark:shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60">{translations.preview.historyDetail.amountSent}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(
                    selectedHistory.sendAmount,
                    selectedHistory.sendCurrency,
                    conversionMap[selectedHistory.region]?.locale ?? "es-MX"
                  )}
                </p>
              </div>
              <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[selectedHistory.status]}`}
            >
              {translations.preview.statuses[selectedHistory.status]}
            </span>
            </div>
            <div className="rounded-2xl border border-slate-100/60 bg-white/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">{translations.preview.historyDetail.receives}</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-300">
                  {formatCurrency(
                    selectedHistory.receiveAmount,
                    selectedHistory.receiveCurrency,
                    conversionMap[selectedHistory.region]?.targetLocale ?? "es-MX"
                  )}
                </p>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-white/60">
                {translations.preview.historyDetail.exchangeRateLabel}{" "}
                {formatExchangeRateText(
                  selectedHistory.sendCurrency,
                  selectedHistory.receiveCurrency,
                  selectedHistory.conversionRate,
                  conversionMap[selectedHistory.region]?.targetLocale ?? "en-US"
                )}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">{translations.preview.historyDetail.recipientLabel}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedHistory.name}</p>
              <p className="text-sm text-slate-500 dark:text-white/60">{selectedHistory.bank}</p>
            </div>
            <dl className="space-y-2 text-sm text-slate-600 dark:text-white/70">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">{translations.preview.historyDetail.reference}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{selectedHistory.reference}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">{translations.preview.historyDetail.purpose}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{selectedHistory.note}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">{translations.preview.historyDetail.fee}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{selectedHistory.fee}</dd>
              </div>
            </dl>
          </div>
          <div className="space-y-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-primary/60 dark:border-white/20 dark:text-white dark:hover:border-white/40">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 5l6 4-6 4-6-4 6-4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 9v6l6 4 6-4V9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 13l6-4" />
              </svg>
              {translations.preview.historyDetail.share}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessScreen = () => (
    <div className="flex h-full flex-col items-center justify-center space-y-4 text-center text-slate-900 dark:text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-200/70 text-emerald-700 dark:bg-green-400/30 dark:text-green-300">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold">{translations.preview.success.title}</h2>
        <p className="text-sm text-slate-500 dark:text-white/60">{translations.preview.success.subtitle}</p>
      </div>
      <button
        onClick={goBack}
        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-400 dark:border-white/30 dark:text-white dark:hover:border-white"
      >
        {translations.preview.success.cta}
      </button>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case "amount":
        return renderAmountScreen();
      case "recipients":
        return renderRecipientsScreen();
      case "summary":
        return renderSummaryScreen();
      case "processing":
        return renderProcessingScreen();
      case "success":
        return renderSuccessScreen();
      case "history-detail":
        return renderHistoryDetailScreen();
    }
  };

  const phoneBodyClasses = `flex-1 min-h-0 px-6 py-6 ${isDarkMode ? "bg-[#05070F] text-white" : "bg-slate-50 text-slate-900"}`;

  return (
    <div className="rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-dark dark:text-white">{translations.preview.title}</h2>
      </div>
      <div className="relative -mx-6 w-[calc(100%+3rem)] py-12">
        <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ minHeight: "850px" }}>
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 1) 50%, rgba(15, 23, 42, 0.95) 100%)"
                : "linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 1) 50%, rgba(241, 245, 249, 0.95) 100%)",
            }}
          ></div>
          <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
          <EdgeFadeOverlay isDarkMode={isDarkMode} />
        </div>
        <div className="relative mx-auto max-w-[340px] z-10">
          <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
              <div className="relative flex items-center justify-between bg-white dark:bg-black px-6 pt-10 pb-2 flex-shrink-0">
                <div className="absolute left-6 top-4 flex items-center">
                  <span className="text-xs font-semibold text-black dark:text-white">9:41</span>
                </div>
                <div className="absolute left-1/2 top-3 -translate-x-1/2">
                  <div className="h-5 w-24 rounded-full bg-black dark:bg-white/20"></div>
                  <div className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-white/30"></div>
                </div>
                <div className="absolute right-6 top-4 flex items-center gap-1.5">
                  <svg className="h-3 w-5" fill="none" viewBox="0 0 20 12">
                    <path d="M1 8h2v2H1V8zm3-2h2v4H4V6zm3-2h2v6H7V4zm3-1h2v7h-2V3z" fill="currentColor" className="text-black dark:text-white" />
                  </svg>
                  <div className="h-2.5 w-6 rounded-sm border border-black dark:border-white">
                    <div className="h-full w-4/5 rounded-sm bg-black dark:bg-white"></div>
                  </div>
                </div>
              </div>

              <div className={phoneBodyClasses}>
                {renderScreen()}
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-shrink-0">
                <div className="h-1 w-32 rounded-full bg-black/30 dark:bg-white/30"></div>
              </div>
            </div>
            <div className="absolute -left-1 top-24 h-12 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
            <div className="absolute -left-1 top-40 h-8 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
            <div className="absolute -right-1 top-32 h-10 w-1 rounded-r bg-gray-800 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedHalftoneBackdrop({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const render = (time: number) => {
      const spacing = 26;
      const waveFrequency = 1.35;
      const waveSpeed = 0.35;
      const { width, height } = canvas;
      const logicalWidth = width / dpr;
      const logicalHeight = height / dpr;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const [r, g, b] = isDarkMode ? [255, 255, 255] : [70, 85, 110];
      const minAlpha = isDarkMode ? 0.06 : 0.1;
      const maxAlpha = isDarkMode ? 0.45 : 0.5;

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase = (normalizedDistance * waveFrequency - (time / 1000) * waveSpeed) * Math.PI * 2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (minAlpha + pulse * maxAlpha) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.2 + pulse * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDarkMode]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function EdgeFadeOverlay({ isDarkMode }: { isDarkMode: boolean }) {
  const fadeColor = isDarkMode ? "rgba(8,11,25,1)" : "rgba(250,252,255,1)";
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[2.5rem]"
      style={{
        background: `radial-gradient(circle at center, rgba(0,0,0,0) 60%, ${fadeColor} 100%)`,
      }}
    />
  );
}
