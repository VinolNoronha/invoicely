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

export default function page() {
  return (
    <section className="sm:h-100% mt-175 sm:mt-0  flex flex-col gap-4 w-30/31 ">
      <section className="w-full bg-yellow-40 sm:h-1/4 grid grid-cols-1 place-items-center sm:flex sm:items-center sm:justify-around ">
        <Suspense fallback={<SkeletonGstStats />}>
          <GstStats />
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
