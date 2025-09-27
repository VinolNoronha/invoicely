import { getTopCustomers } from "@/lib/utils";
import { User2 } from "lucide-react";
import React from "react";

interface Customer {
  client_name: string;
  total_amount: number;
  email?: string | null;
  pfp?: string | null;
}

export default function UserList({
  userData,
  ind,
}: {
  userData: Customer;
  ind: number;
}) {
  const formattedAmt = new Intl.NumberFormat("en-IN").format(
    Number(userData.total_amount?.toFixed(0))
  );

  return (
    <div
      className={`bg-white h-18 border border-x-0 border-t-0 ${
        ind >= 4 ? "border-b-0" : "border-b-neutral-400"
      } `}
    >
      <div className="flex items-center h-full gap-4 ">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 border border-gray-300">
          {userData?.pfp && userData?.pfp.includes("supabase") ? (
            <img
              src={userData.pfp}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <User2 className="h-5 w-5 text-gray-600" />
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="text-md font-bold  text-black">
            {userData.client_name}
          </h3>
          <p className="text-sm text-gray-500">{userData.email}</p>
        </div>
        <div className="mt-1 flex-grow flex justify-end  text-md pr-1.5   text-black w-fit">
          <p>{formattedAmt} Rs.</p>
        </div>
      </div>
    </div>
  );
}
