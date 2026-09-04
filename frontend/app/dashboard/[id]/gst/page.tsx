import HomeStats from "@/components/home-stats";
import TotalTaxChart from "@/components/TotalTaxChart";
import Irn from "@/components/irn-component";
import {
  BadgeIndianRupee,
  Banknote,
  HandCoinsIcon,
  Layers2Icon,
} from "lucide-react";
import React, { Suspense } from "react";
import InvDescrepencie from "@/components/invoice-descrepencie";
import GstStats from "@/components/gst-stats";
import SkeletonGstStats from "@/components/skeleton/skeletonGstStats";
import SkeletonMissingIrn from "@/components/skeleton/skeletonMissingIrn";
import RangeSelector from "@/components/ui/rangeSelector";
import { DateRange } from "@/lib/utils";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;

  const range = (rangeParam ?? "30d") as DateRange;

  return (
    <section className="w-30/31 flex flex-col gap-4  pb-4">
      <div className="w-full flex justify-end">
        <RangeSelector />
      </div>

      <section className="w-full flex justify-center sm:flex-row sm:items-start">
        <Suspense fallback={<SkeletonGstStats />} key={range}>
          <GstStats range={range} />
        </Suspense>
      </section>

      <section className="w-full flex justify-center">
        <TotalTaxChart />
      </section>

      {/* <section className="w-full flex flex-col gap-6 sm:flex-row sm:items-start">
        <Suspense fallback={<SkeletonMissingIrn />}>
          <Irn />
        </Suspense>

        <InvDescrepencie />
      </section> */}
    </section>
  );
}
