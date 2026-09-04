"use client";

import { useRef, useState } from "react";
import CreateInvoice from "./ui/createInvoice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUser } from "@/lib/utils";
import { createInvoiceFromExtraction } from "@/lib/actions";
import EditInvoiceModal from "@/components/EditInvoiceModal";
import { InvoiceObj } from "@/app/dashboard/[id]/invoices/_data-table/types";

// Set this to wherever your FastAPI service is actually running.
// Consider moving this to an env var (NEXT_PUBLIC_FASTAPI_URL) instead of
// hardcoding once you deploy — different per environment.
const FASTAPI_BASE_URL = "http://127.0.0.1:8000";

// Shape returned by /extract now — the backend returns a flat "form"
// object (matches the Invoices table / InvoiceObj almost exactly, meant
// for pre-filling the review modal) alongside the full nested "raw"
// extraction detail (unchanged ExtractionResponse shape, meant to be
// stored as-is in raw_json on confirm).
type ExtractionPreviewResponse = {
  pdf_url: string;
  invoice_type: string;
  form: {
    client_name: string;
    email?: string | null;
    dated?: string | null;
    total_amount: number;
    total_taxable_amt: number;
    invoice_no: string;
    cgst: number;
    sgst: number;
    igst: number;
    total_tax: number;
    status: boolean;
    irn: boolean;
    supplier_gstin?: string | null;
    buyer_gstin?: string | null;
    invoice_type: string;
  };
  raw: unknown; // full ExtractionResponse detail — opaque here, goes straight into raw_json
};

// form already matches InvoiceObj field-for-field except id/pfp, which
// don't exist yet for a not-yet-saved invoice — just fill those in.
function extractionToInvoiceObj(res: ExtractionPreviewResponse): InvoiceObj {
  return {
    id: "", // no DB id yet — nothing has been inserted
    pfp: "",
    ...res.form,
    email: res.form.email ?? "",
    dated: res.form.dated ?? "",
    supplier_gstin: res.form.supplier_gstin ?? "",
    buyer_gstin: res.form.buyer_gstin ?? "",
  };
}

export default function InvoiceCreate() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extracted, setExtracted] = useState<InvoiceObj | null>(null);
  const [rawExtraction, setRawExtraction] =
    useState<ExtractionPreviewResponse | null>(null);
  // Keep the actual selected File around — the server action needs the
  // real bytes to hash and upload on confirm, not just the extracted
  // field values. The /extract call above only sent it to FastAPI for
  // parsing; this is a separate copy kept for the eventual insert.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast("Only PDF files are supported");
      return;
    }

    try {
      setIsUploading(true);
      const user = await getUser();
      if (!user) {
        toast("You must be signed in to upload an invoice");
        return;
      }

      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("file", file);

      const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/invoices/extract`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Extraction failed:", errBody);
        toast("Failed to extract invoice — check the file and try again");
        return;
      }

      const data: ExtractionPreviewResponse = await res.json();
      setRawExtraction(data);
      setExtracted(extractionToInvoiceObj(data));
      setSelectedFile(file);
      setIsReviewOpen(true);
    } catch (err) {
      console.error("Error uploading/extracting invoice:", err);
      toast("Something went wrong during extraction");
    } finally {
      setIsUploading(false);
      // reset the input so selecting the same file again re-triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmInsert = async (formData: InvoiceObj) => {
    if (!selectedFile) {
      throw new Error(
        "The original PDF is missing — please re-upload and try again.",
      );
    }

    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("client_name", formData.client_name);
    fd.append("email", formData.email || "");
    fd.append("total_amount", String(Number(formData.total_amount) || 0));
    fd.append(
      "total_taxable_amt",
      String(Number(formData.total_taxable_amt) || 0),
    );
    fd.append("invoice_no", formData.invoice_no);
    fd.append("cgst", String(Number(formData.cgst) || 0));
    fd.append("sgst", String(Number(formData.sgst) || 0));
    fd.append("igst", String(Number(formData.igst) || 0));
    fd.append("total_tax", String(Number(formData.total_tax) || 0)); // was: fd.append("op_gst", String(Number(formData.op_gst) || 0));
    fd.append("dated", formData.dated || "");
    fd.append("status", String(formData.status));
    fd.append("irn", String(formData.irn));
    fd.append("supplier_gstin", formData.supplier_gstin);
    fd.append("buyer_gstin", formData.buyer_gstin);
    fd.append("invoice_type", formData.invoice_type);
    if (rawExtraction?.raw) {
      fd.append("raw_json", JSON.stringify(rawExtraction.raw));
    }

    const result = await createInvoiceFromExtraction(fd);

    if (!result.success) {
      // Duplicate is an expected, routine outcome — surface it as a toast
      // right here rather than throwing, so nothing gets logged as a
      // server error. Re-throwing a plain client-side Error still lets
      // EditInvoiceModal's existing catch block show a toast and keep the
      // modal open for the user to change the invoice number/file — this
      // throw happens in the browser, not across the server action
      // boundary, so it produces no server-side error log.
      if (result.error === "DUPLICATE_INVOICE") {
        throw new Error("This invoice already exists");
      }
      throw new Error("Failed to save invoice");
    }

    setExtracted(null);
    setRawExtraction(null);
    setSelectedFile(null);
  };

  return (
    <div className="flex w-30/31 mt-5 mx-3 sm:mx-7 sm:w-full flex-col gap-10 sm:h-9/11">
      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Create Manually</TabsTrigger>
          <TabsTrigger value="upload">Upload & Extract</TabsTrigger>
        </TabsList>
        <CreateInvoice />
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Invoice</CardTitle>
              <CardDescription>
                Upload the invoice here. We'll extract the details and show you
                a review screen — nothing is saved until you confirm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelected}
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleUploadClick} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "Upload Invoice pdf"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <EditInvoiceModal
        open={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setExtracted(null);
          setRawExtraction(null);
          setSelectedFile(null);
        }}
        invoice={extracted}
        refreshData={async () => {}}
        onConfirm={handleConfirmInsert}
        title="Review Extracted Invoice"
        saveLabel="Confirm & Save"
      />
    </div>
  );
}

// import React from "react";
// import { AppWindowIcon, CodeIcon } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Checkbox } from "@radix-ui/react-checkbox";
// import CreateInvoice from "./ui/createInvoice";

// export default function InvoiceCreate() {
//   return (
//     <div className="flex w-30/31 mt-5 mx-3  sm:mx-7 sm:w-full flex-col gap-10  sm:h-9/11">
//       <Tabs defaultValue="manual">
//         <TabsList>
//           <TabsTrigger value="manual">Create Manually</TabsTrigger>
//           <TabsTrigger value="upload">Upload & Extract</TabsTrigger>
//         </TabsList>
//         <CreateInvoice />
//         <TabsContent value="upload">
//           <Card>
//             <CardHeader>
//               <CardTitle>Upload Invoice</CardTitle>
//               <CardDescription>
//                 Upload the invoice here. After uploading your invoice entry will
//                 be created automatically.
//               </CardDescription>
//             </CardHeader>
//             <CardFooter>
//               <Button>Upload Invoice pdf</Button>
//             </CardFooter>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
