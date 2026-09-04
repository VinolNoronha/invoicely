"use server";

import { redirect } from "next/navigation";
import { createClientServer } from "./supabase/server";
import { revalidatePath } from "next/cache";
import { createHash } from "crypto";

export async function signInWithGoogle() {
  const supabase = await createClientServer();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google Sign-In Error:", error);
    return;
  }

  redirect(data.url!);
}

export async function invoiceData(formData: FormData) {
  const supabase = await createClientServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }
  const pfpFile = formData.get("pfp") as File | null;

  const data = {
    user_id: user.id, // was missing entirely in the pre-schema-change version
    client_name: String(formData.get("client_name")),
    email: String(formData.get("email")),
    total_amount: parseFloat(String(formData.get("total_amount") || 0)),
    total_taxable_amt: parseFloat(
      String(formData.get("total_taxable_amount") || 0),
    ),
    supplier_gstin: String(formData.get("supplier_gstin") || ""),
    buyer_gstin: String(formData.get("buyer_gstin") || ""),
    invoice_type: String(formData.get("invoice_type") || ""),
    invoice_no: String(formData.get("invoice_no")),
    cgst: parseInt(String(formData.get("cgst") || 0), 10),
    sgst: parseInt(String(formData.get("sgst") || 0), 10),
    igst: parseInt(String(formData.get("igst") || 0), 10),
    total_tax: parseFloat(String(formData.get("total_tax") || 0)),
    //op_gst: parseFloat(String(formData.get("op_gst") || 0)),
    dated: String(formData.get("dated")),
    status: formData.get("status") === "success",
    irn: formData.get("irn") === "success",
    pfp: pfpFile && pfpFile.size > 0 ? pfpFile.name : null,
  };

  const { error } = await supabase.from("Invoices").insert([data]);

  if (error) {
    console.error("Error inserting invoice:", error);
    throw new Error("Failed to insert invoice");
  }

  revalidatePath(`/dashboard/${user.id}/invoices`);
  redirect(`/dashboard/${user.id}/invoices`);
}

//get user for server components which are using suspense
export async function getUserServer() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

//homepage homestats server functions
export async function totalInvoicesCountServer(
  userId: string | undefined,
  from?: string,
  to?: string,
) {
  const supabase = await createClientServer();
  let query = supabase
    .from("Invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);
  const { count, error } = await query;

  if (error) throw error;
  return count;
}

export async function totalCustomerCountServer(
  userId: string | undefined,
  from?: string,
  to?: string,
) {
  const supabase = await createClientServer();

  let query = supabase
    .from("Invoices")
    .select("client_name")
    .eq("user_id", userId)
    .not("client_name", "is", null);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);

  const { data, error } = await query;

  if (error) throw error;

  const unique = new Set(
    (data ?? [])
      .map((r) => r.client_name?.trim().toLowerCase())
      .filter(Boolean),
  );

  return unique.size || 0;
}

export async function totalPendingRevServer(
  userId: string | undefined,
  from?: string,
  to?: string,
) {
  const supabase = await createClientServer();
  let query = supabase
    .from("Invoices")
    .select("total_amount")
    .eq("user_id", userId)
    .eq("status", false);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);

  const { data, error } = await query;
  if (error) throw error;

  const pending = data?.reduce(
    (acc, item) => acc + (item.total_amount || 0),
    0,
  );
  return Number(pending?.toFixed(1)) || 0;
}

export async function totalRevServer(
  userId: string | undefined,
  from?: string,
  to?: string,
) {
  const supabase = await createClientServer();

  let query = supabase
    .from("Invoices")
    .select("total_amount")
    .eq("user_id", userId);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);

  const { data, error } = await query;

  if (error) throw error;

  const total = data?.reduce((acc, item) => acc + (item.total_amount || 0), 0);
  return Number(total?.toFixed(1)) || 0;
}

