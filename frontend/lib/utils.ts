import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function totalInvoicesCount(userId: string | undefined) {
  const { count, error } = await supabase
    .from("Invoices")
    .select("*", { count: "exact", head: true }) // head:true returns only count, no data
    .eq("id", userId);

  if (error) throw error;

  return count;
}

export async function totalCustomerCount(userId: string | undefined) {
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

export async function totalPendingRev(userId: string | undefined) {
  let { data: pendingAmount, error } = await supabase
    .from("Invoices")
    .select("total_amount")
    .eq("id", userId)
    .eq("status", false);

  if (error) {
    throw error;
  }
  //console.log(pendingAmount);

  //calculating the sum of pending amt
  let pending = pendingAmount?.reduce((acc, item) => {
    return acc + (item.total_amount || 0);
  }, 0);
  //console.log(pending);
  return Number(pending?.toFixed(1)) || 0;
}

export async function totalRev(userId: string | undefined) {
  let { data: totalAmount, error } = await supabase
    .from("Invoices")
    .select("total_amount")
    .eq("id", userId);

  if (error) {
    throw error;
  }

  //console.log(totalAmount);

  //calculating the total rev
  const total = totalAmount?.reduce((acc, item) => {
    return acc + (item.total_amount || 0);
  }, 0);
  //console.log(total);

  return Number(total?.toFixed(1)) || 0;
}

export async function getMonthlySales(userId: string | undefined) {
  let { data: monthlySales, error } = await supabase
    .from("Invoices")
    .select("total_amount, dated")
    .eq("id", userId);

  if (error) {
    throw error;
  }

  //console.log(monthlySales);

  return segregationSales(monthlySales ?? []);
}

function segregationSales(invoices: { total_amount: number; dated: string }[]) {
  const monthlyTotals: Record<string, number> = {};

  invoices.forEach((item) => {
    const [year, month] = item.dated.split("-");
    const monthKey = `${year}-${month}`;
    const newTotal = (monthlyTotals[monthKey] || 0) + item.total_amount;
    monthlyTotals[monthKey] = Number(newTotal.toFixed(2));
  });

  const result = Object.entries(monthlyTotals).map(([key, total]) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    const monthName = date.toLocaleString("default", { month: "long" });

    return {
      month: `${monthName} ${year}`, // e.g. "September 2024"
      desktop: total, // ✅ match chart key
      date, // keep for sorting
    };
  });

  result.sort((a, b) => a.date.getTime() - b.date.getTime());

  return result.map(({ month, desktop }) => ({ month, desktop }));
}

export async function getTopCustomers(userId: string | undefined) {
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

  return topCustomers;
}

export async function getInvoiceRows(userId: string) {
  let { data: totalInvoices, error } = await supabase
    .from("Invoices")
    .select("invoice_no, total_amount, status, email, client_name, dated,  pfp")
    .eq("id", userId)
    .not("client_name", "is", null)
    .order("dated", { ascending: false });

  if (error) throw error;

  return (
    totalInvoices?.map((inv) => ({
      id: inv.invoice_no,
      amount: inv.total_amount,
      status: inv.status,
      email: inv.email,
      customer: inv.client_name,
      date: inv.dated,
      pfp: inv.pfp ?? null,
    })) ?? []
  );
}

export async function getTotalGstCollection(userId: string | undefined) {
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

export async function getTotalTaxableAmount(userId: string | undefined) {
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

export async function getGrossCollection(userId: string | undefined) {
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

export async function getGstChartData(userId: string | undefined) {
  let { data, error } = await supabase
    .from("Invoices")
    .select("dated, total_amount, op_gst")
    .eq("id", userId)
    .not("client_name", "is", null)
    .order("dated", { ascending: true });

  if (error) throw error;

  const dta = data?.map((inv) => {
    return {
      date: inv.dated,
      total_amount: Number(inv.total_amount.toFixed(0)),
      op_gst: Number(inv.op_gst.toFixed(0)),
    };
  });
  return dta;
}

export async function getMissingIrnData(userId: string | undefined) {
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
