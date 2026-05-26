import React from "react";
import { Skeleton } from "../ui/skeleton";

export default function SkeletonGstStats() {
  return (
    <section className="grid gap-3 sm:gap-0 grid-cols-1 sm:flex sm:items-center sm:justify-around sm:h-full sm:w-full">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="sm:w-1/5 sm:h-30/31 w-80 flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4"
        >
          {/* Icon + title */}
          <div className="flex gap-2 items-center w-full">
            <Skeleton className="h-5 w-5 rounded shrink-0" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>

          {/* Number */}
          <div className="bg-white h-full w-full p-4 rounded-sm flex items-center justify-center">
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
      ))}
    </section>
  );
}