// home page top customers server function
// NOTE: does not reference the old GSTIN column at all, so dropping it
// doesn't affect this function directly. Only .eq("id"...) -> .eq("user_id"...)
// needed fixing here.
export async function getTopCustomersServer(userId: string | undefined) {
  const supabase = await createClientServer();
  let { data: invoices, error } = await supabase
    .from("Invoices")
    .select("client_name, email, pfp, total_amount")
    .eq("user_id", userId)
    .not("client_name", "is", null);

  if (error) throw error;

  const clientDetails: {
    [key: string]: {
      total_amount: number;
      email?: string;
      pfp?: string;
    };
  } = {};

  invoices?.forEach((invoice) => {
    const client = invoice.client_name;
    const amount = invoice.total_amount || 0;

    if (client) {
      if (!clientDetails[client]) {
        clientDetails[client] = {
          total_amount: 0,
          email: invoice.email,
          pfp: invoice.pfp,
        };
      }
      clientDetails[client].total_amount += amount;
    }
  });

  const topCustomers = Object.entries(clientDetails)
    .map(([client_name, details]) => ({
      id: client_name,
      client_name,
      total_amount: Number(details.total_amount.toFixed(1)),
      email: details.email || null,
      pfp: details.pfp || null,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);

  return topCustomers.slice(0, 5);
}

export async function deleteInvoice(invoiceNum: string | null) {
  const supabase = await createClientServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("Invoices")
    .delete()
    .eq("invoice_no", invoiceNum);

  if (error) {
    console.log("error deleting the invoice");
    throw new Error("Failed to delete the invoice");
  }

  return { success: true };
}

//gst stats page server functions
export async function getTotalGstCollectionServer(
  userId: string | undefined,
  from?: string,
  to?: string,
) {
  const supabase = await createClientServer();
  let query = supabase
    .from("Invoices")
    .select("total_tax")
    .eq("user_id", userId)
    .not("client_name", "is", null);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);

  const { data: total_tax, error } = await query;

  if (error) throw error;

  const totalGstColl = total_tax?.reduce((acc, obj) => {
    return acc + obj.total_tax;
  }, 0);

  return Number(totalGstColl?.toFixed(2));
}

export async function getTotalTaxableAmountServer(
  userId: string | undefined,
  from?: string,
  to?: string,
) {
  const supabase = await createClientServer();
  let query = supabase
    .from("Invoices")
    .select("total_taxable_amt")
    .eq("user_id", userId)
    .not("client_name", "is", null);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);

  const { data: total_amt, error } = await query;

  if (error) throw error;

  const total_tax_amt = total_amt?.reduce((acc, ele) => {
    return acc + ele.total_taxable_amt;
  }, 0);

  return Number(total_tax_amt?.toFixed(2));
}

export async function getGrossCollectionServer(
  userId: string | undefined,
  from?: string,
  to?: string,
) {
  const supabase = await createClientServer();
  let query = supabase
    .from("Invoices")
    .select("total_amount")
    .eq("user_id", userId)
    .not("client_name", "is", null);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);

  const { data: total_amt, error } = await query;

  if (error) throw error;

  const total_amount = total_amt?.reduce((acc, ele) => {
    return acc + ele.total_amount;
  }, 0);

  return Number(total_amount?.toFixed(2));
}

// Same GSTIN-display logic as utils.ts's getDisplayGstin, duplicated here
// since this file runs in a server-only context and utils.ts instantiates
// a browser Supabase client at module scope (don't import across that
// boundary).
function resolveDisplayGstin(row: {
  invoice_type?: string | null;
  supplier_gstin?: string | null;
  buyer_gstin?: string | null;
}) {
  if (row.invoice_type === "sales") return row.buyer_gstin ?? null;
  if (row.invoice_type === "purchase") return row.supplier_gstin ?? null;
  return row.supplier_gstin ?? row.buyer_gstin ?? null;
}

//gst missing irn
export async function getMissingIrnDataServer(userId: string | undefined) {
  const supabase = await createClientServer();
  let { data, error } = await supabase
    .from("Invoices")
    .select("invoice_no, dated, invoice_type, supplier_gstin, buyer_gstin")
    .eq("user_id", userId)
    .eq("irn", false);

  if (error) throw error;

  const dta = data?.map((obj) => {
    return {
      invoice_num: obj.invoice_no,
      GST_IN: resolveDisplayGstin(obj),
      dated: obj.dated,
    };
  });

  return dta;
}

