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

const data = [
  {
    title: "Total GST collected",
    number: "13000",
    icon: <HandCoinsIcon className="h-5 w-5 text-black" />,
  },
  {
    title: "Taxable amount",
    number: "130000",
    icon: <Banknote className="h-5 w-5 text-black" />,
  },
  {
    title: "Gross collection",
    number: "131000",
    icon: <BadgeIndianRupee className="h-5 w-5 text-black" />,
  },
  {
    title: "Total Invoices",
    number: "13",
    icon: <Layers2Icon className="h-5 w-5 text-black" />,
  },
];

export default function page() {
  return (
    <section className="h-full bg-yellow-30 flex flex-col gap- w-30/31 ">
      <section className="w-full h-1/4 flex items-center justify-around ">
        {data.map((ele, ind) => {
          return <HomeStats data={ele} key={ind} />;
        })}
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
