"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CreateCouponForm } from "./create-coupon-form";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";

export function CreateCouponPageContent() {
  const translations = useDiscountsCouponsTranslations();

  const handleSave = (couponData: any) => {
    // TODO: Save coupon to database
    console.log("Saving coupon:", couponData);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.breadcrumb.create} />
      <div className="mt-6">
        <div className="mb-6" data-tour-id="tour-discounts-create">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{translations.create.pageTitle}</h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
            {translations.create.pageDescription}
          </p>
        </div>
        <div>
          <CreateCouponForm onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}