// Inserts a user-confirmed invoice after PDF extraction + review in
// EditInvoiceModal. This is the ONLY place an extracted invoice actually
// gets written to Supabase — /extract on the FastAPI side no longer inserts
// anything itself, it only returns the parsed data for review.
export async function createInvoiceFromExtraction(formData: FormData) {
  const supabase = await createClientServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("No PDF file was provided");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Duplicate detection is now based on the actual file content, not
  // extracted fields (invoice_no can be a randomly-generated TEMP- value
  // when extraction can't find a real one, which made field-based dedup
  // unreliable). Two uploads of the identical PDF always hash identically
  // regardless of what extraction did or didn't find inside it.
  const file_hash = createHash("sha256").update(buffer).digest("hex");

  // Check for a duplicate BEFORE uploading to storage, so we don't waste
  // a storage write on a file we're about to reject anyway.
  const { data: existing, error: checkError } = await supabase
    .from("Invoices")
    .select("invoice_no")
    .eq("user_id", user.id)
    .eq("file_hash", file_hash)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking for duplicate file_hash:", checkError);
    throw new Error("Failed to save invoice");
  }

  // A duplicate is an EXPECTED outcome, not a real error — return a
  // result instead of throwing, so Next.js doesn't log it as a server
  // error even though the client handles it gracefully. Throwing across
  // a server action boundary always gets logged server-side regardless
  // of whether the client catches it, which is noisy for something this
  // routine.
  if (existing) {
    return { success: false as const, error: "DUPLICATE_INVOICE" as const };
  }

  // Path convention: {user_id}/{file_hash}.pdf — using the hash as the
  // filename means re-uploading the identical file always resolves to the
  // identical storage path, so this is naturally idempotent at the
  // storage layer too, on top of the DB-level dedup check above.
  const pdf_path = `${user.id}/${file_hash}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("invoice-pdfs")
    .upload(pdf_path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading PDF to storage:", uploadError);
    throw new Error("Failed to upload invoice PDF");
  }

  const rawJsonField = formData.get("raw_json");

  const payload = {
    user_id: user.id,
    client_name: String(formData.get("client_name") || ""),
    email: (formData.get("email") as string) || null,
    total_amount: parseFloat(String(formData.get("total_amount") || 0)),
    total_taxable_amt: parseFloat(
      String(formData.get("total_taxable_amt") || 0),
    ),
    invoice_no: String(formData.get("invoice_no") || ""),
    cgst: parseFloat(String(formData.get("cgst") || 0)),
    sgst: parseFloat(String(formData.get("sgst") || 0)),
    igst: parseFloat(String(formData.get("igst") || 0)),
    //op_gst: parseFloat(String(formData.get("total_tax") || 0)),
    total_tax: parseFloat(String(formData.get("total_tax") || 0)),
    dated: (formData.get("dated") as string) || null,
    status: formData.get("status") === "true",
    irn: formData.get("irn") === "true",
    supplier_gstin: String(formData.get("supplier_gstin") || ""),
    buyer_gstin: String(formData.get("buyer_gstin") || ""),
    invoice_type: String(formData.get("invoice_type") || ""),
    raw_json: rawJsonField ? JSON.parse(String(rawJsonField)) : null,
    file_hash,
    pdf_path,
  };

  const { data, error } = await supabase
    .from("Invoices")
    .insert([payload])
    .select();

  if (error) {
    console.error("Error inserting extracted invoice:", error);
    if (error.code === "23505") {
      // Race-condition safety net: two near-simultaneous confirms of the
      // same file slipping past the check above — the DB constraint on
      // (user_id, file_hash) still catches it. Also returned, not thrown,
      // for the same reason as above.
      return { success: false as const, error: "DUPLICATE_INVOICE" as const };
    }
    throw new Error("Failed to save invoice");
  }

  revalidatePath(`/dashboard/${user.id}/invoices`);
  return { success: true as const, data };
}

// Generates a short-lived signed URL for viewing a stored invoice PDF.
// The invoice-pdfs bucket is private, so a fresh signed URL is required
// each time — permanent public links aren't possible (and wouldn't be
// appropriate for financial documents anyway).
export async function getInvoicePdfUrl(pdfPath: string) {
  const supabase = await createClientServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Defensive check: the storage RLS policy already scopes access to each
  // user's own folder, but verifying the path prefix here too means a bad
  // pdf_path (e.g. from stale/tampered client state) fails fast with a
  // clear error instead of a confusing storage-layer permission error.
  if (!pdfPath.startsWith(`${user.id}/`)) {
    throw new Error("You don't have access to this file");
  }

  const { data, error } = await supabase.storage
    .from("invoice-pdfs")
    .createSignedUrl(pdfPath, 60 * 5); // valid for 5 minutes

  if (error || !data) {
    console.error("Error creating signed URL for invoice PDF:", error);
    throw new Error("Failed to load invoice PDF");
  }

  return data.signedUrl;
}

//home stats changing
export type CashflowSummary = {
  cashInflow: number;
  pendingReceivables: number;
  pendingPayables: number;
  netCashflow: number;
};

export async function getCashflowSummaryServer(
  userId: string | undefined,
  from?: string,
  to?: string,
): Promise<CashflowSummary> {
  const supabase = await createClientServer();

  let query = supabase
    .from("Invoices")
    .select("total_amount, invoice_type, status")
    .eq("user_id", userId);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];

  const sum = (pred: (r: (typeof rows)[number]) => boolean) =>
    rows.filter(pred).reduce((acc, r) => acc + (r.total_amount || 0), 0);

  const cashInflow = sum(
    (r) => r.invoice_type === "sales" && r.status === true,
  );
  const pendingReceivables = sum(
    (r) => r.invoice_type === "sales" && r.status === false,
  );
  const pendingPayables = sum(
    (r) => r.invoice_type === "purchase" && r.status === false,
  );
  const paidPurchases = sum(
    (r) => r.invoice_type === "purchase" && r.status === true,
  );

  return {
    cashInflow: Number(cashInflow.toFixed(1)),
    pendingReceivables: Number(pendingReceivables.toFixed(1)),
    pendingPayables: Number(pendingPayables.toFixed(1)),
    netCashflow: Number((cashInflow - paidPurchases).toFixed(1)),
  };
}

export type PendingInvoice = {
  id: string;
  invoiceNo: string;
  clientName: string;
  totalAmount: number;
  dated: string;
  daysPending: number;
  dueDate: string | null;
};

// export async function getPendingInvoicesServer(
//   userId: string | undefined,
// ): Promise<PendingInvoice[]> {
//   const supabase = await createClientServer();

//   const { data, error } = await supabase
//     .from("Invoices")
//     .select("invoice_no, client_name, total_amount, dated, raw_json")
//     .eq("user_id", userId)
//     .eq("invoice_type", "sales")
//     .eq("status", false)
//     .not("client_name", "is", null)
//     .order("dated", { ascending: true }); // oldest pending first = highest priority

//   if (error) throw error;

//   const today = new Date();

//   return (data ?? []).map((inv) => {
//     const invoiceDate = new Date(inv.dated);
//     const daysPending = Math.max(
//       0,
//       Math.floor(
//         (today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
//       ),
//     );

//     // due_date is only present in raw_json for a minority of invoices,
//     // since extraction doesn't currently pull it out as a proper column.
//     // Shown opportunistically when available — never computed or guessed.
//     const rawJson = inv.raw_json as Record<string, unknown> | null;
//     const dueDate =
//       rawJson && typeof rawJson.due_date === "string" ? rawJson.due_date : null;

//     return {
//       id: inv.invoice_no,
//       invoiceNo: inv.invoice_no,
//       clientName: inv.client_name,
//       totalAmount: inv.total_amount,
//       dated: inv.dated,
//       daysPending,
//       dueDate,
//     };
//   });
// }

export async function getPendingInvoicesServer(
  userId: string | undefined,
): Promise<PendingInvoice[]> {
  const supabase = await createClientServer();

  const { data, error } = await supabase
    .from("Invoices")
    .select("invoice_no, client_name, total_amount, dated, raw_json")
    .eq("user_id", userId)
    .eq("invoice_type", "sales")
    .eq("status", false)
    .not("client_name", "is", null)
    .order("dated", { ascending: true }); // oldest pending first = highest priority

  if (error) throw error;

  const today = new Date();

  return (data ?? [])
    .map((inv) => {
      // Guard against null/malformed dates instead of letting them
      // silently resolve to epoch (new Date(null) === Jan 1 1970).
      if (!inv.dated) return null;
      const invoiceDate = new Date(inv.dated);
      if (isNaN(invoiceDate.getTime())) return null;

      const daysPending = Math.max(
        0,
        Math.floor(
          (today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      const rawJson = inv.raw_json as Record<string, unknown> | null;
      const dueDate =
        rawJson && typeof rawJson.due_date === "string"
          ? rawJson.due_date
          : null;

      return {
        id: inv.invoice_no,
        invoiceNo: inv.invoice_no,
        clientName: inv.client_name,
        totalAmount: inv.total_amount,
        dated: inv.dated,
        daysPending,
        dueDate,
      };
    })
    .filter((inv): inv is PendingInvoice => inv !== null);
}

//updated gst page functions
export type GstSummary = {
  outputGst: number;
  inputTaxCredit: number;
  netGstPayable: number;
  cgstSgstTotal: number;
  igstTotal: number;
};

export async function getGstSummaryServer(
  userId: string | undefined,
  from?: string,
  to?: string,
): Promise<GstSummary> {
  const supabase = await createClientServer();

  let query = supabase
    .from("Invoices")
    .select("invoice_type, cgst, sgst, igst")
    .eq("user_id", userId);

  if (from) query = query.gte("dated", from);
  if (to) query = query.lte("dated", to);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];

  const sumTax = (r: (typeof rows)[number]) =>
    (r.cgst || 0) + (r.sgst || 0) + (r.igst || 0);

  const outputGst = rows
    .filter((r) => r.invoice_type === "sales")
    .reduce((acc, r) => acc + sumTax(r), 0);

  const inputTaxCredit = rows
    .filter((r) => r.invoice_type === "purchase")
    .reduce((acc, r) => acc + sumTax(r), 0);

  const cgstSgstTotal = rows.reduce(
    (acc, r) => acc + (r.cgst || 0) + (r.sgst || 0),
    0,
  );
  const igstTotal = rows.reduce((acc, r) => acc + (r.igst || 0), 0);

  return {
    outputGst: Number(outputGst.toFixed(2)),
    inputTaxCredit: Number(inputTaxCredit.toFixed(2)),
    netGstPayable: Number((outputGst - inputTaxCredit).toFixed(2)),
    cgstSgstTotal: Number(cgstSgstTotal.toFixed(2)),
    igstTotal: Number(igstTotal.toFixed(2)),
  };
}

export async function getMonthlyGstChartServer(userId: string | undefined) {
  const supabase = await createClientServer();

  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  from.setDate(1);
  const fromStr = from.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("Invoices")
    .select("invoice_type, cgst, sgst, igst, dated")
    .eq("user_id", userId)
    .gte("dated", fromStr);

  if (error) throw error;

  const monthly: Record<string, { output: number; itc: number; date: Date }> =
    {};

  const cursor = new Date(from);
  for (let i = 0; i < 12; i++) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    monthly[`${year}-${month}`] = { output: 0, itc: 0, date: new Date(cursor) };
    cursor.setMonth(cursor.getMonth() + 1);
  }

  (data ?? []).forEach((inv) => {
    const [year, month] = inv.dated.split("-");
    const key = `${year}-${month}`;
    if (!monthly[key]) return;

    const tax = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);
    if (inv.invoice_type === "sales") monthly[key].output += tax;
    else if (inv.invoice_type === "purchase") monthly[key].itc += tax;
  });

  return Object.entries(monthly)
    .map(([, v]) => v)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ output, itc, date }) => ({
      month: `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`,
      output: Number(output.toFixed(2)),
      itc: Number(itc.toFixed(2)),
    }));
}

export type ReviewFlaggedInvoice = {
  invoiceNo: string;
  clientName: string;
  dated: string;
  computedTax: number;
  totalTax: number;
  difference: number;
};

// Flags invoices where cgst+sgst+igst doesn't match the stored total_tax
// within a small rounding tolerance — catches extraction errors (e.g. a
// misread digit on one field) before they reach GST filing.
export async function getReviewFlaggedInvoicesServer(
  userId: string | undefined,
): Promise<ReviewFlaggedInvoice[]> {
  const supabase = await createClientServer();
  const TOLERANCE = 1; // rupees, absorbs harmless rounding

  const { data, error } = await supabase
    .from("Invoices")
    .select("invoice_no, client_name, dated, cgst, sgst, igst, total_tax")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? [])
    .map((inv) => {
      const computedTax = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);
      const totalTax = inv.total_tax || 0;
      const difference = Math.abs(computedTax - totalTax);
      return {
        invoiceNo: inv.invoice_no,
        clientName: inv.client_name,
        dated: inv.dated,
        computedTax: Number(computedTax.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        difference: Number(difference.toFixed(2)),
      };
    })
    .filter((inv) => inv.difference > TOLERANCE)
    .sort((a, b) => b.difference - a.difference);
}

// // Inserts a user-confirmed invoice after PDF extraction + review in
// // EditInvoiceModal. This is the ONLY place an extracted invoice actually
// // gets written to Supabase — /extract on the FastAPI side no longer inserts
// // anything itself, it only returns the parsed data for review.
// export async function createInvoiceFromExtraction(payload: {
//   client_name: string;
//   email?: string | null;
//   total_amount: number;
//   total_taxable_amt: number;
//   invoice_no: string;
//   cgst: number;
//   sgst: number;
//   igst: number;
//   op_gst: number;
//   dated: string | null;
//   status: boolean;
//   irn: boolean;
//   supplier_gstin: string;
//   buyer_gstin: string;
//   invoice_type: string;
//   raw_json?: unknown;
// }) {
//   const supabase = await createClientServer();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     throw new Error("User not authenticated");
//   }

//   const { data, error } = await supabase
//     .from("Invoices")
//     .insert([{ ...payload, dated: payload.dated || null, user_id: user.id }])
//     .select();

//   // if (error) {
//   //   console.error(
//   //     "Error inserting extracted invoice:",
//   //     JSON.stringify(error, null, 2),
//   //   );
//   //   if (error.code === "23505") {
//   //     throw new Error("DUPLICATE_INVOICE");
//   //   }
//   //   throw new Error("Failed to save invoice");
//   // }

//   if (error) {
//     console.error("Error inserting extracted invoice:", error);
//     if (error.code === "23505") {
//       // matches invoices_duplicate_prevention_idx
//       throw new Error("DUPLICATE_INVOICE");
//     }
//     throw new Error("Failed to save invoice");
//   }

//   revalidatePath(`/dashboard/${user.id}/invoices`);
//   return data;
// }

// -----------------------------------------------------------------------
// invoiceData (the form-submit action for creating a new invoice) still
// builds its payload with a single "GSTIN" field and hasn't been restored
// here yet. Once you drop the GSTIN column, rewrite its payload to build
// supplier_gstin/buyer_gstin/invoice_type instead before re-enabling it.
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// invoiceData (the form-submit action for creating a new invoice) still
// builds its payload with a single "GSTIN" field and hasn't been restored
// here yet. Once you drop the GSTIN column, rewrite its payload to build
// supplier_gstin/buyer_gstin/invoice_type instead before re-enabling it.
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// invoiceData (the form-submit action for creating a new invoice) still
// builds its payload with a single "GSTIN" field and hasn't been restored
// here yet. Once you drop the GSTIN column, rewrite its payload to build
// supplier_gstin/buyer_gstin/invoice_type instead before re-enabling it.
// -----------------------------------------------------------------------

// //before server actions before changin the db columns
// "use server";

// import { redirect } from "next/navigation";
// import { createClientServer } from "./supabase/server";
// import { revalidatePath } from "next/cache";

// export async function signInWithGoogle() {
//   const supabase = await createClientServer();

//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: "google",
//     options: {
//       redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`, // must match what’s in Supabase
//     },
//   });

