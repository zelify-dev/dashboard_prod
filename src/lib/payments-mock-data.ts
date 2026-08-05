/**
 * Mock Data & Types for Payments, Transfers and Payment Disbursements.
 * Tied with real organization members structure.
 */

export type TransferStatus = "COMPLETED" | "PENDING" | "PROCESSING" | "REJECTED" | "CANCELLED";

export interface TransferItem {
  id: string;
  reference: string;
  speiKey: string;
  userName: string;
  userEmail: string;
  userId: string;
  sourceAccount: string;
  sourceBank: string;
  destinationAccount: string;
  destinationBank: string;
  amount: number;
  currency: "MXN";
  status: TransferStatus;
  createdAt: string;
  processedAt: string | null;
  concept: string;
  fee: number;
  vat: number;
}

export type DisbursementStatus =
  | "DRAFT"
  | "PENDING_PROCESSING"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface DisbursementBeneficiary {
  id: string;
  name: string;
  clabe: string;
  bank: string;
  amount: number;
  concept: string;
}

export interface DisbursementItem {
  id: string;
  name: string;
  sourceAccount: string;
  sourceBank: string;
  beneficiariesCount: number;
  totalAmount: number;
  currency: "MXN";
  status: DisbursementStatus;
  createdAt: string;
  processedAt: string | null;
  createdByName: string;
  createdByEmail: string;
  beneficiaries: DisbursementBeneficiary[];
}

export const MEXICAN_BANKS = [
  "BBVA México",
  "Banorte",
  "Santander México",
  "Citibanamex",
  "HSBC México",
  "STP (Sistema de Transferencias y Pagos)",
  "Scotiabank",
  "Banco Azteca",
  "Inbursa",
  "Nu México",
  "Mercado Pago",
  "Spin by OXXO",
  "Bancoppel",
];

export const SOURCE_ACCOUNTS_MOCK = [
  {
    id: "acc-1",
    label: "STP Corporativo - CLABE 012180015489201948",
    clabe: "012180015489201948",
    bank: "STP (Sistema de Transferencias y Pagos)",
    balance: 4580250.0,
  },
  {
    id: "acc-2",
    label: "BBVA Principal - CLABE 012180019284719283",
    clabe: "012180019284719283",
    bank: "BBVA México",
    balance: 1850000.0,
  },
  {
    id: "acc-3",
    label: "Banorte Tesorería - CLABE 072180008492018492",
    clabe: "072180008492018492",
    bank: "Banorte",
    balance: 920400.0,
  },
];

