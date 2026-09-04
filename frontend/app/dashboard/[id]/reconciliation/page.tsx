import { getUserServer } from "@/lib/actions";
import { getReconciliationResultsServer } from "@/lib/reconciliation-actions";
import ReconciliationHeader from "@/components/reconciliation-header";
import ReconciliationClient from "@/components/reconciliation-client";
import { redirect } from "next/navigation";

export default async function ReconciliationPage() {
  const user = await getUserServer();
  if (!user) redirect("/login");

  const invoiceRows = await getReconciliationResultsServer(user.id);

  return (
    <div className="flex flex-col gap-6 p-6">
      <ReconciliationHeader />
      <ReconciliationClient initialRows={invoiceRows} />
    </div>
  );
}

// import ReconciliationHeader from "@/components/reconciliation-header";
// import ReconciliationStats from "@/components/reconciliation-stats";
// import ReconciliationActions from "@/components/reconciliation-actions";
// import ReconciliationTable from "@/components/reconciliation-table";

// export default function ReconciliationPage() {
//   return (
//     <div className="flex flex-col gap-6 p-6">
//       <ReconciliationHeader />

//       <ReconciliationStats />

//       <ReconciliationActions />

//       <ReconciliationTable />
//     </div>
//   );
// }
