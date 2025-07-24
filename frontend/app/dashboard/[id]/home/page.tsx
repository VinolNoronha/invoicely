import HomeStats from "@/components/home-stats";
import TopCustomers from "@/components/top-customers";
import TotalRevChart from "@/components/TotalRevChart";
import { Clock, IndianRupee, Layers2Icon, Users } from "lucide-react";
import React from "react";

const data = [
  {
    title: "Total Invoices",
    number: "13",
    icon: <Layers2Icon className="h-5 w-5 text-black" />,
  },
  {
    title: "Total Customers",
    number: "7",
    icon: <Users className="h-5 w-5 text-black" />,
  },
  {
    title: "Pending Revenue",
    number: "1234 Rs.",
    icon: <Clock className="h-5 w-5 text-black" />,
  },
  {
    title: "Total Revenue",
    number: "13000 Rs.",
    icon: <IndianRupee className="h-5 w-5 text-black" />,
  },
];

export default function page() {
  return (
    <section className="h-20/21 flex flex-col gap-7 w-30/31 ">
      <section className=" flex items-center justify-around h-1/4 w-full">
        {data.map((ele) => {
          return <HomeStats data={ele} key={ele.title} />;
        })}
      </section>
      <section className="flex-grow flex gap-5 items-center w-full bg-yellow-60">
        <div className="bg-gray-50 gap-4 rounded-sm flex flex-col w-1/2 h-30/31 p-3">
          <div className="bg-amber-60 px-10">
            <p className="text-sm font-medium text-black hover:underline hover:decoration-2 hover:decoration-blue-600">
              Monthly Revenue
            </p>
          </div>
          <TotalRevChart />
        </div>
        <div className="bg-gray-50 gap-4 rounded-sm flex flex-col w-1/2 h-30/31 p-3">
          <div className="bg-amber-60 px-10">
            <p className="text-sm font-medium text-black hover:underline hover:decoration-2 hover:decoration-blue-600">
              Top Customers
            </p>
          </div>
          <TopCustomers />
        </div>
      </section>
    </section>
  );
}
