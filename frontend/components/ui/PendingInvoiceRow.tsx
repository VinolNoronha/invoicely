import { Clock } from "lucide-react";
import React from "react";
import { formatINR } from "@/lib/utils";
import type { PendingInvoice } from "@/lib/actions";

export default function PendingInvoiceRow({
  invoice,
  ind,
  isLast,
}: {
  invoice: PendingInvoice;
  ind: number;
  isLast: boolean;
}) {
  const severityClass =
    invoice.daysPending > 60
      ? "text-red-600"
      : invoice.daysPending > 30
        ? "text-amber-600"
        : "text-gray-600";

  return (
    <div
      className={`bg-white h-16 sm:h-18 border border-x-0 border-t-0 ${
        isLast ? "border-b-0" : "border-b-neutral-400"
      }`}
    >
      <div className="flex items-center h-full gap-4">
        <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-100 border border-gray-300">
          <Clock className={`sm:h-4 sm:w-4 h-3.5 w-3.5 ${severityClass}`} />
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm sm:text-[16px] font-bold text-black">
            {invoice.clientName}
          </h3>
          <p className={`sm:text-sm text-xs font-medium ${severityClass}`}>
            {invoice.daysPending} days pending
            {invoice.dueDate ? ` · due ${invoice.dueDate}` : ""}
          </p>
        </div>

        <div className="mt-1 flex-grow flex justify-end text-xs sm:text-[16px] pr-1.5 text-black w-fit">
          <p>{formatINR(invoice.totalAmount)}</p>
        </div>
      </div>
    </div>
  );
}
