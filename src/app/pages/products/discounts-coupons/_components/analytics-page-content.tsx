"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CouponAnalytics } from "./coupon-analytics";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";

export function AnalyticsPageContent() {
  const translations = useDiscountsCouponsTranslations();

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.breadcrumb.analytics} />
      <div className="mt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{translations.analytics.pageTitle}</h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
            {translations.analytics.description}
          </p>
        </div>
        <div>
          <CouponAnalytics />
        </div>
      </div>
    </div>
  );
}

