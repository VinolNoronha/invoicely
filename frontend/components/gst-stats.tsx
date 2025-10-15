import {
  getGrossCollectionServer,
  getTotalGstCollectionServer,
  getTotalTaxableAmountServer,
  getUserServer,
  totalInvoicesCountServer,
} from "@/lib/actions";

import {
  BadgeIndianRupee,
  Banknote,
  Clock,
  HandCoinsIcon,
  IndianRupee,
  Layers2Icon,
  Users,
} from "lucide-react";
import React from "react";

export default async function GstStats() {
  // const [totalGstCollection, setTotalGstCollection] = useState<null | number>();
  // const [totalTaxableAmount, setTotalTaxableAmount] = useState<null | number>();
  // const [grossCollection, setGrossCollection] = useState<null | number>();
  // const [count, setCount] = useState<number | null>(null);
  const user = await getUserServer();
  const id = user?.id;

  const [totalGstCollection, totalTaxableAmount, grossCollection, count] =
    await Promise.all([
      getTotalGstCollectionServer(id),
      getTotalTaxableAmountServer(id),
      getGrossCollectionServer(id),
      totalInvoicesCountServer(id),
    ]);
  const formattedTotalGstColl = new Intl.NumberFormat("en-IN").format(
    Number(totalGstCollection?.toFixed(0)) ?? 0
  );
  const formattedtotalTaxableAmt = new Intl.NumberFormat("en-IN").format(
    Number(totalTaxableAmount?.toFixed(0)) ?? 0
  );
  const formattedGrossCollection = new Intl.NumberFormat("en-IN").format(
    Number(grossCollection?.toFixed(0)) ?? 0
  );

  const data = [
    {
      title: "Total GST collected",
      number: `${formattedTotalGstColl} Rs`,
      icon: <HandCoinsIcon className="h-5 w-5 text-black" />,
    },
    {
      title: "Taxable amount",
      number: `${formattedtotalTaxableAmt} Rs`,
      icon: <Banknote className="h-5 w-5 text-black" />,
    },
    {
      title: "Gross collection",
      number: `${formattedGrossCollection} Rs`,
      icon: <BadgeIndianRupee className="h-5 w-5 text-black" />,
    },
    {
      title: "Total Invoices",
      number: count,
      icon: <Layers2Icon className="h-5 w-5 text-black" />,
    },
  ];

  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       const user = await getUser();
  //       const id = user?.id;

  //       const op_gst = await getTotalGstCollection(id);
  //       const taxable_amt = await getTotalTaxableAmount(id);
  //       const gross_amt = await getGrossCollection(id);
  //       const result = await totalInvoicesCount(id);
  //       setTotalGstCollection(op_gst);
  //       setTotalTaxableAmount(taxable_amt);
  //       setGrossCollection(gross_amt);
  //       setCount(result);
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   }
  //   fetchData();
  // }, []);

  return (
    <section className="grid gap-3 sm:gap-0 grid-cols-1 sm:flex sm:items-center sm:justify-around sm:h-full sm:w-full">
      {data.map((ele) => {
        return (
          <div
            className=" sm:w-1/5 sm:h-30/31 w-80 flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4"
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
