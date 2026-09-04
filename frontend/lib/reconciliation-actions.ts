"use server";

import { getUserServer } from "./actions";
import { createClientServer } from "./supabase/server";
import { revalidatePath } from "next/cache";

// ✅ New
const FASTAPI_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.FASTAPI_BASE_URL ||
  "https://invoicely-backend-yixi.onrender.com";

export type GSTR2BRecordInput = {
  gstin: string;
  inv_num: string;
  inv_date: string;
  taxable_value: number;
  total_tax: number;
};

export type ReconcileResult = {
  total_db_invoices: number;
  total_gstr2b_records: number;
  exact_matches: number;
  fuzzy_matches: number;
  tax_mismatches: number;
  unmatched: number;
  processing_time_seconds: number;
  updated_records: {
    invoice_id: string;
    invoice_no: string;
    supplier_gstin: string;
    reconciliation_status: string;
    confidence_score: number;
    ai_match_reason: string;
    gstr2b_taxable_value: number | null;
    gstr2b_total_tax: number | null;
  }[];
};

// Calls the FastAPI matcher, which handles both the matching AND writing
// results back to Supabase itself — this action's job is just to trigger
// it and hand the frontend a fresh view of the results afterward.
export async function runReconciliation(
  gstr2bRecords: GSTR2BRecordInput[],
): Promise<ReconcileResult> {
  const user = await getUserServer();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const res = await fetch(`${FASTAPI_URL}/api/v1/reconciliation/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      gstr2b_records: gstr2bRecords,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Reconciliation run failed:", errText);
    throw new Error("Failed to run reconciliation");
  }

  const result: ReconcileResult = await res.json();

  // FastAPI already updated Supabase directly, so this just tells Next.js
  // any cached server-rendered view of this page is stale.
  revalidatePath(`/dashboard/${user.id}/reconciliation`);

  return result;
}

// Reads back the current reconciliation state straight from Supabase for
// rendering the results table + KPI cards — no need to go through FastAPI
// again since the data already lives in Invoices after a run.
export async function getReconciliationResultsServer(
  userId: string | undefined,
) {
  const supabase = await createClientServer();

  const { data, error } = await supabase
    .from("Invoices")
    .select(
      "id, invoice_no, supplier_gstin, total_tax, total_taxable_amt, reconciliation_status, confidence_score, ai_match_reason, gstr2b_taxable_value, gstr2b_total_tax",
    )
    .eq("user_id", userId)
    .eq("invoice_type", "purchase");

  if (error) throw error;
  return data ?? [];
}

// Manual override for the accept/reject buttons in the "Needs Review" flow —
// direct Supabase update, doesn't touch the FastAPI backend at all.
export async function updateManualReconciliationStatus(
  invoiceId: string,
  status: "matched" | "unmatched",
  reason: string,
  confidenceScore: number,
) {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("Invoices")
    .update({
      reconciliation_status: status,
      ai_match_reason: reason,
      confidence_score: confidenceScore,
    })
    .eq("id", invoiceId)
    .select("reconciliation_status, confidence_score, ai_match_reason")
    .single();

  if (error) throw error;
  return data;
}

// Calls the on-demand Gemini (or mock) explanation endpoint for a single
// flagged invoice. FastAPI writes the combined reason, new status, and
// confidence score back to Supabase as a side effect — this just triggers
// that and surfaces rate-limit errors distinctly so the UI can show the
// specific "temporarily busy, retry" message rather than a generic failure.
export async function explainDiscrepancy(
  invoiceId: string,
  invoiceDetail: {
    invoice_number: string;
    taxable_value: number;
    total_tax: number;
    vendor_gstin: string;
  },
  gstr2bMatch: {
    invoice_number: string;
    taxable_value: number;
    total_tax: number;
    vendor_gstin: string;
  },
) {
  const user = await getUserServer();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const res = await fetch(
    `${FASTAPI_URL}/api/v1/reconciliation/explain-discrepancy?invoice_id=${invoiceId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_detail: invoiceDetail,
        gstr2b_match: gstr2bMatch,
      }),
    },
  );

  if (res.status === 429 || res.status === 503) {
    throw new Error("RATE_LIMITED");
  }

  if (!res.ok) {
    throw new Error("Failed to explain discrepancy");
  }

  revalidatePath(`/dashboard/${user.id}/reconciliation`);
  return res.json(); // { summary, root_cause, suggested_action }
}

// After explainDiscrepancy runs, FastAPI has already written the combined
// reason + new status + confidence to Supabase — re-fetch just this row
// rather than reconstructing the formatted string client-side, since the
// exact formatting lives server-side.
export async function getInvoiceReconciliationRow(invoiceId: string) {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("Invoices")
    .select(
      "id, reconciliation_status, confidence_score, ai_match_reason, gstr2b_taxable_value, gstr2b_total_tax",
    )
    .eq("id", invoiceId)
    .single();

  if (error) throw error;
  return data;
}
