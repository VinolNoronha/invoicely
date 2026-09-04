import { TabsContent } from "@radix-ui/react-tabs";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Label } from "@/components/ui/label";
import { Input } from "./input";
import { Button } from "@/components/ui/button";
import { invoiceData } from "@/lib/actions";

export default function CreateInvoice() {
  return (
    <form action={invoiceData}>
      <TabsContent value="manual">
        <Card>
          <CardHeader>
            <CardTitle>Manual Creation</CardTitle>
            <CardDescription>
              Fill the form to create an entry. Click save when you&apos;re
              done.
            </CardDescription>
          </CardHeader>

          <CardContent className="gap-8 grid sm:gap-6">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="customer-name">Name</Label>
                <Input
                  id="customer-name"
                  name="client_name"
                  placeholder="Enter the name of your customer"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  name="email"
                  placeholder="Enter the email"
                />
              </div>
            </div>

            {/* Amount, Tax, Invoice number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="customer-amount">Amount</Label>
                <Input
                  id="customer-amount"
                  name="total_amount"
                  placeholder="Enter the total amount"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="customer-taxable">Total Taxable Amount</Label>
                <Input
                  id="customer-taxable"
                  name="total_taxable_amount"
                  placeholder="Enter the total taxable amount"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="customer-invoice">Invoice number</Label>
                <Input
                  id="customer-invoice"
                  name="invoice_no"
                  placeholder="Enter the invoice number"
                />
              </div>
            </div>

            {/* GSTIN pair + invoice type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="supplier-gstin">Supplier GSTIN</Label>
                <Input
                  id="supplier-gstin"
                  name="supplier_gstin"
                  placeholder="Enter the supplier's GSTIN"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="buyer-gstin">Buyer GSTIN</Label>
                <Input
                  id="buyer-gstin"
                  name="buyer_gstin"
                  placeholder="Enter the buyer's GSTIN"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="invoice-type">Invoice Type</Label>
                <select
                  id="invoice-type"
                  name="invoice_type"
                  className="border border-input rounded-md h-9 px-3 text-sm bg-transparent"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="sales">Sales</option>
                  <option value="purchase">Purchase</option>
                </select>
              </div>
            </div>

            {/* GST fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="cust-cgst">CGST</Label>
                <Input
                  id="cust-cgst"
                  name="cgst"
                  placeholder="Enter the CGST"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="cust-sgst">SGST</Label>
                <Input
                  id="cust-sgst"
                  name="sgst"
                  placeholder="Enter the SGST"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="cust-igst">IGST</Label>
                <Input
                  id="cust-igst"
                  name="igst"
                  placeholder="Enter the IGST"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="cust-op-gst">Total Tax</Label>
                <Input
                  id="cust-op-gst"
                  name="total_tax"
                  placeholder="Enter the total tax amount"
                />
              </div>
            </div>

            {/* Date + Status + IRN + PFP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date */}
              <div className="grid gap-3">
                <Label htmlFor="invoice-date">Dated</Label>
                <Input id="invoice-date" name="dated" type="date" />
              </div>

              {/* Status (radio group) */}
              <div className="grid gap-3">
                <Label>Set the invoice status</Label>
                <div className="flex gap-3 sm:gap-5 border border-neutral-200 py-2 rounded-md px-2 sm:px-0">
                  <label
                    className="inline-flex items-center sm:ml-5 cursor-pointer"
                    htmlFor="status-success"
                  >
                    <input
                      type="radio"
                      id="status-success"
                      name="status"
                      value="success"
                      className="hidden peer"
                    />
                    <span className="h-4 w-4 rounded-full border border-gray-400 peer-checked:border-blue-600 peer-checked:bg-blue-600"></span>
                    <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-green-500 text-white">
                      Success
                    </span>
                  </label>

                  <label
                    className="inline-flex items-center cursor-pointer"
                    htmlFor="status-terms"
                  >
                    <input
                      type="radio"
                      id="status-terms"
                      name="status"
                      value="terms"
                      className="hidden peer"
                    />
                    <span className="h-4 w-4 rounded-full border border-gray-400 peer-checked:border-blue-600 peer-checked:bg-blue-600"></span>
                    <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-neutral-300 text-neutral-600">
                      Pending
                    </span>
                  </label>
                </div>
              </div>

              {/* IRN (radio group) */}
              <div className="grid gap-3">
                <Label>IRN</Label>
                <div className="flex gap-3 sm:gap-5 border border-neutral-200 py-2 rounded-md px-2 sm:px-0">
                  <label
                    className="inline-flex items-center sm:ml-5 cursor-pointer"
                    htmlFor="irn-success"
                  >
                    <input
                      type="radio"
                      id="irn-success"
                      name="irn"
                      value="success"
                      className="hidden peer"
                    />
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
                    <input
                      type="radio"
                      id="irn-terms"
                      name="irn"
                      value="terms"
                      className="hidden peer"
                    />
                    <span className="h-4 w-4 flex items-center justify-center rounded-full border border-gray-400 peer-checked:border-blue-600 peer-checked:bg-blue-600">
                      <span className="hidden w-2 h-2 rounded-full bg-white peer-checked:block"></span>
                    </span>
                    <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-neutral-300 text-neutral-600">
                      Pending
                    </span>
                  </label>
                </div>
              </div>

              {/* File Upload */}
              <div className="grid gap-3">
                <Label htmlFor="customer-pfp">Profile Pic</Label>
                <Input
                  id="customer-pfp"
                  name="pfp"
                  type="file"
                  accept="image/*"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button>Create Form</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </form>
  );
}
