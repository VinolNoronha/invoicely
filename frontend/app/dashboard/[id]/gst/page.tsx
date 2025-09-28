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
    <section className="h-100% bg-yellow-30 flex flex-col gap-4 w-30/31 ">
      <section className="w-full h-1/4 flex items-center justify-around ">
        <Suspense fallback={<SkeletonGstStats />}>
          <GstStats />
        </Suspense>
      </section>
      <section className="w-full h-[45%] my-4 flex justify-center items-center bg-amber-5">
        <TotalTaxChart />
      </section>
      <section className="bg-amber-70 flex h-[95%] w-full">
        <Suspense fallback={<SkeletonMissingIrn />}>
          <Irn />
        </Suspense>
        <InvDescrepencie />
      </section>
    </section>
  );
}
