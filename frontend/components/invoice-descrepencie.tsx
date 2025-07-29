import React from "react";
import DiscrepencieList from "./ui/Inv-desc-list";

interface descItem {
  invoice_num: string;
  gstr2a_status:
    | "pending"
    | "missing"
    | "matched"
    | "mismatched"
    | "rejected"
    | "duplicate";
  mismatch_reason: string;
  supplier_gstin: string;
  date: string;
}

const data: descItem[] = [
  {
    invoice_num: "INV 007",
    gstr2a_status: "pending",
    mismatch_reason: "Tax difference",
    supplier_gstin: "22ABCDE13454",
    date: "27/10/03",
  },
  {
    invoice_num: "INV 001",
    gstr2a_status: "rejected",
    mismatch_reason: "Tax difference",
    supplier_gstin: "22ABCDE13444",
    date: "23/10/03",
  },
  {
    invoice_num: "INV 003",
    gstr2a_status: "duplicate",
    mismatch_reason: "Tax difference",
    supplier_gstin: "22ABCDE15664",
    date: "13/10/03",
  },
  {
    invoice_num: "INV 003",
    gstr2a_status: "duplicate",
    mismatch_reason: "Tax difference",
    supplier_gstin: "22ABCDE15664",
    date: "13/10/03",
  },
  {
    invoice_num: "INV 003",
    gstr2a_status: "duplicate",
    mismatch_reason: "Tax difference",
    supplier_gstin: "22ABCDE15664",
    date: "13/10/03",
  },
];

export default function InvDescrepencie() {
  return (
    <div className="h-[29vh] w-[45%] ml-7 flex flex-col overflow-hidden  bg-gray-50 rounded-md">
      <div className="w-full">
        <p className="text-sm font-medium pl-3 text-black hover:underline hover:decoration-2 mt-2 hover:decoration-blue-600">
          Invoice Discrepancies
        </p>
      </div>
      <div className="h-[90%] w-full flex overflow-y-scroll justify-center mt-1">
        <div className="h-[90%] w-[95%]  rounded-md">
          {data.map((ele, ind) => {
            return <DiscrepencieList key={ind} data={ele} />;
          })}
        </div>
      </div>
    </div>
  );
}