//   if (error) {
//     console.error("Google Sign-In Error:", error);
//     return;
//   }

//   // Redirect to Google's OAuth screen
//   redirect(data.url!);
// }

// export async function invoiceData(formData: FormData) {
//   "use server";
//   const supabase = await createClientServer();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     throw new Error("User not authenticated");
//   }
//   const pfpFile = formData.get("pfp") as File | null;

//   const data = {
//     client_name: String(formData.get("client_name")),
//     email: String(formData.get("email")),
//     total_amount: parseFloat(String(formData.get("total_amount") || 0)),
//     total_taxable_amt: parseFloat(
//       String(formData.get("total_taxable_amount") || 0),
//     ),
//     GSTIN: String(formData.get("GSTIN")),
//     invoice_no: String(formData.get("invoice_no")),
//     cgst: parseInt(String(formData.get("cgst") || 0), 10),
//     sgst: parseInt(String(formData.get("sgst") || 0), 10),
//     igst: parseInt(String(formData.get("igst") || 0), 10),
//     op_gst: parseFloat(String(formData.get("op_gst") || 0)),
//     dated: String(formData.get("dated")),
//     status: formData.get("status") === "success", // Convert to boolean
//     irn: formData.get("irn") === "success", // Convert to boolean
//     pfp: pfpFile && pfpFile.size > 0 ? pfpFile.name : null,
//   };
//   console.log(data);

