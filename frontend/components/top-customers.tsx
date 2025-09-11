"use client";
import React, { useEffect, useState } from "react";
import UserList from "./ui/UserList";
import { getTopCustomers, getUser } from "@/lib/utils";

// const userData = [
//   {
//     pfp: "",
//     username: "Vinol Noronha",
//     email: "vinolnoronha@gmail.com",
//     amount: "10000",
//   },
//   {
//     pfp: "",
//     username: "Jay Shankar",
//     email: "jay@gmail.com",
//     amount: "2000",
//   },
//   {
//     pfp: "",
//     username: "Jyoti Shah",
//     email: "jyoti@gmail.com",
//     amount: "2399",
//   },
//   {
//     pfp: "",
//     username: "Shwetha Shet",
//     email: "swetha@gmail.com",
//     amount: "6000",
//   },
//   {
//     pfp: "",
//     username: "Ankur Bhansal",
//     email: "ankur@gmail.com",
//     amount: "6000",
//   },
// ];

interface Customer {
  client_name: string;
  total_amount: number;
  email?: string | null;
  pfp?: string | null;
}

export default function TopCustomers() {
  const [datatemp, setData] = useState<Customer[] | null>(null);
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const user = await getUser();
        const id = user?.id;
        const data = await getTopCustomers(id);
        setData(data.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        setData([]); // Set to empty array instead of null on error
      }
    }
    fetchCustomers();
  }, []);
  console.log(datatemp);

  return (
    <div className="bg-white mx-3 px-3 my-2 h-full rounded-sm">
      {datatemp?.map((curr, ind) => {
        return <UserList key={curr.email} ind={ind} userData={curr} />;
      })}
    </div>
  );
}
