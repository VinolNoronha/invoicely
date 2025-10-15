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
    <div className="bg-white h-12 border-b border-neutral-300 px-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between h-full text-sm">
        <span className="font-semibold text-xs text-black">
          {data.invoice_num}
        </span>
        <span className="text-gray-600 text-xs">{data.supplier_gstin}</span>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${[
            data.gstr2a_status,
          ]}`}
        >
          {data.gstr2a_status}
        </span>
        <span className="text-gray-500 italic text-xs">
          {data.mismatch_reason}
        </span>
      </div>
    </div>
  );
}
