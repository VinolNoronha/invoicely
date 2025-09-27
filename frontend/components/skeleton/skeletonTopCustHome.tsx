// components/ui/SkeletonTopCustomers.tsx
import React from "react";

export default function SkeletonTopCustomers() {
  // let's assume we show 5 placeholder rows
  const placeholderRows = Array.from({ length: 5 });

  return (
    <div className="bg-white mx-3 px-3 my-2 h-full rounded-sm">
      {placeholderRows.map((_, ind) => (
        <div
          key={ind}
          className="flex items-center gap-3 p-3 border-b border-gray-200 animate-pulse"
        >
          {/* Profile picture placeholder */}
          <div className="w-10 h-10 rounded-full bg-gray-300" />

          {/* Name and email placeholders */}
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>

          {/* Amount placeholder */}
          <div className="h-4 w-16 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );
}
