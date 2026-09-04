import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@/lib/supabase/client";
import { InvoiceObj } from "@/app/dashboard/[id]/invoices/_data-table/types";

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

// Given a row's invoice_type, return the GSTIN that should be shown/used.
// "sales" -> we're the seller, so the counterparty is the buyer -> show buyer_gstin
// "purchase" -> we're the buyer, so the counterparty is the supplier -> show supplier_gstin
// Falls back to whichever field is populated if invoice_type is missing/unexpected.
export function getDisplayGstin(row: {
  invoice_type?: string | null;
  supplier_gstin?: string | null;
  buyer_gstin?: string | null;
}) {
  if (row.invoice_type === "sales") return row.buyer_gstin ?? null;
  if (row.invoice_type === "purchase") return row.supplier_gstin ?? null;
  return row.supplier_gstin ?? row.buyer_gstin ?? null;
}

//home stats
export async function totalInvoicesCount(userId: string | undefined) {
  const { count, error } = await supabase
    .from("Invoices")
    .select("*", { count: "exact", head: true }) // head:true returns only count, no data
    .eq("user_id", userId);

  if (error) throw error;

  return count;
}

export async function totalCustomerCount(userId: string | undefined) {
  const { data, error } = await supabase
    .from("Invoices")
    .select("client_name")
    .eq("user_id", userId)
    .not("client_name", "is", null);

  if (error) throw error;

  const unique = new Set(
    (data ?? [])
      .map((r) => r.client_name?.trim().toLowerCase())
      .filter(Boolean),
  );

  return unique.size || 0;
}

export async function totalPendingRev(userId: string | undefined) {
  let { data: pendingAmount, error } = await supabase
    .from("Invoices")
    .select("total_amount")
    .eq("user_id", userId)
    .eq("status", false);

  if (error) {
    throw error;
  }

  //calculating the sum of pending amt
  let pending = pendingAmount?.reduce((acc, item) => {
    return acc + (item.total_amount || 0);
  }, 0);

  return Number(pending?.toFixed(1)) || 0;
}

export async function totalRev(userId: string | undefined) {
  let { data: totalAmount, error } = await supabase
    .from("Invoices")
    .select("total_amount")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  //calculating the total rev
  const total = totalAmount?.reduce((acc, item) => {
    return acc + (item.total_amount || 0);
  }, 0);

  return Number(total?.toFixed(1)) || 0;
}

export async function getMonthlySales(userId: string | undefined) {
  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  from.setDate(1); // start from 1st of that month
  const fromStr = from.toISOString().split("T")[0];

  let { data: monthlySales, error } = await supabase
    .from("Invoices")
    .select("total_amount, dated")
    .eq("user_id", userId)
    .gte("dated", fromStr);

  if (error) {
    throw error;
  }

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
      desktop: total, // match chart key
      date, // keep for sorting
    };
  });

  result.sort((a, b) => a.date.getTime() - b.date.getTime());

  return result.map(({ month, desktop }) => ({ month, desktop }));
}

export async function getInvoiceRows(userId: string | undefined) {
  let { data: totalInvoices, error } = await supabase
    .from("Invoices")
    .select(
      "invoice_no, total_amount, status, email, client_name, dated, pfp, invoice_type, supplier_gstin, buyer_gstin, pdf_path",
    )
    .eq("user_id", userId)
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
      invoiceType: inv.invoice_type,
      gstin: getDisplayGstin(inv),
      pdfPath: inv.pdf_path ?? null,
    })) ?? []
  );
}

//gst stats starts here
export async function getTotalGstCollection(userId: string | undefined) {
  let { data: op_gst, error } = await supabase
    .from("Invoices")
    .select("op_gst")
    .eq("user_id", userId)
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
    .eq("user_id", userId)
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
    .eq("user_id", userId)
    .not("client_name", "is", null);

  if (error) throw error;

  const total_amount = total_amt?.reduce((acc, ele) => {
    return acc + ele.total_amount;
  }, 0);

  return Number(total_amount?.toFixed(2));
}
//ends

