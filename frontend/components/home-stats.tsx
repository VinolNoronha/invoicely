import React, { ReactElement } from "react";

interface stats {
  title: string;
  number: string;
  icon: ReactElement;
}

export default function HomeStats({ data }: { data: stats }) {
  return (
    <div className="w-1/5 h-30/31 flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4">
      <div className="flex gap-2 items-center w-full">
        {data.icon}
        <p className="text-sm font-medium text-black">{data.title}</p>
      </div>

      <div className="bg-white h-full w-full p-4 rounded-sm flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{data.number}</span>
      </div>
    </div>
  );
}
