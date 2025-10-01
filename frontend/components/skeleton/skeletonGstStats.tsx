import React from "react";
import { Skeleton } from "../ui/skeleton";

export default function SkeletonGstStats() {
  return (
    <section className="flex items-center justify-around h-full w-full">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1/5 h-30/31 flex flex-col gap-3 bg-gray-50 rounded-md p-4"
        >
          {/* Header */}
          <div className="flex gap-2 items-center w-full">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          {/* Content */}
          <div className="bg-white h-full w-full p-4 rounded-sm flex items-center justify-center">
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        </div>
      ))}
    </section>
  );
}
