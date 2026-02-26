"use client";

import { AuthenticationConfig } from "../../auth/authentication/_components/authentication-config";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useDiscountsCouponsTranslations } from "../_components/use-discounts-coupons-translations";
import { DiscountsConfig } from "./_components/discounts-config";

export default function DiscountsPage() {
  const translations = useDiscountsCouponsTranslations();

  return (
    <div className="mx-auto w-full max-w-[1300px] p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <Breadcrumb pageName={translations.breadcrumb.discount} />
      </div>

      <DiscountsConfig />
    </div>
  );
}
