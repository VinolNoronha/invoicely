import HomeStats from "@/components/home-stats";
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
    <section className="h-20/21 flex flex-col w-30/31 ">
      <section className=" flex items-center justify-around h-1/4 w-full">
        {data.map((ele) => {
          return <HomeStats data={ele} key={ele.title} />;
        })}
      </section>
      <section className="flex-grow w-full bg-yellow-300"></section>
    </section>
  );
}
