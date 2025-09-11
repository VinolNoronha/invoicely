"use client";
import {
  getGrossCollection,
  getTotalGstCollection,
  getTotalTaxableAmount,
  totalCustomerCount,
  totalInvoicesCount,
  totalPendingRev,
  totalRev,
} from "@/lib/utils";
import {
  BadgeIndianRupee,
  Banknote,
  Clock,
  HandCoinsIcon,
  IndianRupee,
  Layers2Icon,
  Users,
} from "lucide-react";
import React, { ReactElement, useEffect, useState } from "react";

export default function GstStats() {
  const [totalGstCollection, setTotalGstCollection] = useState<null | number>();
  const [totalTaxableAmount, setTotalTaxableAmount] = useState<null | number>();
  const [grossCollection, setGrossCollection] = useState<null | number>();
  const [count, setCount] = useState<number | null>(null);

  const data = [
    {
      title: "Total GST collected",
      number: totalGstCollection,
      icon: <HandCoinsIcon className="h-5 w-5 text-black" />,
    },
    {
      title: "Taxable amount",
      number: totalTaxableAmount,
      icon: <Banknote className="h-5 w-5 text-black" />,
    },
    {
      title: "Gross collection",
      number: grossCollection,
      icon: <BadgeIndianRupee className="h-5 w-5 text-black" />,
    },
    {
      title: "Total Invoices",
      number: count,
      icon: <Layers2Icon className="h-5 w-5 text-black" />,
    },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const op_gst = await getTotalGstCollection(
          "6b8cf389-c67a-4b58-81f9-74af0ced1379"
        );
        const taxable_amt = await getTotalTaxableAmount(
          "6b8cf389-c67a-4b58-81f9-74af0ced1379"
        );
        const gross_amt = await getGrossCollection(
          "6b8cf389-c67a-4b58-81f9-74af0ced1379"
        );
        const result = await totalInvoicesCount(
          "6b8cf389-c67a-4b58-81f9-74af0ced1379"
        );
        setTotalGstCollection(op_gst);
        setTotalTaxableAmount(taxable_amt);
        setGrossCollection(gross_amt);
        setCount(result);
      } catch (e) {
        console.log(e);
      }
    }
    fetchData();
  }, []);

  // console.log(totalGstCollection);
  // console.log(totalTaxableAmount);
  // console.log(grossCollection);
  // console.log(count);

  return (
    <section className=" flex items-center justify-around h-full w-full">
      {data.map((ele) => {
        return (
          <div
            className="w-1/5 h-30/31 flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4"
            key={ele.title}
          >
            <div className="flex gap-2 items-center w-full">
              {ele.icon}
              <p className="text-sm font-medium text-black">{ele.title}</p>
            </div>

            <div className="bg-white h-full w-full p-4 rounded-sm flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">
                {ele.number}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
