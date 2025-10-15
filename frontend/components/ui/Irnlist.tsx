import React from "react";

interface irnProps {
  ind: number;
  data: {
    invoice_num: string;
    GST_IN: string;
    dated: string;
  };
}

export default function Irnlist({ ind, data }: irnProps) {
  return (
    <div className="bg-white h-12 border-b border-neutral-300 px-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between px-4 py-2 gap-4">
        {/* Invoice Number */}
        <div className="flex-1">
          <span className="sm:text-sm text-xs font-semibold text-gray-900">
            {data?.invoice_num || "-"}
          </span>
        </div>

        {/* GSTIN */}
        <div className="flex-1 text-center">
          <span className="sm:text-sm text-xs text-gray-700">
            {data?.GST_IN || "-"}
          </span>
        </div>

        {/* Date */}
        <div className="flex-1 text-right">
          <span className="sm:text-sm text-xs text-gray-600">
            {data?.dated || "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

// className="mt-1 flex-grow flex justify-end  text-md pr-1.5   text-black w-fit"
