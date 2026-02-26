"use client";

import { getMockCoupons } from "./coupons-list";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";
import { useLanguage } from "@/contexts/language-context";

export function CouponAnalytics() {
  const translations = useDiscountsCouponsTranslations();
  const { language } = useLanguage();
  const coupons = getMockCoupons(language);
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.status === "active").length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const totalLimit = coupons.reduce((sum, c) => sum + c.usageLimit, 0);
  const usageRate = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

  const stats = [
    {
      title: translations.analytics.totalCoupons,
      value: totalCoupons,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      title: translations.analytics.activeCoupons,
      value: activeCoupons,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: translations.analytics.totalRedemptions,
      value: totalUsage,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: translations.analytics.usageRate,
      value: `${usageRate.toFixed(1)}%`,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        data-tour-id="tour-discounts-analytics"
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-6 dark:text-dark-6">{stat.title}</p>
                <p className="mt-2 text-2xl font-bold text-dark dark:text-white">{stat.value}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-primary dark:bg-primary/20">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Performance Table */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {translations.analytics.couponPerformance}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-6 dark:text-dark-6">
                  {translations.analytics.coupon}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-6 dark:text-dark-6">
                  {translations.analytics.code}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-6 dark:text-dark-6">
                  {translations.analytics.status}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-6 dark:text-dark-6">
                  {translations.analytics.usage}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-6 dark:text-dark-6">
                  {translations.analytics.rate}
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const usageRate = (coupon.usedCount / coupon.usageLimit) * 100;
                return (
                  <tr
                    key={coupon.id}
                    className="border-b border-stroke dark:border-dark-3"
                  >
                    <td className="px-4 py-3 text-sm text-dark dark:text-white">
                      {coupon.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-dark dark:text-white">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${coupon.status === "active"
                            ? "bg-[#219653]/[0.08] text-[#219653]"
                            : coupon.status === "limit_reached"
                              ? "bg-[#FFA70B]/[0.08] text-[#FFA70B]"
                              : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {translations.coupons.status[coupon.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark dark:text-white">
                      {coupon.usedCount} / {coupon.usageLimit}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-dark-3">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${usageRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-dark-6 dark:text-dark-6">
                          {usageRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

