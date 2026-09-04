"use client";

import { useMemo, useState } from "react";
import ReconciliationStats from "./reconciliation-stats";
import ReconciliationActions from "./reconciliation-actions";
import ReconciliationTable, {
  ReconciliationRecord,
} from "./reconciliation-table";

import {
  runReconciliation,
  updateManualReconciliationStatus,
  explainDiscrepancy,
  getInvoiceReconciliationRow,
  type GSTR2BRecordInput,
} from "@/lib/reconciliation-actions";

type InvoiceRow = {
  id: string;
  invoice_no: string;
  supplier_gstin: string;
  total_tax: number;
  total_taxable_amt: number;
  reconciliation_status: string | null;
  confidence_score: number | null;
  ai_match_reason: string | null;
  gstr2b_taxable_value: number | null;
  gstr2b_total_tax: number | null;
};

// Maps the backend's statuses into the 4 UI buckets. fuzzy_matched counts
// as fully matched (GSTIN + tax already agree, only formatting differs).
// tax_mismatch_explained is still a "review" row — the AI added context,
// it didn't resolve the discrepancy, a human still acts on suggested_action.
function toUiStatus(status: string | null): ReconciliationRecord["status"] {
  if (status === "matched" || status === "fuzzy_matched") return "matched";
  if (status === "tax_mismatch" || status === "tax_mismatch_explained")
    return "review";
  if (status === "unmatched") return "unmatched";
  return "pending";
}

function toRecords(rows: InvoiceRow[]): ReconciliationRecord[] {
  return rows.map((row) => ({
    id: row.id,
    invoiceNumber: row.invoice_no,
    supplierGstin: row.supplier_gstin,
    invoiceTax: row.total_tax,
    invoiceTaxableValue: row.total_taxable_amt,
    gstr2bTax: row.gstr2b_total_tax,
    gstr2bTaxableValue: row.gstr2b_taxable_value,
    confidence: row.confidence_score,
    reason: row.ai_match_reason ?? "Not yet reconciled.",
    status: toUiStatus(row.reconciliation_status),
    hasAiExplanation: row.reconciliation_status === "tax_mismatch_explained",
  }));
}

