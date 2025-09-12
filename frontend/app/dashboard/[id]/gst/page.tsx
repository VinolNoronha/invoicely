import HomeStats from "@/components/home-stats";
import TotalTaxChart from "@/components/TotalTaxChart";
import Irn from "@/components/irn-component";
import {
  BadgeIndianRupee,
  Banknote,
  HandCoinsIcon,
  Layers2Icon,
} from "lucide-react";
import React from "react";
import InvDescrepencie from "@/components/invoice-descrepencie";
import GstStats from "@/components/gst-stats";

export default function page() {
  return (
    <section className="h-100% bg-yellow-30 flex flex-col gap-4 w-30/31 ">
      <section className="w-full h-1/4 flex items-center justify-around ">
        <GstStats />
      </section>
      <section className="w-full h-[45%] my-4 flex justify-center items-center bg-amber-5">
        <TotalTaxChart />
      </section>
      <section className="bg-amber-70 flex h-[95%] w-full">
        <Irn />
        <InvDescrepencie />
      </section>
    </section>
  );
}
