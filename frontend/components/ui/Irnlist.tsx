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
    <div
      className={`bg-white h-10 border border-x-0 border-t-0 border-b-neutral-400`}
    >
      <div className="flex items-center justify-around h-full gap-4 ">
        <div>
          <span className="text-md font-bold text-black">
            {data?.invoice_num || ""}
          </span>
        </div>
        <div>
          <h3 className="text-md text-black">{data?.GST_IN || ""}</h3>
        </div>
        <div>
          <p>{data?.dated || ""}</p>
        </div>
      </div>
    </div>
  );
}

// className="mt-1 flex-grow flex justify-end  text-md pr-1.5   text-black w-fit"
