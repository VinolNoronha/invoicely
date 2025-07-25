import { columns } from "./_data-table/columns";
import { DataTable } from "./_data-table/data-table";

type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ];
}

export default async function page() {
  const data = await getData();

  return (
    <section className="h-20/21 bg-yellow-30 px-5 flex flex-col gap-7 w-30/31 ">
      <div className="container mx-auto">
        <DataTable />
      </div>
    </section>
  );
}