export const INITIAL_TRANSFERS_MOCK: TransferItem[] = [
  {
    id: "TRF-2026-001",
    reference: "TRF-8941201",
    speiKey: "2026080440014B780001",
    userName: "Juan Pérez",
    userEmail: "admin@pegala.com",
    userId: "usr-1",
    sourceAccount: "012180015489201948",
    sourceBank: "STP",
    destinationAccount: "012180098471625341",
    destinationBank: "BBVA México",
    amount: 25450.0,
    currency: "MXN",
    status: "COMPLETED",
    createdAt: "2026-08-04T14:32:00Z",
    processedAt: "2026-08-04T14:32:45Z",
    concept: "Pago de honorarios desarrollo",
    fee: 5.0,
    vat: 0.8,
  },
  {
    id: "TRF-2026-002",
    reference: "TRF-8941202",
    speiKey: "2026080440014B780002",
    userName: "María García",
    userEmail: "maria.garcia@zelify.com",
    userId: "usr-2",
    sourceAccount: "012180019284719283",
    sourceBank: "BBVA México",
    destinationAccount: "072180009182736451",
    destinationBank: "Banorte",
    amount: 14200.5,
    currency: "MXN",
    status: "COMPLETED",
    createdAt: "2026-08-04T16:10:00Z",
    processedAt: "2026-08-04T16:11:10Z",
    concept: "Reembolso de viáticos",
    fee: 5.0,
    vat: 0.8,
  },
  {
    id: "TRF-2026-003",
    reference: "TRF-8941203",
    speiKey: "2026080540014B780003",
    userName: "Carlos Rodríguez",
    userEmail: "carlos.rodriguez@zelify.com",
    userId: "usr-3",
    sourceAccount: "012180015489201948",
    sourceBank: "STP",
    destinationAccount: "014180008493019284",
    destinationBank: "Santander México",
    amount: 85000.0,
    currency: "MXN",
    status: "PROCESSING",
    createdAt: "2026-08-05T10:15:00Z",
    processedAt: null,
    concept: "Pago factura licencias cloud",
    fee: 5.0,
    vat: 0.8,
  },
  {
    id: "TRF-2026-004",
    reference: "TRF-8941204",
    speiKey: "2026080540014B780004",
    userName: "Ana Martínez",
    userEmail: "ana.martinez@zelify.com",
    userId: "usr-4",
    sourceAccount: "072180008492018492",
    sourceBank: "Banorte",
    destinationAccount: "002180018273645192",
    destinationBank: "Citibanamex",
    amount: 3200.0,
    currency: "MXN",
    status: "PENDING",
    createdAt: "2026-08-05T12:00:00Z",
    processedAt: null,
    concept: "Suscripción servicio API",
    fee: 5.0,
    vat: 0.8,
  },
  {
    id: "TRF-2026-005",
    reference: "TRF-8941205",
    speiKey: "2026080340014B780005",
    userName: "Juan Pérez",
    userEmail: "admin@pegala.com",
    userId: "usr-1",
    sourceAccount: "012180015489201948",
    sourceBank: "STP",
    destinationAccount: "638180000192837465",
    destinationBank: "Nu México",
    amount: 125000.0,
    currency: "MXN",
    status: "REJECTED",
    createdAt: "2026-08-03T18:40:00Z",
    processedAt: "2026-08-03T18:41:00Z",
    concept: "Transferencia a cuenta invalida",
    fee: 0.0,
    vat: 0.0,
  },
  {
    id: "TRF-2026-006",
    reference: "TRF-8941206",
    speiKey: "2026080240014B780006",
    userName: "Sofía López",
    userEmail: "sofia.lopez@zelify.com",
    userId: "usr-5",
    sourceAccount: "012180019284719283",
    sourceBank: "BBVA México",
    destinationAccount: "012180018293049581",
    destinationBank: "BBVA México",
    amount: 54000.0,
    currency: "MXN",
    status: "CANCELLED",
    createdAt: "2026-08-02T11:20:00Z",
    processedAt: "2026-08-02T11:25:00Z",
    concept: "Operación cancelada por el usuario",
    fee: 0.0,
    vat: 0.0,
  },
];

