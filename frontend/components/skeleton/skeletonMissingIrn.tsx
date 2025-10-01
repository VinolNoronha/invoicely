import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonMissingIrn: React.FC = () => {
  return (
    <div className="h-[29vh] w-[45%] ml-7 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="w-full border-b border-gray-200 px-4 py-2 bg-gray-50">
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      {/* Scrollable skeleton list */}
      <div className="flex-1 overflow-y-auto">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-full border-b border-gray-200 px-4 py-2 flex items-center justify-between"
          >
            {/* Invoice Number */}
            <div className="flex-1">
              <Skeleton className="h-3 w-16 rounded" />
            </div>

            {/* GSTIN */}
            <div className="flex-1 flex justify-center">
              <Skeleton className="h-3 w-24 rounded" />
            </div>

            {/* Date */}
            <div className="flex-1 flex justify-end">
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonMissingIrn;