export async function getGstChartData(userId: string | undefined) {
  let { data, error } = await supabase
    .from("Invoices")
    .select("dated, total_amount, total_tax")
    .eq("user_id", userId)
    .not("client_name", "is", null)
    .order("dated", { ascending: true });

  if (error) throw error;

  const dta = data?.map((inv) => {
    return {
      date: inv.dated,
      total_amount: Number(inv.total_amount.toFixed(0)),
      total_tax: Number(inv.total_tax.toFixed(0)),
    };
  });
  return dta;
}

export async function getMissingIrnData(userId: string | undefined) {
  let { data, error } = await supabase
    .from("Invoices")
    .select("invoice_no, dated, invoice_type, supplier_gstin, buyer_gstin")
    .eq("user_id", userId)
    .eq("irn", false);

  if (error) throw error;

  const dta = data?.map((obj) => {
    return {
      invoice_num: obj.invoice_no,
      GST_IN: getDisplayGstin(obj),
      dated: obj.dated,
    };
  });

  return dta;
}

export async function getInvoiceDetails(invoice_num: string) {
  let { data: invoice_dta, error } = await supabase
    .from("Invoices")
    .select("*")
    .eq("invoice_no", invoice_num);

  if (error) throw Error;

  return invoice_dta;
}

export async function updateRow(
  updatedData: InvoiceObj | null,
  invoice_num: string | undefined,
) {
  const { data, error } = await supabase
    .from("Invoices")
    .update(updatedData)
    .eq("invoice_no", invoice_num)
    .select();

  if (error) throw error;

  return data;
}

export type DateRange = "30d" | "3m" | "6m" | "1y" | "fy";

export const getDateRange = (range: DateRange) => {
  const now = new Date();
  const from = new Date();

  switch (range) {
    case "30d":
      from.setDate(now.getDate() - 30);
      break;
    case "3m":
      from.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      from.setMonth(now.getMonth() - 6);
      break;
    case "1y":
      from.setFullYear(now.getFullYear() - 1);
      break;
    case "fy": {
      const currentMonth = now.getMonth();
      if (currentMonth >= 3) {
        from.setFullYear(now.getFullYear(), 3, 1);
      } else {
        from.setFullYear(now.getFullYear() - 1, 3, 1);
      }
      break;
    }
    default:
      from.setDate(now.getDate() - 30);
  }

  return {
    from: from.toISOString().split("T")[0], // "2026-02-26"
    to: now.toISOString().split("T")[0], // "2026-05-26"
  };
};

export async function getMonthlyCashflow(userId: string | undefined) {
  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  from.setDate(1);
  const fromStr = from.toISOString().split("T")[0];

  let { data: invoices, error } = await supabase
    .from("Invoices")
    .select("total_amount, dated, status")
    .eq("user_id", userId)
    .eq("invoice_type", "sales")
    .gte("dated", fromStr);

  if (error) throw error;

  return segregateCashflow(invoices ?? [], from);
}

function segregateCashflow(
  invoices: { total_amount: number; dated: string; status: boolean }[],
  from: Date,
) {
  const monthlyTotals: Record<
    string,
    { received: number; pending: number; date: Date }
  > = {};

  // Scaffold all 12 months first so a month with zero invoices still
  // shows up as a 0 bar instead of disappearing from the x-axis.
  const cursor = new Date(from);
  for (let i = 0; i < 12; i++) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const key = `${year}-${month}`;
    monthlyTotals[key] = { received: 0, pending: 0, date: new Date(cursor) };
    cursor.setMonth(cursor.getMonth() + 1);
  }

  invoices.forEach((item) => {
    const [year, month] = item.dated.split("-");
    const monthKey = `${year}-${month}`;

    // A row outside the scaffolded range (shouldn't happen given the
    // query's own gte filter, but guards against a bad row) is skipped
    // rather than silently creating a stray extra bar.
    if (!monthlyTotals[monthKey]) return;

    if (item.status === true) {
      monthlyTotals[monthKey].received += item.total_amount;
    } else {
      monthlyTotals[monthKey].pending += item.total_amount;
    }
  });

  const result = Object.entries(monthlyTotals).map(([key, totals]) => {
    const [year, month] = key.split("-");
    const monthName = totals.date.toLocaleString("default", { month: "long" });

    return {
      month: `${monthName} ${year}`,
      received: Number(totals.received.toFixed(2)),
      pending: Number(totals.pending.toFixed(2)),
      date: totals.date,
    };
  });

  result.sort((a, b) => a.date.getTime() - b.date.getTime());

  return result.map(({ month, received, pending }) => ({
    month,
    received,
    pending,
  }));
}

