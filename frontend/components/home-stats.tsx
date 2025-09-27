// "use client";
import {
  getUserServer,
  totalCustomerCountServer,
  totalInvoicesCountServer,
  totalPendingRevServer,
  totalRevServer,
} from "@/lib/actions";
import { Clock, IndianRupee, Layers2Icon, Users } from "lucide-react";
import React from "react";
//{ ReactElement, useEffect, useState }

export default async function HomeStats() {
  // const [count, setCount] = useState<number | null>(null);
  // const [totalCustCount, setTotalCustomerCount] = useState<number | null>(null);
  // const [totalPendingAmount, setTotalPendingAmount] = useState<number | null>(
  //   null
  // );
  // const [totalAmount, setTotalAmount] = useState<null | number>(null);

  const user = await getUserServer();
  const id = user?.id;

  const [count, totalCustCount, totalPendingAmount, totalAmount] =
    await Promise.all([
      totalInvoicesCountServer(id),
      totalCustomerCountServer(id),
      totalPendingRevServer(id),
      totalRevServer(id),
    ]);
  const formattedPendRev = new Intl.NumberFormat("en-IN").format(
    Number(totalPendingAmount?.toFixed(0)) ?? 0
  );
  const formattedTotalRev = new Intl.NumberFormat("en-IN").format(
    Number(totalAmount?.toFixed(0)) ?? 0
  );

  const data = [
    {
      title: "Total Invoices",
      number: count,
      icon: <Layers2Icon className="h-5 w-5 text-black" />,
    },
    {
      title: "Total Customers",
      number: totalCustCount,
      icon: <Users className="h-5 w-5 text-black" />,
    },
    {
      title: "Pending Revenue",
      number: `${formattedPendRev} Rs.`,
      icon: <Clock className="h-5 w-5 text-black" />,
    },
    {
      title: "Total Revenue",
      number: `${formattedTotalRev} Rs.`,
      icon: <IndianRupee className="h-5 w-5 text-black" />,
    },
  ];

  // useEffect(() => {
  //   async function fetchCount() {
  //     const user = await getUser();
  //     const id = user?.id;

  //     const [result, customerCnt, pendingAmt, totalAmt] = await Promise.all([
  //       totalInvoicesCount(id),
  //       totalCustomerCount(id),
  //       totalPendingRev(id),
  //       totalRev(id),
  //     ]);

  //     setCount(result);
  //     setTotalCustomerCount(customerCnt);
  //     setTotalPendingAmount(pendingAmt);
  //     setTotalAmount(totalAmt);
  //   }
  //   fetchCount();
  // }, []);

  console.log(count);
  console.log(totalCustCount);

  return (
    <section className=" flex items-center justify-around h-1/4 w-full">
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
