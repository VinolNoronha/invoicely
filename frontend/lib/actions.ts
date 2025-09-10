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
