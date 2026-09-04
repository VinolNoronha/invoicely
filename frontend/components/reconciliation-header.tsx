import { Sparkles } from "lucide-react";

export default function ReconciliationHeader() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6" />

        <h1 className="text-3xl font-bold tracking-tight">AI Reconciliation</h1>
      </div>

      <p className="text-muted-foreground">
        Match purchase invoices against GSTR-2B records.
      </p>
    </div>
  );
}
