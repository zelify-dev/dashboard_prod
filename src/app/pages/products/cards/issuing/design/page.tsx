import { redirect } from "next/navigation";

/** La ruta de diseño se unificó en `/pages/products/cards`. */
export default function CardsIssuingDesignRedirectPage() {
  redirect("/pages/products/cards");
}