export function formatINR(
  value: number,
  options?: { decimals?: number; forceSign?: boolean },
): string {
  const decimals = options?.decimals ?? 2;
  const forceSign = options?.forceSign ?? false;
  const isNegative = value < 0;
  const sign = isNegative ? "-" : forceSign ? "+" : "";
  const abs = Math.abs(value);

  let formatted: string;
  if (abs >= 1_00_00_000) {
    formatted = `${(abs / 1_00_00_000).toFixed(decimals)} Cr`;
  } else if (abs >= 1_00_000) {
    formatted = `${(abs / 1_00_000).toFixed(decimals)} L`;
  } else if (abs >= 1_000) {
    formatted = `${(abs / 1_000).toFixed(decimals)} K`;
  } else {
    // Below ₹1,000 there's nothing to abbreviate — show the exact
    // amount, Indian-grouped, so small values don't render as "0.00 K".
    formatted = new Intl.NumberFormat("en-IN").format(abs);
  }

  return `${sign}₹${formatted}`;
}
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// import { createClient } from "@/lib/supabase/client";
// import { InvoiceObj } from "@/app/dashboard/[id]/invoices/_data-table/types";

// const supabase = createClient();

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// export async function getUser() {
//   const {
//     data: { user },
//     error,
//   } = await supabase.auth.getUser();

//   if (error || !user) {
//     return null;
//   }

//   return user;
// }

// //home stats
// export async function totalInvoicesCount(userId: string | undefined) {
//   const { count, error } = await supabase
//     .from("Invoices")
//     .select("*", { count: "exact", head: true }) // head:true returns only count, no data
//     .eq("id", userId);

//   if (error) throw error;

//   return count;
// }

// export async function totalCustomerCount(userId: string | undefined) {
//   const { data, error } = await supabase
//     .from("Invoices")
//     .select("client_name")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (error) throw error;

//   const unique = new Set(
//     (data ?? [])
//       .map((r) => r.client_name?.trim().toLowerCase())
//       .filter(Boolean),
//   );

//   return unique.size || 0;
// }

// export async function totalPendingRev(userId: string | undefined) {
//   let { data: pendingAmount, error } = await supabase
//     .from("Invoices")
//     .select("total_amount")
//     .eq("id", userId)
//     .eq("status", false);

//   if (error) {
//     throw error;
//   }
//   //console.log(pendingAmount);

//   //calculating the sum of pending amt
//   let pending = pendingAmount?.reduce((acc, item) => {
//     return acc + (item.total_amount || 0);
//   }, 0);
//   //console.log(pending);
//   return Number(pending?.toFixed(1)) || 0;
// }

// export async function totalRev(userId: string | undefined) {
//   let { data: totalAmount, error } = await supabase
//     .from("Invoices")
//     .select("total_amount")
//     .eq("id", userId);

//   if (error) {
//     throw error;
//   }

//   //console.log(totalAmount);

//   //calculating the total rev
//   const total = totalAmount?.reduce((acc, item) => {
//     return acc + (item.total_amount || 0);
//   }, 0);
//   //console.log(total);

//   return Number(total?.toFixed(1)) || 0;
// }

