import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Information | Zelify Dashboard",
  description: "Onboarding - Business Information",
};

export default function BusinessInfoPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="Business Information" />

      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
          Business Information
        </h4>
        <div className="flex flex-col gap-5.5 p-6.5">
          <p className="text-body-color dark:text-body-color-dark">
            This section will contain the Business Information form for
            onboarding.
          </p>
        </div>
      </div>
    </div>
  );
}
