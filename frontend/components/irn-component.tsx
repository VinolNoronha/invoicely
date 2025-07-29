import React from "react";
import Irnlist from "./ui/Irnlist";

const data = [
  {
    invoice_num: "INV-007",
    GST_IN: "27AAC098348",
    dated: "25/05/21",
  },
  {
    invoice_num: "INV-007",
    GST_IN: "27AAC098348",
    dated: "25/05/21",
  },
  {
    invoice_num: "INV-007",
    GST_IN: "27AAC098348",
    dated: "25/05/21",
  },
  {
    invoice_num: "INV-007",
    GST_IN: "27AAC098348",
    dated: "25/05/21",
  },
  {
    invoice_num: "INV-007",
    GST_IN: "27AAC098348",
    dated: "25/05/21",
  },
  {
    invoice_num: "INV-007",
    GST_IN: "27AAC098348",
    dated: "25/05/21",
  },
  {
    invoice_num: "INV-007",
    GST_IN: "27AAC098348",
    dated: "25/05/21",
  },
  {
    invoice_num: "INV-007",
    GST_IN: "27AAC098348",
    dated: "25/05/21",
  },
];

export default function Irn() {
  return (
    <div className="h-[29vh] w-[45%] ml-7 flex flex-col overflow-hidden  bg-gray-50 rounded-md">
      <div className="w-full">
        <p className="text-sm font-medium pl-3 text-black hover:underline hover:decoration-2 mt-2 hover:decoration-blue-600">
          Missing IRN
        </p>
      </div>
      <div className="h-[90%] w-full flex overflow-y-scroll justify-center mt-1">
        <div className="h-[90%] w-[95%]  rounded-md">
          {data.map((ele, ind) => {
            return <Irnlist ind={ind} key={ind} data={ele} />;
          })}
        </div>
      </div>
    </div>
  );
}