// export async function getMonthlySales(userId: string | undefined) {
//   const from = new Date();
//   from.setMonth(from.getMonth() - 12);
//   from.setDate(1); // start from 1st of that month
//   const fromStr = from.toISOString().split("T")[0];

//   let { data: monthlySales, error } = await supabase
//     .from("Invoices")
//     .select("total_amount, dated")
//     .eq("id", userId)
//     .gte("dated", fromStr);

//   if (error) {
//     throw error;
//   }

//   //console.log(monthlySales);

//   return segregationSales(monthlySales ?? []);
// }

// function segregationSales(invoices: { total_amount: number; dated: string }[]) {
//   const monthlyTotals: Record<string, number> = {};

//   invoices.forEach((item) => {
//     const [year, month] = item.dated.split("-");
//     const monthKey = `${year}-${month}`;
//     const newTotal = (monthlyTotals[monthKey] || 0) + item.total_amount;
//     monthlyTotals[monthKey] = Number(newTotal.toFixed(2));
//   });

//   const result = Object.entries(monthlyTotals).map(([key, total]) => {
//     const [year, month] = key.split("-");
//     const date = new Date(Number(year), Number(month) - 1);
//     const monthName = date.toLocaleString("default", { month: "long" });

//     return {
//       month: `${monthName} ${year}`, // e.g. "September 2024"
//       desktop: total, // ✅ match chart key
//       date, // keep for sorting
//     };
//   });

//   result.sort((a, b) => a.date.getTime() - b.date.getTime());

//   return result.map(({ month, desktop }) => ({ month, desktop }));
// }

// // get top customers homepage
// // export async function getTopCustomers(userId: string | undefined) {
// //   let { data: invoices, error } = await supabase
// //     .from("Invoices")
// //     .select("client_name, email, pfp, total_amount")
// //     .eq("id", userId)
// //     .not("client_name", "is", null);

// //   if (error) throw error;

// //   const clientDetails: {
// //     [key: string]: {
// //       total_amount: number;
// //       email?: string;
// //       pfp?: string;
// //     };
// //   } = {};

// //   invoices?.forEach((invoice) => {
// //     const client = invoice.client_name;
// //     // const pic = invoice.pfp;
// //     // const email = invoice.email;
// //     const amount = invoice.total_amount || 0;

// //     if (client) {
// //       if (!clientDetails[client]) {
// //         clientDetails[client] = {
// //           total_amount: 0,
// //           email: invoice.email,
// //           pfp: invoice.pfp,
// //         };
// //       }
// //       clientDetails[client].total_amount += amount;
// //     }
// //   });

// //   const topCustomers = Object.entries(clientDetails)
// //     .map(([client_name, details]) => ({
// //       client_name,
// //       total_amount: Number(details.total_amount.toFixed(1)),
// //       email: details.email || null,
// //       pfp: details.pfp || null,
// //     }))
// //     .sort((a, b) => b.total_amount - a.total_amount);

// //   return topCustomers.slice(0, 5);
// // }

// export async function getInvoiceRows(userId: string | undefined) {
//   let { data: totalInvoices, error } = await supabase
//     .from("Invoices")
//     .select("invoice_no, total_amount, status, email, client_name, dated,  pfp")
//     .eq("id", userId)
//     .not("client_name", "is", null)
//     .order("dated", { ascending: false });

//   if (error) throw error;

//   return (
//     totalInvoices?.map((inv) => ({
//       id: inv.invoice_no,
//       amount: inv.total_amount,
//       status: inv.status,
//       email: inv.email,
//       customer: inv.client_name,
//       date: inv.dated,
//       pfp: inv.pfp ?? null,
//     })) ?? []
//   );
// }

// //gst stats starts here
// export async function getTotalGstCollection(userId: string | undefined) {
//   let { data: op_gst, error } = await supabase
//     .from("Invoices")
//     .select("op_gst")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (error) throw error;

//   const totalGstColl = op_gst?.reduce((acc, obj) => {
//     return acc + obj.op_gst;
//   }, 0);

