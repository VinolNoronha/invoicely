import React from "react";
import Irnlist from "./ui/Irnlist";
import { getMissingIrnData, getUser } from "@/lib/utils";
import { getMissingIrnDataServer, getUserServer } from "@/lib/actions";

type irnData = {
  invoice_num: string;
  GST_IN: string | null;
  dated: string;
};

export default async function Irn() {
  // const [data, setData] = useState<null | irnData[]>();
  const user = await getUserServer();
  const id = user?.id;
  const data = await getMissingIrnDataServer(id);

  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       const user = await getUser();
  //       const id = user?.id;
  //       const dta = await getMissingIrnData(id);
  //       setData(dta);
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   }
  //   fetchData();
  // }, []);

  return (
    <div className="h-[29vh] w-full sm:w-[calc(50%-0.75rem)] flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="w-full border-b border-gray-200 px-4 py-2 bg-gray-50">
        <p className="sm:text-sm text-xs font-semibold text-gray-800">
          Missing IRN
        </p>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {data && data.length > 0 ? (
          data.map((ele, ind) => <Irnlist key={ind} ind={ind} data={ele} />)
        ) : (
          <p className="text-gray-400 text-center py-4">No missing IRNs</p>
        )}
      </div>
    </div>
  );
}