export default function ReconciliationClient({
  initialRows,
}: {
  initialRows: InvoiceRow[];
}) {
  const [rows, setRows] = useState<InvoiceRow[]>(initialRows);
  const [gstr2bRecords, setGstr2bRecords] = useState<GSTR2BRecordInput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [lastRunStats, setLastRunStats] = useState<{
    totalDbInvoices: number;
    totalGstr2bRecords: number;
    processingTimeSeconds: number;
  } | null>(null);

  const records = useMemo(() => toRecords(rows), [rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const matched = rows.filter(
      (r) =>
        r.reconciliation_status === "matched" ||
        r.reconciliation_status === "fuzzy_matched",
    ).length;
    const exceptions = rows.filter(
      (r) =>
        r.reconciliation_status === "tax_mismatch" ||
        r.reconciliation_status === "tax_mismatch_explained" ||
        r.reconciliation_status === "unmatched",
    ).length;
    const pending = rows.filter((r) => !r.reconciliation_status).length;
    const verifiedItc = rows
      .filter(
        (r) =>
          r.reconciliation_status === "matched" ||
          r.reconciliation_status === "fuzzy_matched",
      )
      .reduce((acc, r) => acc + (r.total_tax || 0), 0);

    return {
      totalProcessed: total - pending,
      matchRate: total > 0 ? Math.round((matched / total) * 100) : 0,
      matchedCount: matched,
      verifiedItc,
      exceptions,
      pending,
    };
  }, [rows]);

  async function handleRun() {
    if (gstr2bRecords.length === 0) {
      alert("Upload a GSTR-2B file first.");
      return;
    }
    setIsRunning(true);
    try {
      const result = await runReconciliation(gstr2bRecords);
      setLastRunStats({
        totalDbInvoices: result.total_db_invoices,
        totalGstr2bRecords: result.total_gstr2b_records,
        processingTimeSeconds: result.processing_time_seconds,
      });
      setRows((current) =>
        current.map((row) => {
          const updated = result.updated_records.find(
            (u) => u.invoice_id === row.id,
          );
          return updated
            ? {
                ...row,
                reconciliation_status: updated.reconciliation_status,
                confidence_score: updated.confidence_score,
                ai_match_reason: updated.ai_match_reason,
                gstr2b_taxable_value: updated.gstr2b_taxable_value,
                gstr2b_total_tax: updated.gstr2b_total_tax,
              }
            : row;
        }),
      );
    } catch (err) {
      console.error(err);
      alert("Reconciliation run failed. Check the console for details.");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleAccept(id: string) {
    const updated = await updateManualReconciliationStatus(
      id,
      "matched",
      "Manually approved after AI review",
      100,
    );
    setRows((current) =>
      current.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    );
  }

  async function handleReject(id: string) {
    const updated = await updateManualReconciliationStatus(
      id,
      "unmatched",
      "Match rejected during manual review",
      0,
    );
    setRows((current) =>
      current.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    );
  }

  async function handleExplain(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    // Idempotency: an explanation already exists for this row — just show
    // it, no need to re-call Gemini for something already stored.
    if (row.reconciliation_status === "tax_mismatch_explained") {
      return;
    }

    if (row.gstr2b_total_tax === null || row.gstr2b_taxable_value === null) {
      setExplainError("No GSTR-2B comparison data available for this invoice.");
      return;
    }

    setExplainError(null);
    setExplainingId(id);
    try {
      await explainDiscrepancy(
        id,
        {
          invoice_number: row.invoice_no,
          taxable_value: row.total_taxable_amt,
          total_tax: row.total_tax,
          vendor_gstin: row.supplier_gstin,
        },
        {
          invoice_number: row.invoice_no,
          taxable_value: row.gstr2b_taxable_value,
          total_tax: row.gstr2b_total_tax,
          vendor_gstin: row.supplier_gstin,
        },
      );

      const updated = await getInvoiceReconciliationRow(id);
      setRows((current) =>
        current.map((r) => (r.id === id ? { ...r, ...updated } : r)),
      );
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message === "RATE_LIMITED") {
        setExplainError(
          "AI analysis temporarily busy. Please retry in a few seconds.",
        );
      } else {
        setExplainError("Failed to get AI explanation. Please try again.");
      }
    } finally {
      setExplainingId(null);
    }
  }

  return (
    <>
      <ReconciliationStats stats={stats} />
      <ReconciliationActions
        onUploaded={setGstr2bRecords}
        onRun={handleRun}
        isRunning={isRunning}
        uploadedCount={gstr2bRecords.length}
        lastRunStats={lastRunStats}
      />
      <ReconciliationTable
        records={records}
        onAccept={handleAccept}
        onReject={handleReject}
        onExplain={handleExplain}
        explainingId={explainingId}
        explainError={explainError}
        onDismissExplainError={() => setExplainError(null)}
      />
    </>
  );
}

// "use client";

// import { useMemo, useState } from "react";
// import ReconciliationStats from "./reconciliation-stats";
// import ReconciliationActions from "./reconciliation-actions";
// import ReconciliationTable, {
//   ReconciliationRecord,
// } from "./reconciliation-table";

// import {
//   runReconciliation,
//   updateManualReconciliationStatus,
//   type GSTR2BRecordInput,
// } from "@/lib/reconciliation-actions";

// // Shape returned by getReconciliationResultsServer — matches the Invoices
// // columns we select there.
// type InvoiceRow = {
//   id: string;
//   invoice_no: string;
//   supplier_gstin: string;
//   total_tax: number;
//   reconciliation_status: string | null;
//   confidence_score: number | null;
//   ai_match_reason: string | null;
//   gstr2b_taxable_value: number | null;
//   gstr2b_total_tax: number | null;
// };

// // Maps the backend's 4-tier status into the 3 buckets the UI tabs use.
// // fuzzy_matched counts as fully matched — GSTIN + tax already agree, only
// // the invoice number formatting differs, which needs no human judgment.
// function toUiStatus(status: string | null): ReconciliationRecord["status"] {
//   if (status === "matched" || status === "fuzzy_matched") return "matched";
//   if (status === "tax_mismatch") return "review";
//   if (status === "unmatched") return "unmatched";
//   return "pending";
// }

// function toRecords(rows: InvoiceRow[]): ReconciliationRecord[] {
//   return rows.map((row) => ({
//     id: row.id,
//     invoiceNumber: row.invoice_no,
//     supplierGstin: row.supplier_gstin,
//     invoiceTax: row.total_tax,
//     gstr2bTax: row.gstr2b_total_tax,
//     confidence: row.confidence_score,
//     reason: row.ai_match_reason ?? "Not yet reconciled.",
//     status: toUiStatus(row.reconciliation_status),
//   }));
// }

// export default function ReconciliationClient({
//   initialRows,
// }: {
//   initialRows: InvoiceRow[];
// }) {
//   const [rows, setRows] = useState<InvoiceRow[]>(initialRows);
//   const [gstr2bRecords, setGstr2bRecords] = useState<GSTR2BRecordInput[]>([]);
//   const [isRunning, setIsRunning] = useState(false);

//   const records = useMemo(() => toRecords(rows), [rows]);

//   const stats = useMemo(() => {
//     const total = rows.length;
//     const matched = rows.filter(
//       (r) =>
//         r.reconciliation_status === "matched" ||
//         r.reconciliation_status === "fuzzy_matched",
//     ).length;
//     const exceptions = rows.filter(
//       (r) =>
//         r.reconciliation_status === "tax_mismatch" ||
//         r.reconciliation_status === "unmatched",
//     ).length;
//     const pending = rows.filter((r) => !r.reconciliation_status).length;
//     const verifiedItc = rows
//       .filter(
//         (r) =>
//           r.reconciliation_status === "matched" ||
//           r.reconciliation_status === "fuzzy_matched",
//       )
//       .reduce((acc, r) => acc + (r.total_tax || 0), 0);

//     return {
//       totalProcessed: total - pending,
//       matchRate: total > 0 ? Math.round((matched / total) * 100) : 0,
//       matchedCount: matched,
//       verifiedItc,
//       exceptions,
//       pending,
//     };
//   }, [rows]);

//   async function handleRun() {
//     if (gstr2bRecords.length === 0) {
//       alert("Upload a GSTR-2B file first.");
//       return;
//     }
//     setIsRunning(true);
//     try {
//       const result = await runReconciliation(gstr2bRecords);
//       // Backend already wrote to Supabase; reflect its response directly
//       // instead of re-fetching, so the UI updates the instant the run finishes.
//       setRows((current) =>
//         current.map((row) => {
//           const updated = result.updated_records.find(
//             (u) => u.invoice_id === row.id,
//           );
//           return updated
//             ? {
//                 ...row,
//                 reconciliation_status: updated.reconciliation_status,
//                 confidence_score: updated.confidence_score,
//                 ai_match_reason: updated.ai_match_reason,
//                 gstr2b_taxable_value: updated.gstr2b_taxable_value,
//                 gstr2b_total_tax: updated.gstr2b_total_tax,
//               }
//             : row;
//         }),
//       );
//     } catch (err) {
//       console.error(err);
//       alert("Reconciliation run failed. Check the console for details.");
//     } finally {
//       setIsRunning(false);
//     }
//   }

//   async function handleAccept(id: string) {
//     const updated = await updateManualReconciliationStatus(
//       id,
//       "matched",
//       "Manually approved after AI review",
//       100,
//     );
//     setRows((current) =>
//       current.map((r) => (r.id === id ? { ...r, ...updated } : r)),
//     );
//   }

//   async function handleReject(id: string) {
//     const updated = await updateManualReconciliationStatus(
//       id,
//       "unmatched",
//       "Match rejected during manual review",
//       0,
//     );
//     setRows((current) =>
//       current.map((r) => (r.id === id ? { ...r, ...updated } : r)),
//     );
//   }

//   return (
//     <>
//       <ReconciliationStats stats={stats} />
//       <ReconciliationActions
//         onUploaded={setGstr2bRecords}
//         onRun={handleRun}
//         isRunning={isRunning}
//         uploadedCount={gstr2bRecords.length}
//       />
//       <ReconciliationTable
//         records={records}
//         onAccept={handleAccept}
//         onReject={handleReject}
//       />
//     </>
//   );
// }
