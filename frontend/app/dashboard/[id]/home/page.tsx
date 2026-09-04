import HomeStats from "@/components/home-stats";
import SkeletonHomeStats from "@/components/skeleton/skeletonHomeStats";
import SkeletonTopCustomers from "@/components/skeleton/skeletonTopCustHome";
import TopCustomers from "@/components/pending-invoices";
import TotalRevChart from "@/components/TotalRevChart";
import React, { Suspense } from "react";
import RangeSelector from "@/components/ui/rangeSelector";
import { DateRange } from "@/lib/utils";
import PendingInvoices from "@/components/pending-invoices";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range = (rangeParam ?? "30d") as DateRange;

  return (
    <section className="flex w-full h-full flex-col gap-7 md:w-30/31">
      <section className="w-full flex items-center px-2 py-3">
        <RangeSelector />
      </section>
      {/* HomeStats */}
      <Suspense fallback={<SkeletonHomeStats />} key={range}>
        <HomeStats range={range} />
      </Suspense>

      {/* Charts & Top Customers */}
      <section className="flex flex-col md:flex-row gap-5 items-start w-full">
        {/* Monthly Revenue */}
        <div className="bg-gray-50 gap-4 rounded-sm flex flex-col w-full md:w-1/2 p-3">
          <div className="bg-amber-60 px-10 py-2">
            <p className="text-sm font-medium text-black hover:underline hover:decoration-2 hover:decoration-blue-600">
              Monthly Revenue (Last 12 months)
            </p>
          </div>
          <TotalRevChart />
        </div>

        {/* Pending Invoices */}
        <div className="bg-gray-50 gap-4 rounded-sm flex flex-col w-full md:w-1/2 p-1">
          <div className="bg-amber-60 px-10 py-2">
            <p className="text-sm font-medium text-black hover:underline hover:decoration-2 hover:decoration-blue-600">
              Pending Invoices (by age)
            </p>
          </div>

          <Suspense fallback={<SkeletonTopCustomers />}>
            <PendingInvoices />
          </Suspense>
        </div>
      </section>
    </section>
  );
}
