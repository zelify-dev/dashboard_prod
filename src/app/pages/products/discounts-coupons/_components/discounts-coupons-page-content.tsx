"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CouponsList, Coupon, getMockCoupons } from "./coupons-list";
import { CouponDetail } from "./coupon-detail";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";
import { useLanguage } from "@/contexts/language-context";

export function DiscountsCouponsPageContent() {
  const translations = useDiscountsCouponsTranslations();
  const { language } = useLanguage();
  const [coupons, setCoupons] = useState<Coupon[]>(() => getMockCoupons(language));
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    setCoupons(getMockCoupons(language));
    setSelectedCoupon(null);
  }, [language]);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.breadcrumb.coupons} />
      <div className="mt-6">
        <div className="mb-6" data-tour-id="tour-discounts-coupons">
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            {translations.coupons.pageTitle}
          </h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
            {translations.coupons.description}
          </p>
        </div>
        <div>
          <CouponsList coupons={coupons} onCouponClick={setSelectedCoupon} />
        </div>
      </div>
      {selectedCoupon && (
        <CouponDetail
          coupon={selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
        />
      )}
    </div>
  );
}
