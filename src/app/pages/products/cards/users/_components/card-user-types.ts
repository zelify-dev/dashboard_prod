export type CardUserStatus = "active" | "inactive";

export type CardUserGender = "male" | "female" | "other";

export type CardUser = {
  id: string;
  name: string;
  email: string;
  idNumber: string;
  idDocType: string;
  status: CardUserStatus;
  country: string;
  taxId: string;
  birthDate: string;
  gender: CardUserGender;
  notes: string | null;
  address: {
    line: string;
    postal: string;
    urbanization: string | null;
    city: string;
    department: string;
    country: string;
  };
  phone: string;
};

export function formatUserIdShort(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}...${id.slice(-5)}`;
}
