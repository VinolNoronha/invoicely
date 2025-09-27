import React from "react";

const SkeletonCard = () => {
  return (
    <div className="w-1/5 h-30/31 flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4 animate-pulse">
      <div className="flex gap-2 items-center w-full">
        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
        <div className="w-20 h-4 bg-gray-300 rounded"></div>
      </div>

      <div className="bg-white h-full w-full p-4 rounded-sm flex items-center justify-center">
        <div className="w-16 h-8 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

const SkeletonHomeStats = () => {
  return (
    <section className="flex items-center justify-around h-1/4 w-full">
      {Array(4)
        .fill(0)
        .map((_, index) => (
          <SkeletonCard key={index} />
        ))}
    </section>
  );
};

export default SkeletonHomeStats;
