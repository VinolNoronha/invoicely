"use server";

import { redirect } from "next/navigation";
import { createClientServer } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function signInWithGoogle() {
  const supabase = await createClientServer();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`, // must match what’s in Supabase
    },
  });

  if (error) {
    console.error("Google Sign-In Error:", error);
    return;
  }

  // Redirect to Google's OAuth screen
  redirect(data.url!);
}

export async function invoiceData(formData: FormData) {
  "use server";
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
    client_name: String(formData.get("client_name")),
    email: String(formData.get("email")),
    total_amount: parseFloat(String(formData.get("total_amount") || 0)),
    total_taxable_amt: parseFloat(
      String(formData.get("total_taxable_amount") || 0)
    ),
    GSTIN: String(formData.get("GSTIN")),
    invoice_no: String(formData.get("invoice_no")),
    cgst: parseInt(String(formData.get("cgst") || 0), 10),
    sgst: parseInt(String(formData.get("sgst") || 0), 10),
    igst: parseInt(String(formData.get("igst") || 0), 10),
    op_gst: parseFloat(String(formData.get("op_gst") || 0)),
    dated: String(formData.get("dated")),
    status: formData.get("status") === "success", // Convert to boolean
    irn: formData.get("irn") === "success", // Convert to boolean
    pfp: pfpFile && pfpFile.size > 0 ? pfpFile.name : null,
  };
  console.log(data);

  const { error } = await supabase.from("Invoices").insert([data]);

  if (error) {
    console.error("Error inserting invoice:", error);
    throw new Error("Failed to insert invoice");
  }

  revalidatePath(`/dashboard/${user.id}/invoices`);
  redirect(`/dashboard/${user.id}/invoices`);
}

//homepage homestats server functions
export async function totalInvoicesCountServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  const { count, error } = await supabase
    .from("Invoices")
    .select("*", { count: "exact", head: true }) // only count
    .eq("id", userId);

  if (error) throw error;
  return count;
}

export async function totalCustomerCountServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("Invoices")
    .select("client_name")
    .eq("id", userId)
    .not("client_name", "is", null);

  if (error) throw error;

  const unique = new Set(
    (data ?? []).map((r) => r.client_name?.trim().toLowerCase()).filter(Boolean)
  );

  return unique.size || 0;
}

export async function totalPendingRevServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("Invoices")
    .select("total_amount")
    .eq("id", userId)
    .eq("status", false);

  if (error) throw error;

  const pending = data?.reduce(
    (acc, item) => acc + (item.total_amount || 0),
    0
  );
  return Number(pending?.toFixed(1)) || 0;
}

export async function totalRevServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("Invoices")
    .select("total_amount")
    .eq("id", userId);

  if (error) throw error;

  const total = data?.reduce((acc, item) => acc + (item.total_amount || 0), 0);
  return Number(total?.toFixed(1)) || 0;
}

//get user for server components which are using suspense
export async function getUserServer() {
  "use server";
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

//home page top customers server function
export async function getTopCustomersServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  let { data: invoices, error } = await supabase
    .from("Invoices")
    .select("client_name, email, pfp, total_amount")
    .eq("id", userId)
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
    // const pic = invoice.pfp;
    // const email = invoice.email;
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
      client_name,
      total_amount: Number(details.total_amount.toFixed(1)),
      email: details.email || null,
      pfp: details.pfp || null,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);

  return topCustomers.slice(0, 5);
}

//gst stats starts
export async function getTotalGstCollectionServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  let { data: op_gst, error } = await supabase
    .from("Invoices")
    .select("op_gst")
    .eq("id", userId)
    .not("client_name", "is", null);

  if (error) throw error;

  const totalGstColl = op_gst?.reduce((acc, obj) => {
    return acc + obj.op_gst;
  }, 0);

  return Number(totalGstColl?.toFixed(2));
}

export async function getTotalTaxableAmountServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  let { data: total_amt, error } = await supabase
    .from("Invoices")
    .select("total_taxable_amt")
    .eq("id", userId)
    .not("client_name", "is", null);

  if (error) throw error;

  const total_tax_amt = total_amt?.reduce((acc, ele) => {
    return acc + ele.total_taxable_amt;
  }, 0);

  return Number(total_tax_amt?.toFixed(2));
}

export async function getGrossCollectionServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  let { data: total_amt, error } = await supabase
    .from("Invoices")
    .select("total_amount")
    .eq("id", userId)
    .not("client_name", "is", null);

  if (error) throw error;

  const total_amount = total_amt?.reduce((acc, ele) => {
    return acc + ele.total_amount;
  }, 0);

  return Number(total_amount?.toFixed(2));
}

//gst missing irn
export async function getMissingIrnDataServer(userId: string | undefined) {
  "use server";
  const supabase = await createClientServer();
  let { data, error } = await supabase
    .from("Invoices")
    .select("invoice_no, GSTIN, dated")
    .eq("id", userId)
    .eq("irn", false);

  if (error) throw error;

  const dta = data?.map((obj) => {
    return {
      invoice_num: obj.invoice_no,
      GST_IN: obj.GSTIN,
      dated: obj.dated,
    };
  });

  return dta;
}

export async function deleteInvoice(invoiceNum: string | null) {
  "use server";
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