//   const { error } = await supabase.from("Invoices").insert([data]);

//   if (error) {
//     console.error("Error inserting invoice:", error);
//     throw new Error("Failed to insert invoice");
//   }

//   revalidatePath(`/dashboard/${user.id}/invoices`);
//   redirect(`/dashboard/${user.id}/invoices`);
// }

// //homepage homestats server functions
// export async function totalInvoicesCountServer(
//   userId: string | undefined,
//   from?: string,
//   to?: string,
// ) {
//   "use server";
//   const supabase = await createClientServer();
//   let query = supabase
//     .from("Invoices")
//     .select("*", { count: "exact", head: true })
//     .eq("id", userId);

//   if (from) query = query.gte("dated", from);
//   if (to) query = query.lte("dated", to);
//   const { count, error } = await query;

//   if (error) throw error;
//   return count;
// }

// export async function totalCustomerCountServer(
//   userId: string | undefined,
//   from?: string,
//   to?: string,
// ) {
//   "use server";
//   const supabase = await createClientServer();

//   let query = supabase
//     .from("Invoices")
//     .select("client_name")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (from) query = query.gte("dated", from);
//   if (to) query = query.lte("dated", to);

//   const { data, error } = await query;

//   if (error) throw error;

//   const unique = new Set(
//     (data ?? [])
//       .map((r) => r.client_name?.trim().toLowerCase())
//       .filter(Boolean),
//   );

