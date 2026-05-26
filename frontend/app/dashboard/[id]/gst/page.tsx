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
    <section className="sm:h-100% mt-175 sm:mt-0  flex flex-col gap-4 w-30/31 ">
      <section className="w-full sm:h-1/4 grid grid-cols-1 place-items-center sm:flex sm:items-center sm:justify-around ">
        <section className="w-full mr-10 sm:h-1/4">
          <RangeSelector />
        </section>
      </section>
      <section className="w-full  sm:h-1/4 grid grid-cols-1 place-items-center sm:flex sm:items-center sm:justify-around ">
        <Suspense fallback={<SkeletonGstStats />} key={range}>
          <GstStats range={range} />
        </Suspense>
      </section>
      <section className="w-full h-[45%] my-4 flex justify-center items-center bg-amber-">
        <TotalTaxChart />
      </section>
      <section className="bg-amber-70 gap-5 sm:gap-0 flex-col items-center  sm:flex-row flex h-[95%] w-full">
        <Suspense fallback={<SkeletonMissingIrn />}>
          <Irn />
        </Suspense>
        <InvDescrepencie />
      </section>
    </section>
  );
}
