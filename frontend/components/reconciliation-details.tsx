"use client";

import { Sparkles, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { ReconciliationRecord } from "./reconciliation-table";

interface ReconciliationDetailsProps {
  record: ReconciliationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onExplain?: (id: string) => void;
  isExplaining?: boolean;
  explainError?: string | null;
}

export default function ReconciliationDetails({
  record,
  open,
  onOpenChange,
  onAccept,
  onReject,
  onExplain,
  isExplaining,
  explainError,
}: ReconciliationDetailsProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reconciliation Details</DialogTitle>

          <DialogDescription>
            Compare the purchase invoice against the GSTR-2B record and review
            the AI decision.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 md:grid-cols-2">
          {/* Invoice Data */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Purchase Invoice</h3>

            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{record.invoiceNumber}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Supplier GSTIN</p>
              <p className="font-medium font-mono text-sm">
                {record.supplierGstin}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Invoice GST</p>
              <p className="font-medium">
                ₹{record.invoiceTax.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* GSTR-2B Data */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">GSTR-2B Record</h3>

            <div>
              <p className="text-sm text-muted-foreground">GST Amount</p>

              <p className="font-medium">
                {record.gstr2bTax !== null
                  ? `₹${record.gstr2bTax.toLocaleString("en-IN")}`
                  : "No matching record found"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">AI Confidence</p>

              <p className="font-medium">
                {record.confidence !== null
                  ? `${record.confidence}%`
                  : "No confidence available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>

              <p className="font-medium capitalize">
                {record.status === "review"
                  ? "Needs Review"
                  : record.status === "pending"
                    ? "Pending"
                    : record.status}
              </p>
            </div>
          </div>
        </div>

        {/* AI reasoning */}
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm font-medium">AI Match Reason</p>

          <p className="mt-2 text-sm text-muted-foreground">{record.reason}</p>
        </div>

        {explainError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{explainError}</p>
          </div>
        )}

        {record.status === "review" && (
          <DialogFooter className="flex-wrap gap-2">
            {!record.hasAiExplanation && (
              <Button
                variant="secondary"
                onClick={() => onExplain?.(record.id)}
                disabled={isExplaining}
              >
                {isExplaining ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isExplaining ? "Analyzing..." : "Explain with AI"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                onReject?.(record.id);
                onOpenChange(false);
              }}
            >
              Reject Match
            </Button>

            <Button
              onClick={() => {
                onAccept?.(record.id);
                onOpenChange(false);
              }}
            >
              Confirm Match
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// "use client";

// import { Button } from "@/components/ui/button";

// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// import type { ReconciliationRecord } from "./reconciliation-table";

// interface ReconciliationDetailsProps {
//   record: ReconciliationRecord | null;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onAccept?: (id: string) => void;
//   onReject?: (id: string) => void;
// }

// export default function ReconciliationDetails({
//   record,
//   open,
//   onOpenChange,
//   onAccept,
//   onReject,
// }: ReconciliationDetailsProps) {
//   if (!record) return null;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Reconciliation Details</DialogTitle>

//           <DialogDescription>
//             Compare the purchase invoice against the GSTR-2B record and review
//             the AI decision.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="grid gap-6 py-4 md:grid-cols-2">
//           {/* Invoice Data */}
//           <div className="space-y-4 rounded-lg border p-4">
//             <h3 className="font-semibold">Purchase Invoice</h3>

//             <div>
//               <p className="text-sm text-muted-foreground">Invoice Number</p>
//               <p className="font-medium">{record.invoiceNumber}</p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">Supplier GSTIN</p>
//               <p className="font-medium font-mono text-sm">
//                 {record.supplierGstin}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">Invoice GST</p>
//               <p className="font-medium">
//                 ₹{record.invoiceTax.toLocaleString("en-IN")}
//               </p>
//             </div>
//           </div>

//           {/* GSTR-2B Data */}
//           <div className="space-y-4 rounded-lg border p-4">
//             <h3 className="font-semibold">GSTR-2B Record</h3>

//             <div>
//               <p className="text-sm text-muted-foreground">GST Amount</p>

//               <p className="font-medium">
//                 {record.gstr2bTax !== null
//                   ? `₹${record.gstr2bTax.toLocaleString("en-IN")}`
//                   : "No matching record found"}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">AI Confidence</p>

//               <p className="font-medium">
//                 {record.confidence !== null
//                   ? `${record.confidence}%`
//                   : "No confidence available"}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-muted-foreground">Status</p>

//               <p className="font-medium capitalize">
//                 {record.status === "review"
//                   ? "Needs Review"
//                   : record.status === "pending"
//                     ? "Pending"
//                     : record.status}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* AI reasoning */}
//         <div className="rounded-lg border bg-muted/40 p-4">
//           <p className="text-sm font-medium">AI Match Reason</p>

//           <p className="mt-2 text-sm text-muted-foreground">{record.reason}</p>
//         </div>

//         {record.status === "review" && (
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => {
//                 onReject?.(record.id);
//                 onOpenChange(false);
//               }}
//             >
//               Reject Match
//             </Button>

//             <Button
//               onClick={() => {
//                 onAccept?.(record.id);
//                 onOpenChange(false);
//               }}
//             >
//               Confirm Match
//             </Button>
//           </DialogFooter>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }
