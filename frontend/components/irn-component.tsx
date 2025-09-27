"use client";
import React, { useEffect, useState } from "react";
import Irnlist from "./ui/Irnlist";
import { getMissingIrnData, getUser } from "@/lib/utils";

type irnData = {
  invoice_num: string;
  GST_IN: string;
  dated: string;
};

export default function Irn() {
  const [data, setData] = useState<null | irnData[]>();

  useEffect(() => {
    async function fetchData() {
      try {
        const user = await getUser();
        const id = user?.id;
        const dta = await getMissingIrnData(id);
        setData(dta);
      } catch (e) {
        console.log(e);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="h-[29vh] w-[45%] ml-7 flex flex-col overflow-hidden bg-white shadow-md rounded-lg border border-gray-200">
      {/* Header */}
      <div className="w-full border-b border-gray-200 px-4 py-2 bg-gray-50">
        <p className="text-sm font-semibold text-gray-800">Missing IRN</p>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {data ? (
            data?.map((ele, ind) => (
              <div
                key={ind}
                className="bg-gray-100 hover:bg-gray-200 transition-colors rounded-md p-2 shadow-sm flex justify-between items-center"
              >
                <Irnlist ind={ind} data={ele} />
                {/* optional: add an icon or status */}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">No missing IRNs</p>
          )}
        </div>
      </div>
    </div>
  );
}
