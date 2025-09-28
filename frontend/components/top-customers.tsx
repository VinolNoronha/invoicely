import React from "react";
import UserList from "./ui/UserList";
// import { getTopCustomers, getUser } from "@/lib/utils";
import { getTopCustomersServer, getUserServer } from "@/lib/actions";

interface Customer {
  client_name: string;
  total_amount: number;
  email?: string | null;
  pfp?: string | null;
}

export default async function TopCustomers() {
  // const [datatemp, setData] = useState<Customer[] | null>(null);
  const user = await getUserServer();
  const id = user?.id;
  const datatemp = await getTopCustomersServer(id);

  // useEffect(() => {
  //   async function fetchCustomers() {
  //     try {
  //       const user = await getUser();
  //       const id = user?.id;
  //       const data = await getTopCustomers(id);
  //       setData(data);
  //     } catch (error) {
  //       console.error("Failed to fetch customers:", error);
  //       setData([]); // Set to empty array instead of null on error
  //     }
  //   }
  //   fetchCustomers();
  // }, []);
  // console.log(datatemp);

  return (
    <div className="bg-white mx-3 px-3 my-2 rounded-sm">
      {datatemp?.map((curr, ind) => (
        <UserList key={curr.email} ind={ind} userData={curr} />
      ))}
    </div>
  );
}