export const INITIAL_DISBURSEMENTS_MOCK: DisbursementItem[] = [
  {
    id: "DISP-2026-091",
    name: "Dispersión Nómina Quincena 15 Agosto",
    sourceAccount: "012180015489201948",
    sourceBank: "STP (Sistema de Transferencias y Pagos)",
    beneficiariesCount: 2,
    totalAmount: 9850.0,
    currency: "MXN",
    status: "COMPLETED",
    createdAt: "2026-08-01T09:00:00Z",
    processedAt: "2026-08-01T09:15:30Z",
    createdByName: "Juan Pérez",
    createdByEmail: "admin@pegala.com",
    beneficiaries: [
      {
        id: "b-1",
        name: "Carlos Ruiz Morales",
        clabe: "012180015489201901",
        bank: "BBVA México",
        amount: 4850.0,
        concept: "Nomina Quincenal 15 Ago",
      },
      {
        id: "b-2",
        name: "Laura Gómez Mendoza",
        clabe: "072180008492018902",
        bank: "Banorte",
        amount: 5000.0,
        concept: "Nomina Quincenal 15 Ago",
      },
    ],
  },
  {
    id: "DISP-2026-092",
    name: "Pago a Proveedores de Servicios Q3",
    sourceAccount: "012180019284719283",
    sourceBank: "BBVA México",
    beneficiariesCount: 2,
    totalAmount: 6200.0,
    currency: "MXN",
    status: "COMPLETED",
    createdAt: "2026-08-03T11:30:00Z",
    processedAt: "2026-08-03T11:45:00Z",
    createdByName: "María García",
    createdByEmail: "maria.garcia@zelify.com",
    beneficiaries: [
      {
        id: "b-3",
        name: "Servicios Cloud Latam S.A. de C.V.",
        clabe: "014180008493019203",
        bank: "Santander México",
        amount: 2200.0,
        concept: "Factura A-98401 Infrastructure",
      },
      {
        id: "b-4",
        name: "Seguridad Digital México",
        clabe: "002180018273645104",
        bank: "Citibanamex",
        amount: 4000.0,
        concept: "Licencias de Ciberseguridad 2026",
      },
    ],
  },
  {
    id: "DISP-2026-093",
    name: "Reembolso Comisiones de Afiliación",
    sourceAccount: "072180008492018492",
    sourceBank: "Banorte",
    beneficiariesCount: 1,
    totalAmount: 4150.0,
    currency: "MXN",
    status: "PROCESSING",
    createdAt: "2026-08-05T08:00:00Z",
    processedAt: null,
    createdByName: "Carlos Rodríguez",
    createdByEmail: "carlos.rodriguez@zelify.com",
    beneficiaries: [
      {
        id: "b-5",
        name: "Comercializadora del Norte",
        clabe: "012180018293049505",
        bank: "BBVA México",
        amount: 4150.0,
        concept: "Reembolso comisiones afiliacion",
      },
    ],
  },
  {
    id: "DISP-2026-094",
    name: "Dispersión Bonos de Desempeño",
    sourceAccount: "012180015489201948",
    sourceBank: "STP (Sistema de Transferencias y Pagos)",
    beneficiariesCount: 1,
    totalAmount: 2348.0,
    currency: "MXN",
    status: "PENDING_PROCESSING",
    createdAt: "2026-08-05T13:20:00Z",
    processedAt: null,
    createdByName: "Juan Pérez",
    createdByEmail: "admin@pegala.com",
    beneficiaries: [
      {
        id: "b-6",
        name: "Ana Martínez López",
        clabe: "638180000192837406",
        bank: "Nu México",
        amount: 2348.0,
        concept: "Bono Desempeño Trimestre",
      },
    ],
  },
  {
    id: "DISP-2026-095",
    name: "Pago Lote Viáticos Ventas",
    sourceAccount: "012180019284719283",
    sourceBank: "BBVA México",
    beneficiariesCount: 1,
    totalAmount: 800.0,
    currency: "MXN",
    status: "PARTIALLY_COMPLETED",
    createdAt: "2026-08-04T15:10:00Z",
    processedAt: "2026-08-04T15:40:00Z",
    createdByName: "Sofía López",
    createdByEmail: "sofia.lopez@zelify.com",
    beneficiaries: [
      {
        id: "b-7",
        name: "Pedro Ramírez",
        clabe: "012180018293049507",
        bank: "BBVA México",
        amount: 800.0,
        concept: "Viáticos Conferencia CDMX",
      },
    ],
  },
  {
    id: "DISP-2026-096",
    name: "Dispersión Pruebas Integración",
    sourceAccount: "012180015489201948",
    sourceBank: "STP (Sistema de Transferencias y Pagos)",
    beneficiariesCount: 1,
    totalAmount: 500.0,
    currency: "MXN",
    status: "REJECTED",
    createdAt: "2026-08-02T16:00:00Z",
    processedAt: "2026-08-02T16:05:00Z",
    createdByName: "Juan Pérez",
    createdByEmail: "admin@pegala.com",
    beneficiaries: [
      {
        id: "b-8",
        name: "Prueba Integración",
        clabe: "012180015489201999",
        bank: "STP",
        amount: 500.0,
        concept: "Prueba sistema",
      },
    ],
  },
];

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " MXN";
}

export function validateClabeMexico(clabe: string): boolean {
  const clean = clabe.trim();
  if (!/^\d{18}$/.test(clean)) return false;
  return true;
}
