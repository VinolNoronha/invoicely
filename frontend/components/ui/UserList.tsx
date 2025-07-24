import { User2 } from "lucide-react";
import React from "react";

interface userDataProps {
  pfp?: string | null;
  username?: string;
  email?: string;
  amount?: string;
}

export default function UserList({
  userData,
  ind,
}: {
  userData: userDataProps;
  ind: number;
}) {
  return (
    <div
      className={`bg-white h-18 border border-x-0 border-t-0 ${
        ind >= 4 ? "border-b-0" : "border-b-neutral-400"
      } `}
    >
      <div className="flex items-center h-full gap-4 ">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 border border-gray-300">
          <User2 className="h-5 w-5 text-gray-600" />
        </div>

        <div className="flex flex-col">
          <h3 className="text-md font-bold  text-black">{userData.username}</h3>
          <p className="text-sm text-gray-500">{userData.email}</p>
        </div>
        <div className="mt-1 flex-grow flex justify-end  text-md pr-1.5   text-black w-fit">
          <p>{userData.amount} Rs.</p>
        </div>
      </div>
    </div>
  );
}