//   return unique.size || 0;
// }

// export async function totalPendingRevServer(
//   userId: string | undefined,
//   from?: string,
//   to?: string,
// ) {
//   "use server";
//   const supabase = await createClientServer();
//   let query = supabase
//     .from("Invoices")
//     .select("total_amount")
//     .eq("id", userId)
//     .eq("status", false);

//   if (from) query = query.gte("dated", from);
//   if (to) query = query.lte("dated", to);

//   const { data, error } = await query;
//   if (error) throw error;

//   const pending = data?.reduce(
//     (acc, item) => acc + (item.total_amount || 0),
//     0,
//   );
//   return Number(pending?.toFixed(1)) || 0;
// }

// export async function totalRevServer(
//   userId: string | undefined,
//   from?: string,
//   to?: string,
// ) {
//   "use server";
//   const supabase = await createClientServer();

//   let query = supabase.from("Invoices").select("total_amount").eq("id", userId);

//   if (from) query = query.gte("dated", from);
//   if (to) query = query.lte("dated", to);

//   const { data, error } = await query;

//   if (error) throw error;

//   const total = data?.reduce((acc, item) => acc + (item.total_amount || 0), 0);
//   return Number(total?.toFixed(1)) || 0;
// }

// //get user for server components which are using suspense
// export async function getUserServer() {
//   "use server";
//   const supabase = await createClientServer();
//   const {
//     data: { user },
//     error,
//   } = await supabase.auth.getUser();

