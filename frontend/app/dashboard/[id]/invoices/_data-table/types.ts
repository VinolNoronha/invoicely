export type Payment = {
  id: string;
  amount: number;
  status: boolean;
  email: string | null;
  customer: string;
  date: string;
  pfp?: string | null;
};

export type InvoiceObj = {
  client_name: string;
  GSTIN: string;
  dated: string;
  total_amount: number;
  status: boolean;
  invoice_no: string;
  op_gst: number;
  cgst: number;
  sgst: number;
  total_taxable_amt: number;
  id: string;
  igst: number;
  irn: boolean;
  pfp: string;
  email: string;
};
