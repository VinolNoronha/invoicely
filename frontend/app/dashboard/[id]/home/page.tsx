import HomeStats from "@/components/home-stats";
import SkeletonHomeStats from "@/components/skeleton/skeletonHomeStats";
import SkeletonTopCustomers from "@/components/skeleton/skeletonTopCustHome";
import TopCustomers from "@/components/top-customers";
import TotalRevChart from "@/components/TotalRevChart";
import React, { Suspense } from "react";

export default function page() {
  return (
    <section className="flex flex-col gap-7 w-full md:w-30/31">
      {/* HomeStats */}
      <Suspense fallback={<SkeletonHomeStats />}>
        <HomeStats />
      </Suspense>

      {/* Charts & Top Customers */}
      <section className="flex flex-col md:flex-row gap-5 items-start w-full">
        {/* Monthly Revenue */}
        <div className="bg-gray-50 gap-4 rounded-sm flex flex-col w-full md:w-1/2 p-3">
          <div className="bg-amber-60 px-10 py-2">
            <p className="text-sm font-medium text-black hover:underline hover:decoration-2 hover:decoration-blue-600">
              Monthly Revenue
            </p>
          </div>
          <TotalRevChart />
        </div>

        {/* Top Customers */}
        <div className="bg-gray-50 gap-4 rounded-sm flex flex-col w-full md:w-1/2 p-1">
          <div className="bg-amber-60 px-10 py-2">
            <p className="text-sm font-medium text-black hover:underline hover:decoration-2 hover:decoration-blue-600">
              Top Customers
            </p>
          </div>

          <Suspense fallback={<SkeletonTopCustomers />}>
            <TopCustomers />
          </Suspense>
        </div>
      </section>
    </section>
  );
}
