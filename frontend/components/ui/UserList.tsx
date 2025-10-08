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
  const formattedTotalAmt = new Intl.NumberFormat("en-IN").format(
    Number(userData.total_amount?.toFixed(0)) ?? 0
  );
  return (
    <div
      className={`bg-white h-16 sm:h-18 border border-x-0 border-t-0 ${
        ind >= 4 ? "border-b-0" : "border-b-neutral-400"
      } `}
    >
      <div className="flex items-center h-full gap-4 ">
        <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-100 border border-gray-300">
          {userData?.pfp && userData?.pfp.includes("supabase") ? (
            <img
              src={userData.pfp}
              alt="Profile"
              className="sm:h-8 sm:w-8 h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <User2 className="sm:h-5 sm:w-5 h-4 w-4 text-gray-600" />
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm sm:text-[16px]  font-bold  text-black">
            {userData.client_name}
          </h3>
          <p className="sm:text-sm text-xs text-gray-500">{userData.email}</p>
        </div>
        <div className="mt-1 flex-grow flex justify-end text-xs sm:text-[16px] pr-1.5  text-black w-fit">
          <p>{formattedTotalAmt} Rs.</p>
        </div>
      </div>
    </div>
  );
}
