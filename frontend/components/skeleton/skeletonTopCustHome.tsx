import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonTopCustomers: React.FC = () => {
  const placeholderRows = Array.from({ length: 5 });

  return (
    <div className="bg-white mx-3 px-3 my-2 h-full rounded-sm">
      {placeholderRows.map((_, ind) => (
        <div
          key={ind}
          className="flex items-center gap-3 p-3 border-b border-gray-200"
        >
          {/* Profile picture placeholder */}
          <Skeleton className="w-10 h-10 rounded-full" />

          {/* Name and email placeholders */}
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>

          {/* Amount placeholder */}
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonTopCustomers;
