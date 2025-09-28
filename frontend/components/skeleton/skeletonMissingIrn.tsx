import React from "react";

export default function SkeletonMissingIrn() {
  return (
    <div className="h-[29vh] w-[45%] ml-7 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="w-full border-b border-gray-200 px-4 py-2 bg-gray-50">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Scrollable skeleton list */}
      <div className="flex-1 overflow-y-auto">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-full border-b border-gray-200 px-4 py-2 flex items-center justify-between animate-pulse"
          >
            {/* Invoice Number */}
            <div className="flex-1">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>

            {/* GSTIN */}
            <div className="flex-1 flex justify-center">
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>

            {/* Date */}
            <div className="flex-1 flex justify-end">
              <div className="h-3 w-14 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