//   return Number(totalGstColl?.toFixed(2));
// }

// export async function getTotalTaxableAmount(userId: string | undefined) {
//   let { data: total_amt, error } = await supabase
//     .from("Invoices")
//     .select("total_taxable_amt")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (error) throw error;

//   const total_tax_amt = total_amt?.reduce((acc, ele) => {
//     return acc + ele.total_taxable_amt;
//   }, 0);

//   return Number(total_tax_amt?.toFixed(2));
// }

// export async function getGrossCollection(userId: string | undefined) {
//   let { data: total_amt, error } = await supabase
//     .from("Invoices")
//     .select("total_amount")
//     .eq("id", userId)
//     .not("client_name", "is", null);

//   if (error) throw error;

//   const total_amount = total_amt?.reduce((acc, ele) => {
//     return acc + ele.total_amount;
//   }, 0);

//   return Number(total_amount?.toFixed(2));
// }
// //ends

// export async function getGstChartData(userId: string | undefined) {
//   let { data, error } = await supabase
//     .from("Invoices")
//     .select("dated, total_amount, op_gst")
//     .eq("id", userId)
//     .not("client_name", "is", null)
//     .order("dated", { ascending: true });

//   if (error) throw error;

//   const dta = data?.map((inv) => {
//     return {
//       date: inv.dated,
//       total_amount: Number(inv.total_amount.toFixed(0)),
//       op_gst: Number(inv.op_gst.toFixed(0)),
//     };
//   });
//   return dta;
// }

// export async function getMissingIrnData(userId: string | undefined) {
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

// export async function getInvoiceDetails(invoice_num: string) {
//   let { data: invoice_dta, error } = await supabase
//     .from("Invoices")
//     .select("*")
//     .eq("invoice_no", invoice_num);

//   if (error) throw Error;

//   return invoice_dta;
// }

// export async function updateRow(
//   updatedData: InvoiceObj | null,
//   invoice_num: string | undefined,
// ) {
//   const { data, error } = await supabase
//     .from("Invoices")
//     .update(updatedData)
//     .eq("invoice_no", invoice_num)
//     .select();

//   if (error) throw error;

//   return data;
// }

// // export async function deleteInvoice(invoiceNum: string) {
// //   const {
// //     data: { user },
// //     error: userError,
// //   } = await supabase.auth.getUser();

// //   // const router = useRouter();

// //   if (userError || !user) {
// //     throw new Error("User not authenticated");
// //   }

// //   const { error } = await supabase
// //     .from("Invoices")
// //     .delete()
// //     .eq("invoice_no", invoiceNum);

// //   if (error) {
// //     console.log("error deleting the invoice");
// //     throw new Error("Failed to delete the invoice");
// //   }

// //   // Instead of redirect
// //   // router.push(`/dashboard/${user.id}/invoices`);
// //   // // And refresh data
// //   // router.refresh();
// // }

// export type DateRange = "30d" | "3m" | "6m" | "1y" | "fy";

// export const getDateRange = (range: DateRange) => {
//   const now = new Date();
//   const from = new Date();

//   switch (range) {
//     case "30d":
//       from.setDate(now.getDate() - 30);
//       break;
//     case "3m":
//       from.setMonth(now.getMonth() - 3);
//       break;
//     case "6m":
//       from.setMonth(now.getMonth() - 6);
//       break;
//     case "1y":
//       from.setFullYear(now.getFullYear() - 1);
//       break;
//     case "fy": {
//       const currentMonth = now.getMonth();
//       if (currentMonth >= 3) {
//         from.setFullYear(now.getFullYear(), 3, 1);
//       } else {
//         from.setFullYear(now.getFullYear() - 1, 3, 1);
//       }
//       break;
//     }
//     default:
//       from.setDate(now.getDate() - 30);
//   }

//   return {
//     from: from.toISOString().split("T")[0], // "2026-02-26"
//     to: now.toISOString().split("T")[0], // "2026-05-26"
//   };
// };
