import React from "react";

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

export default function DiscrepencieList({ data }: { data: descItem }) {
  return (
    <div
      className={`bg-white h-10 border border-x-0 border-t-0 border-b-neutral-400`}
    >
      <div className="flex items-center justify-around h-full gap-4 ">
        <div>
          <span className="text-md font-bold text-black">
            {data?.invoice_num || ""}
          </span>
        </div>
        <div>
          <h3 className="text-md text-black">{data?.supplier_gstin || ""}</h3>
        </div>
        <div>
          <p>{data?.gstr2a_status || ""}</p>
        </div>
        <div>
          <p>{data?.mismatch_reason || ""}</p>
        </div>
      </div>
    </div>
  );
}
