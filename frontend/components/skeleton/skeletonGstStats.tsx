import React from "react";

export default function SkeletonGstStats() {
  return (
    <section className="flex items-center justify-around h-full w-full">
      {[1, 2, 3, 4].map((i) => (
        <div
          className="w-1/5 h-30/31 flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4 animate-pulse"
          key={i}
        >
          <div className="flex gap-2 items-center w-full">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>

          <div className="bg-white h-full w-full p-4 rounded-sm flex items-center justify-center">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </section>
  );
}
