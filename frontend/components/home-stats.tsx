import { getUserServer, getCashflowSummaryServer } from "@/lib/actions";
import { DateRange, getDateRange, formatINR } from "@/lib/utils";
import {
  Banknote,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import React from "react";

export default async function HomeStats({
  range = "30d",
}: {
  range?: DateRange;
}) {
  const user = await getUserServer();
  const id = user?.id;
  const { from, to } = getDateRange(range);

  const summary = await getCashflowSummaryServer(id, from, to);
  const isPositive = summary.netCashflow >= 0;

  const data = [
    {
      title: "Cash Inflow",
      number: formatINR(summary.cashInflow),
      icon: <Banknote className="h-5 w-5 text-black" />,
      valueClass: "text-gray-800",
    },
    {
      title: "Pending Receivables",
      number: formatINR(summary.pendingReceivables),
      icon: <Clock className="h-5 w-5 text-black" />,
      valueClass: "text-gray-800",
    },
    {
      title: "Pending Payables",
      number: formatINR(summary.pendingPayables),
      icon: <AlertCircle className="h-5 w-5 text-black" />,
      valueClass: "text-gray-800",
    },
    {
      title: "Net Cashflow",
      number: formatINR(summary.netCashflow, { forceSign: true }),
      icon: isPositive ? (
        <TrendingUp className="h-5 w-5 text-emerald-600" />
      ) : (
        <TrendingDown className="h-5 w-5 text-red-600" />
      ),
      valueClass: isPositive ? "text-emerald-600" : "text-red-600",
    },
  ];

  return (
    <section className="grid grid-cols-1 pr-3 sm:flex flex-wrap justify-around gap-4 w-full px-2">
      {data.map((ele) => (
        <div
          key={ele.title}
          className="flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4
                 w-full sm:w-1/2 md:w-1/4 lg:w-1/5 box-border mx-1"
        >
          <div className="flex gap-2 items-center w-full">
            {ele.icon}
            <p className="text-sm font-medium text-black truncate">
              {ele.title}
            </p>
          </div>

          <div className="bg-white w-full p-4 rounded-sm flex items-center justify-center min-h-[60px]">
            <span className={`text-2xl font-bold ${ele.valueClass}`}>
              {ele.number}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}

// // "use client";
// import {
//   getUserServer,
//   totalCustomerCountServer,
//   totalInvoicesCountServer,
//   totalPendingRevServer,
//   totalRevServer,
// } from "@/lib/actions";
// import { DateRange, getDateRange } from "@/lib/utils";
// import { Clock, IndianRupee, Layers2Icon, Users } from "lucide-react";
// import React from "react";
// //{ ReactElement, useEffect, useState }

// export default async function HomeStats({
//   range = "30d",
// }: {
//   range?: DateRange;
// }) {
//   // const [count, setCount] = useState<number | null>(null);
//   // const [totalCustCount, setTotalCustomerCount] = useState<number | null>(null);
//   // const [totalPendingAmount, setTotalPendingAmount] = useState<number | null>(
//   //   null
//   // );
//   // const [totalAmount, setTotalAmount] = useState<null | number>(null);

//   const user = await getUserServer();
//   const id = user?.id;
//   const { from, to } = getDateRange(range);

//   const [count, totalCustCount, totalPendingAmount, totalAmount] =
//     await Promise.all([
//       totalInvoicesCountServer(id, from, to),
//       totalCustomerCountServer(id, from, to),
//       totalPendingRevServer(id, from, to),
//       totalRevServer(id, from, to),
//     ]);
//   const formattedPendRev = new Intl.NumberFormat("en-IN").format(
//     Number(totalPendingAmount?.toFixed(0)) ?? 0,
//   );
//   const formattedTotalRev = new Intl.NumberFormat("en-IN").format(
//     Number(totalAmount?.toFixed(0)) ?? 0,
//   );

//   const data = [
//     {
//       title: "Total Invoices",
//       number: count,
//       icon: <Layers2Icon className="h-5 w-5 text-black" />,
//     },
//     {
//       title: "Total Customers",
//       number: totalCustCount,
//       icon: <Users className="h-5 w-5 text-black" />,
//     },
//     {
//       title: "Pending Revenue",
//       number: `${formattedPendRev} Rs.`,
//       icon: <Clock className="h-5 w-5 text-black" />,
//     },
//     {
//       title: "Total Revenue",
//       number: `${formattedTotalRev} Rs.`,
//       icon: <IndianRupee className="h-5 w-5 text-black" />,
//     },
//   ];

//   // useEffect(() => {
//   //   async function fetchCount() {
//   //     const user = await getUser();
//   //     const id = user?.id;

//   //     const [result, customerCnt, pendingAmt, totalAmt] = await Promise.all([
//   //       totalInvoicesCount(id),
//   //       totalCustomerCount(id),
//   //       totalPendingRev(id),
//   //       totalRev(id),
//   //     ]);

//   //     setCount(result);
//   //     setTotalCustomerCount(customerCnt);
//   //     setTotalPendingAmount(pendingAmt);
//   //     setTotalAmount(totalAmt);
//   //   }
//   //   fetchCount();
//   // }, []);

//   console.log(count);
//   console.log(totalCustCount);

//   return (
//     <section className="grid grid-cols-1 pr-3 sm:flex flex-wrap justify-around gap-4 w-full px-2">
//       {data.map((ele) => (
//         <div
//           key={ele.title}
//           className="flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4
//                  w-full sm:w-1/2 md:w-1/4 lg:w-1/5 box-border mx-1"
//         >
//           {/* Icon + title */}
//           <div className="flex gap-2 items-center w-full">
//             {ele.icon}
//             <p className="text-sm font-medium text-black truncate">
//               {ele.title}
//             </p>
//           </div>

//           {/* Number */}
//           <div className="bg-white w-full p-4 rounded-sm flex items-center justify-center min-h-[60px]">
//             <span className="text-2xl font-bold text-gray-800">
//               {ele.number ?? "-"}
//             </span>
//           </div>
//         </div>
//       ))}
//     </section>
//   );
// }
