"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  InvoiceObj,
  Payment,
} from "@/app/dashboard/[id]/invoices/_data-table/types";
import { Label } from "@/components/ui/label";
import { CardContent } from "./ui/card";
import { getInvoiceDetails, updateRow } from "@/lib/utils";
import { toast } from "sonner";

interface EditInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceObj | null;
  refreshData: () => Promise<void>;
}

export default function EditInvoiceModal({
  open,
  onClose,
  invoice,
  refreshData,
}: EditInvoiceModalProps) {
  const [formData, setFormData] = useState<InvoiceObj | null>(null);

  useEffect(() => {
    async function getInvoiceData() {
      if (invoice) {
        console.log(invoice.id);
        setFormData(invoice);
      }
    }
    getInvoiceData();
  }, [invoice]);

  // console.log(formData);

  const handleChange = (key: keyof InvoiceObj, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [key]: value });
  };

  const handleSave = async () => {
    try {
      console.log("Updated invoice:", formData);
      await updateRow(formData, formData?.invoice_no);
      await refreshData();
      toast("Invoice updated successfully");
      console.log("Invoice updated successfully");
      onClose();
    } catch (err) {
      console.error("Error updating invoice:", err);
    }

    // TODO: call API to save the updated invoice
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col  gap-5 mt-4">
          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Input
                value={formData?.client_name || ""}
                onChange={(e) => handleChange("client_name", e.target.value)}
                placeholder="Customer"
              />
            </div>
            <div className="grid gap-3">
              <Input
                value={formData?.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email"
              />
            </div>
          </div>

          {/* Amount, Tax, GSTIN, Invoice number */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-3">
              <Input
                value={formData?.total_amount || ""}
                onChange={(e) => handleChange("total_amount", e.target.value)}
                placeholder="Total amount"
              />
            </div>
            <div className="grid gap-3">
              <Input
                value={formData?.total_taxable_amt || ""}
                onChange={(e) =>
                  handleChange("total_taxable_amt", e.target.value)
                }
                placeholder="Total Taxable Amount"
              />
            </div>
            <div className="grid gap-3">
              <Input
                value={formData?.GSTIN || ""}
                onChange={(e) => handleChange("GSTIN", e.target.value)}
                placeholder="GSTIN"
              />
            </div>
          </div>

          {/* GST fields */}
          <div className="grid grid-cols-3 gap-4 ">
            <div className="grid gap-3">
              <Input
                value={formData?.cgst || ""}
                onChange={(e) => handleChange("cgst", e.target.value)}
                placeholder="CGST"
              />
            </div>
            <div className="grid gap-3">
              <Input
                value={formData?.sgst || ""}
                onChange={(e) => handleChange("sgst", e.target.value)}
                placeholder="SGST"
              />
            </div>
            <div className="grid gap-3">
              <Input
                value={formData?.igst || ""}
                onChange={(e) => handleChange("igst", e.target.value)}
                placeholder="IGST"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 ">
            <div className="grid gap-3">
              <Input
                value={formData?.op_gst || ""}
                onChange={(e) => handleChange("op_gst", e.target.value)}
                placeholder="Output GST"
              />
            </div>
            <div className="grid gap-3">
              <Input
                value={formData?.invoice_no || ""}
                onChange={(e) => handleChange("invoice_no", e.target.value)}
                placeholder="Invoice number"
              />
            </div>
            <div className="grid gap-3">
              <Input
                value={formData?.dated || ""}
                onChange={(e) => handleChange("dated", e.target.value)}
                placeholder="Dated"
                type="date"
              />
            </div>
          </div>

          {/* Date + Status + IRN + PFP */}
          <div className="grid grid-cols-1 gap-4">
            {/* Status (radio group) */}
            <div className="grid gap-3">
              <div className="flex gap-5 border border-neutral-200 py-2 rounded-md">
                <label
                  className="inline-flex items-center ml-5 cursor-pointer"
                  htmlFor="status-success"
                >
                  <Input
                    value="successs"
                    type="radio"
                    id="status-success"
                    name="status"
                    className="hidden peer"
                    checked={formData?.status === true} // ✅ pre-select if status is true
                    onChange={(e) => handleChange("status", true)}
                  />

                  {/* <input
                    type="radio"
                    id="status-success"
                    name="status"
                    value="success"
                    className="hidden peer"
                  /> */}
                  <span className="h-4 w-4 rounded-full border border-gray-400 peer-checked:border-blue-600 peer-checked:bg-blue-600"></span>
                  <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-green-500 text-white">
                    Success
                  </span>
                </label>

                <label
                  className="inline-flex items-center cursor-pointer"
                  htmlFor="status-terms"
                >
                  <Input
                    value="terms"
                    type="radio"
                    id="status-terms"
                    name="status"
                    className="hidden peer"
                    checked={formData?.status === false} // ✅ pre-select if status is true
                    onChange={(e) => handleChange("status", false)}
                  />
                  {/* <input
                    type="radio"
                    id="status-terms"
                    name="status"
                    value="terms"
                    className="hidden peer"
                  /> */}
                  <span className="h-4 w-4 rounded-full border border-gray-400 peer-checked:border-blue-600 peer-checked:bg-blue-600"></span>
                  <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-neutral-300 text-neutral-600">
                    Accept terms
                  </span>
                </label>
                <Label className=" text-stone-500">Status</Label>
              </div>
            </div>

            {/* IRN (radio group) */}
            <div className="grid gap-3">
              <div className="flex gap-5 border border-neutral-200 py-2 rounded-md">
                <label
                  className="inline-flex items-center ml-5 cursor-pointer"
                  htmlFor="irn-success"
                >
                  <Input
                    value="success"
                    type="radio"
                    id="irn-success"
                    name="irn"
                    className="hidden peer"
                    checked={formData?.irn === true} // ✅ pre-select if status is true
                    onChange={(e) => handleChange("irn", true)}
                  />
                  {/* <input
                    type="radio"
                    id="irn-success"
                    name="irn"
                    value="success"
                    className="hidden peer"
                  /> */}
                  <span className="h-4 w-4 flex items-center justify-center rounded-full border border-gray-400 peer-checked:border-blue-600 peer-checked:bg-blue-600">
                    <span className="hidden w-2 h-2 rounded-full bg-white peer-checked:block"></span>
                  </span>
                  <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-green-500 text-white">
                    Success
                  </span>
                </label>

                <label
                  className="inline-flex items-center cursor-pointer"
                  htmlFor="irn-terms"
                >
                  <Input
                    value="terms"
                    type="radio"
                    id="irn-terms"
                    name="irn"
                    className="hidden peer"
                    checked={formData?.irn === false} // ✅ pre-select if status is true
                    onChange={(e) => handleChange("irn", false)}
                  />

                  <span className="h-4 w-4 flex items-center justify-center rounded-full border border-gray-400 peer-checked:border-blue-600 peer-checked:bg-blue-600">
                    <span className="hidden w-2 h-2 rounded-full bg-white peer-checked:block"></span>
                  </span>
                  <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-neutral-300 text-neutral-600">
                    Accept terms
                  </span>
                </label>
                <Label className=" text-stone-500">IRN</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
