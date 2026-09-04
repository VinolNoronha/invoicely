import React from "react";
import PendingInvoiceRow from "./ui/PendingInvoiceRow";
import { getPendingInvoicesServer, getUserServer } from "@/lib/actions";

export default async function PendingInvoices() {
  const user = await getUserServer();
  const id = user?.id;
  const invoices = await getPendingInvoicesServer(id);

  if (invoices.length === 0) {
    return (
      <div className="bg-white mx-3 px-3 my-2 py-6 rounded-sm text-center text-sm text-gray-500">
        No pending invoices — you're all caught up.
      </div>
    );
  }

  const visible = invoices.slice(0, 5);

  return (
    <div className="bg-white mx-3 px-3 my-2 rounded-sm">
      {visible.map((inv, ind) => (
        <PendingInvoiceRow
          key={inv.id}
          ind={ind}
          invoice={inv}
          isLast={ind === visible.length - 1}
        />
      ))}
    </div>
  );
}
