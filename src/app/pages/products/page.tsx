import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import type { Metadata } from "next";
import { ProductsPageContent } from "./_components/products-content";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <div className="mx-auto w-full max-w-[970px]">
      <Breadcrumb pageName="Products" />
      <ProductsPageContent />
    </div>
  );
}

