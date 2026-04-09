"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../_components/cards-translations";
import { CardUsersTable } from "./_components/card-users-table";
import { CardUserDetail } from "./_components/card-user-detail";
import type { CardUser } from "./_components/card-user-types";

const mockCardUsers: CardUser[] = [
  {
    id: "usr-3vlDVqBTQrMYe68EzFQPuPUTJX928pGu",
    name: "Carlos García",
    email: "carlos.lopez@test.com",
    idNumber: "1144096557",
    idDocType: "CC",
    status: "active",
    country: "COL",
    taxId: "9012345678",
    birthDate: "15/05/1990",
    gender: "male",
    notes: null,
    address: {
      line: "Calle 72 10",
      postal: "110231",
      urbanization: null,
      city: "Bogotá",
      department: "Cundinamarca",
      country: "COL",
    },
    phone: "573001234567",
  },
  {
    id: "usr-9abLMnQwXyZaBcDeFgHiJkLmNoP12qrst",
    name: "Ana María López",
    email: "ana.lopez@example.com",
    idNumber: "52987654",
    idDocType: "CC",
    status: "active",
    country: "COL",
    taxId: "800123456",
    birthDate: "22/08/1987",
    gender: "female",
    notes: "Cliente preferente",
    address: {
      line: "Carrera 15 # 93-47",
      postal: "110221",
      urbanization: "Chico Norte",
      city: "Bogotá",
      department: "Cundinamarca",
      country: "COL",
    },
    phone: "573119998877",
  },
  {
    id: "usr-short-01",
    name: "Luis Fernández",
    email: "luis.f@test.org",
    idNumber: "901234567",
    idDocType: "CE",
    status: "inactive",
    country: "COL",
    taxId: "830456789",
    birthDate: "03/01/1995",
    gender: "male",
    notes: null,
    address: {
      line: "Av. El Dorado 68-90",
      postal: "111071",
      urbanization: null,
      city: "Bogotá",
      department: "Cundinamarca",
      country: "COL",
    },
    phone: "573005551122",
  },
];

export default function CardUsersPage() {
  const { language } = useLanguage();
  const t = cardsTranslations[language].cardUsers;
  const [selected, setSelected] = useState<CardUser | null>(null);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={t.pageTitle} />
      <div className="mt-6">
        {!selected ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-dark dark:text-white">{t.title}</h2>
              <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">{t.desc}</p>
            </div>
            <CardUsersTable users={mockCardUsers} onSelect={setSelected} />
          </>
        ) : (
          <CardUserDetail user={selected} onBack={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
