"use client";

import { useState } from "react";

import {
  Check,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock,
  Eye,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ReconciliationDetails from "./reconciliation-details";

export type ReconciliationStatus =
  | "matched"
  | "review"
  | "unmatched"
  | "pending";

export type ReconciliationRecord = {
  id: string;
  invoiceNumber: string;
  supplierGstin: string;
  invoiceTax: number;
  invoiceTaxableValue: number;
  gstr2bTax: number | null;
  gstr2bTaxableValue: number | null;
  confidence: number | null;
  reason: string;
  status: ReconciliationStatus;
  hasAiExplanation: boolean;
};

export default function ReconciliationTable({
  records,
  onAccept,
  onReject,
  onExplain,
  explainingId,
  explainError,
  onDismissExplainError,
}: {
  records: ReconciliationRecord[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onExplain: (id: string) => void;
  explainingId: string | null;
  explainError: string | null;
  onDismissExplainError: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Derive the modal's record live from the current `records` array rather
  // than freezing a snapshot at click-time — otherwise, once handleExplain
  // updates the parent's rows, an already-open modal would keep showing
  // the old (pre-explanation) reason until closed and reopened.
  const selectedRecord = selectedId
    ? (records.find((r) => r.id === selectedId) ?? null)
    : null;

  const renderStatus = (status: ReconciliationStatus) => {
    if (status === "pending") {
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }

    if (status === "matched") {
      return (
        <Badge className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Matched
        </Badge>
      );
    }

    if (status === "review") {
      return (
        <Badge variant="secondary" className="gap-1">
          <CircleAlert className="h-3 w-3" />
          Needs Review
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <CircleX className="h-3 w-3" />
        Unmatched
      </Badge>
    );
  };

  const ReconciliationRows = ({ data }: { data: ReconciliationRecord[] }) => (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice No.</TableHead>

            <TableHead>Supplier GSTIN</TableHead>

            <TableHead>Invoice GST</TableHead>

            <TableHead>GSTR-2B GST</TableHead>

            <TableHead>Confidence</TableHead>

            <TableHead className="w-[280px]">AI Match Reason</TableHead>

            <TableHead>Status</TableHead>

            <TableHead className="w-[140px] text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.invoiceNumber}
              </TableCell>

              <TableCell className="font-mono text-xs">
                {record.supplierGstin}
              </TableCell>

              <TableCell>
                ₹{record.invoiceTax.toLocaleString("en-IN")}
              </TableCell>

              <TableCell>
                {record.gstr2bTax !== null
                  ? `₹${record.gstr2bTax.toLocaleString("en-IN")}`
                  : "-"}
              </TableCell>

              <TableCell>
                {record.confidence !== null ? `${record.confidence}%` : "-"}
              </TableCell>

              <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                {record.reason}
              </TableCell>

              <TableCell>{renderStatus(record.status)}</TableCell>

              <TableCell className="w-[140px] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  {record.status === "review" && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onAccept(record.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onReject(record.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedId(record.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Results</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>

              <TabsTrigger value="matched">Matched</TabsTrigger>

              <TabsTrigger value="review">Needs Review</TabsTrigger>

              <TabsTrigger value="unmatched">Exceptions</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ReconciliationRows data={records} />
            </TabsContent>

            <TabsContent value="matched">
              <ReconciliationRows
                data={records.filter((record) => record.status === "matched")}
              />
            </TabsContent>

            <TabsContent value="review">
              <ReconciliationRows
                data={records.filter((record) => record.status === "review")}
              />
            </TabsContent>

            <TabsContent value="unmatched">
              <ReconciliationRows
                data={records.filter((record) => record.status === "unmatched")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ReconciliationDetails
        record={selectedRecord}
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            onDismissExplainError();
          }
        }}
        onAccept={onAccept}
        onReject={onReject}
        onExplain={onExplain}
        isExplaining={selectedId === explainingId}
        explainError={selectedId === explainingId ? null : explainError}
      />
    </>
  );
}

// "use client";

// import { useState } from "react";

// import {
//   Check,
//   CheckCircle2,
//   CircleAlert,
//   CircleX,
//   Clock,
//   Eye,
//   X,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// import { Badge } from "@/components/ui/badge";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// import ReconciliationDetails from "./reconciliation-details";

// export type ReconciliationStatus =
//   | "matched"
//   | "review"
//   | "unmatched"
//   | "pending";

// export type ReconciliationRecord = {
//   id: string;
//   invoiceNumber: string;
//   supplierGstin: string;
//   invoiceTax: number;
//   gstr2bTax: number | null;
//   confidence: number | null;
//   reason: string;
//   status: ReconciliationStatus;
// };

// export default function ReconciliationTable({
//   records,
//   onAccept,
//   onReject,
// }: {
//   records: ReconciliationRecord[];
//   onAccept: (id: string) => void;
//   onReject: (id: string) => void;
// }) {
//   const [selectedRecord, setSelectedRecord] =
//     useState<ReconciliationRecord | null>(null);

//   const renderStatus = (status: ReconciliationStatus) => {
//     if (status === "pending") {
//       return (
//         <Badge variant="outline" className="gap-1 text-muted-foreground">
//           <Clock className="h-3 w-3" />
//           Pending
//         </Badge>
//       );
//     }

//     if (status === "matched") {
//       return (
//         <Badge className="gap-1">
//           <CheckCircle2 className="h-3 w-3" />
//           Matched
//         </Badge>
//       );
//     }

//     if (status === "review") {
//       return (
//         <Badge variant="secondary" className="gap-1">
//           <CircleAlert className="h-3 w-3" />
//           Needs Review
//         </Badge>
//       );
//     }

//     return (
//       <Badge variant="destructive" className="gap-1">
//         <CircleX className="h-3 w-3" />
//         Unmatched
//       </Badge>
//     );
//   };

//   const ReconciliationRows = ({ data }: { data: ReconciliationRecord[] }) => (
//     <div className="w-full overflow-x-auto">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Invoice No.</TableHead>

//             <TableHead>Supplier GSTIN</TableHead>

//             <TableHead>Invoice GST</TableHead>

//             <TableHead>GSTR-2B GST</TableHead>

//             <TableHead>Confidence</TableHead>

//             <TableHead className="w-[280px]">AI Match Reason</TableHead>

//             <TableHead>Status</TableHead>

//             <TableHead className="w-[140px] text-right">Action</TableHead>
//           </TableRow>
//         </TableHeader>

//         <TableBody>
//           {data.map((record) => (
//             <TableRow key={record.id}>
//               <TableCell className="font-medium">
//                 {record.invoiceNumber}
//               </TableCell>

//               <TableCell className="font-mono text-xs">
//                 {record.supplierGstin}
//               </TableCell>

//               <TableCell>
//                 ₹{record.invoiceTax.toLocaleString("en-IN")}
//               </TableCell>

//               <TableCell>
//                 {record.gstr2bTax !== null
//                   ? `₹${record.gstr2bTax.toLocaleString("en-IN")}`
//                   : "-"}
//               </TableCell>

//               <TableCell>
//                 {record.confidence !== null ? `${record.confidence}%` : "-"}
//               </TableCell>

//               <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
//                 {record.reason}
//               </TableCell>

//               <TableCell>{renderStatus(record.status)}</TableCell>

//               <TableCell className="w-[140px] whitespace-nowrap">
//                 <div className="flex items-center justify-end gap-1">
//                   {record.status === "review" && (
//                     <>
//                       <Button
//                         variant="outline"
//                         size="icon"
//                         className="h-8 w-8"
//                         onClick={() => onAccept(record.id)}
//                       >
//                         <Check className="h-4 w-4" />
//                       </Button>

//                       <Button
//                         variant="outline"
//                         size="icon"
//                         className="h-8 w-8"
//                         onClick={() => onReject(record.id)}
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                     </>
//                   )}

//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="h-8 w-8"
//                     onClick={() => setSelectedRecord(record)}
//                   >
//                     <Eye className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );

//   return (
//     <>
//       <Card>
//         <CardHeader>
//           <CardTitle>Reconciliation Results</CardTitle>
//         </CardHeader>

//         <CardContent>
//           <Tabs defaultValue="all">
//             <TabsList className="mb-4">
//               <TabsTrigger value="all">All</TabsTrigger>

//               <TabsTrigger value="matched">Matched</TabsTrigger>

//               <TabsTrigger value="review">Needs Review</TabsTrigger>

//               <TabsTrigger value="unmatched">Exceptions</TabsTrigger>
//             </TabsList>

//             <TabsContent value="all">
//               <ReconciliationRows data={records} />
//             </TabsContent>

//             <TabsContent value="matched">
//               <ReconciliationRows
//                 data={records.filter((record) => record.status === "matched")}
//               />
//             </TabsContent>

//             <TabsContent value="review">
//               <ReconciliationRows
//                 data={records.filter((record) => record.status === "review")}
//               />
//             </TabsContent>

//             <TabsContent value="unmatched">
//               <ReconciliationRows
//                 data={records.filter((record) => record.status === "unmatched")}
//               />
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>

//       <ReconciliationDetails
//         record={selectedRecord}
//         open={!!selectedRecord}
//         onOpenChange={(open) => {
//           if (!open) {
//             setSelectedRecord(null);
//           }
//         }}
//         onAccept={onAccept}
//         onReject={onReject}
//       />
//     </>
//   );
// }