//   if (error || !user) {
//     return null;
//   }

//   return user;
// }

// //home page top customers server function
// export async function getTopCustomersServer(userId: string | undefined) {
//   "use server";
//   const supabase = await createClientServer();
//   let { data: invoices, error } = await supabase
//     .from("Invoices")
//     .select("client_name, email, pfp, total_amount")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (error) throw error;

//   const clientDetails: {
//     [key: string]: {
//       total_amount: number;
//       email?: string;
//       pfp?: string;
//     };
//   } = {};

//   invoices?.forEach((invoice) => {
//     const client = invoice.client_name;
//     // const pic = invoice.pfp;
//     // const email = invoice.email;
//     const amount = invoice.total_amount || 0;

//     if (client) {
//       if (!clientDetails[client]) {
//         clientDetails[client] = {
//           total_amount: 0,
//           email: invoice.email,
//           pfp: invoice.pfp,
//         };
//       }
//       clientDetails[client].total_amount += amount;
//     }
//   });

//   const topCustomers = Object.entries(clientDetails)
//     .map(([client_name, details]) => ({
//       client_name,
//       total_amount: Number(details.total_amount.toFixed(1)),
//       email: details.email || null,
//       pfp: details.pfp || null,
//     }))
//     .sort((a, b) => b.total_amount - a.total_amount);

//   return topCustomers.slice(0, 5);
// }

// //gst stats starts
// export async function getTotalGstCollectionServer(
//   userId: string | undefined,
//   from?: string,
//   to?: string,
// ) {
//   "use server";
//   const supabase = await createClientServer();
//   let query = supabase
//     .from("Invoices")
//     .select("op_gst")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (from) query = query.gte("dated", from);
//   if (to) query = query.lte("dated", to);

//   const { data: op_gst, error } = await query;

//   if (error) throw error;

//   const totalGstColl = op_gst?.reduce((acc, obj) => {
//     return acc + obj.op_gst;
//   }, 0);

//   return Number(totalGstColl?.toFixed(2));
// }

// export async function getTotalTaxableAmountServer(
//   userId: string | undefined,
//   from?: string,
//   to?: string,
// ) {
//   "use server";
//   const supabase = await createClientServer();
//   let query = supabase
//     .from("Invoices")
//     .select("total_taxable_amt")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (from) query = query.gte("dated", from);
//   if (to) query = query.lte("dated", to);

//   const { data: total_amt, error } = await query;

//   if (error) throw error;

//   const total_tax_amt = total_amt?.reduce((acc, ele) => {
//     return acc + ele.total_taxable_amt;
//   }, 0);

//   return Number(total_tax_amt?.toFixed(2));
// }

// export async function getGrossCollectionServer(
//   userId: string | undefined,
//   from?: string,
//   to?: string,
// ) {
//   "use server";
//   const supabase = await createClientServer();
//   let query = supabase
//     .from("Invoices")
//     .select("total_amount")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (from) query = query.gte("dated", from);
//   if (to) query = query.lte("dated", to);

//   const { data: total_amt, error } = await query;

//   if (error) throw error;

//   const total_amount = total_amt?.reduce((acc, ele) => {
//     return acc + ele.total_amount;
//   }, 0);

//   return Number(total_amount?.toFixed(2));
// }

// //gst missing irn
// export async function getMissingIrnDataServer(userId: string | undefined) {
//   "use server";
//   const supabase = await createClientServer();
//   let { data, error } = await supabase
//     .from("Invoices")
//     .select("invoice_no, GSTIN, dated")
//     .eq("id", userId)
//     .eq("irn", false);

//   if (error) throw error;

//   const dta = data?.map((obj) => {
//     return {
//       invoice_num: obj.invoice_no,
//       GST_IN: obj.GSTIN,
//       dated: obj.dated,
//     };
//   });

//   return dta;
// }

// export async function deleteInvoice(invoiceNum: string | null) {
//   "use server";
//   const supabase = await createClientServer();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     throw new Error("User not authenticated");
//   }

//   const { error } = await supabase
//     .from("Invoices")
//     .delete()
//     .eq("invoice_no", invoiceNum);

//   if (error) {
//     console.log("error deleting the invoice");
//     throw new Error("Failed to delete the invoice");
//   }

//   return { success: true };
// }
