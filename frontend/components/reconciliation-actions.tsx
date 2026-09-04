"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Sparkles, FileSpreadsheet, Zap, Loader2 } from "lucide-react";
import type { GSTR2BRecordInput } from "@/lib/reconciliation-actions";

// Expects a JSON file containing either a bare array of records, or an
// object with a top-level "gstr2b_records" key (matching the same shape
// you'd POST to /api/v1/reconciliation/run via Swagger) — so a file saved
// straight from a Swagger request body works without editing.
function parseGstr2bJson(text: string): GSTR2BRecordInput[] {
  const parsed = JSON.parse(text);
  const records = Array.isArray(parsed) ? parsed : parsed.gstr2b_records;

  if (!Array.isArray(records)) {
    throw new Error(
      "Expected a JSON array of records, or an object with a gstr2b_records array.",
    );
  }

  return records.map((r: any) => ({
    gstin: String(r.gstin),
    inv_num: String(r.inv_num),
    inv_date: String(r.inv_date),
    taxable_value: Number(r.taxable_value),
    total_tax: Number(r.total_tax),
  }));
}

export default function ReconciliationActions({
  onUploaded,
  onRun,
  isRunning,
  uploadedCount,
  lastRunStats,
}: {
  onUploaded: (records: GSTR2BRecordInput[]) => void;
  onRun: () => void;
  isRunning: boolean;
  uploadedCount: number;
  lastRunStats: {
    totalDbInvoices: number;
    totalGstr2bRecords: number;
    processingTimeSeconds: number;
  } | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const records = parseGstr2bJson(text);
      onUploaded(records);
      setFileName(file.name);
    } catch (err) {
      console.error("Failed to parse GSTR-2B JSON:", err);
      alert(
        "Couldn't parse that file. Expected a JSON array of objects with gstin, inv_num, inv_date, taxable_value, total_tax.",
      );
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-muted p-3">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">GSTR-2B Data</h3>
              <p className="text-sm text-muted-foreground">
                Upload GSTR-2B records to match against your purchase invoices.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {fileName ? fileName : "Upload GSTR-2B"}
            </Button>

            <Button onClick={onRun} disabled={isRunning || uploadedCount === 0}>
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isRunning ? "Running..." : "Run AI Reconciliation"}
            </Button>
          </div>
        </div>

        {lastRunStats ? (
          <div className="border-t pt-4">
            <Badge
              variant="secondary"
              className="flex w-fit items-center gap-1.5 px-3 py-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              {lastRunStats.totalDbInvoices} invoices vs{" "}
              {lastRunStats.totalGstr2bRecords} GSTR-2B records reconciled in{" "}
              {lastRunStats.processingTimeSeconds.toFixed(3)}s
            </Badge>
          </div>
        ) : (
          uploadedCount > 0 && (
            <div className="border-t pt-4">
              <Badge
                variant="secondary"
                className="flex w-fit items-center gap-1.5 px-3 py-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                {uploadedCount} GSTR-2B records loaded, ready to reconcile
              </Badge>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
