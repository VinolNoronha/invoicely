import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, CircleAlert, IndianRupee, Files } from "lucide-react";
import { formatINR } from "@/lib/utils";

type Stats = {
  totalProcessed: number;
  matchRate: number;
  matchedCount: number;
  verifiedItc: number;
  exceptions: number;
  pending: number;
};

export default function ReconciliationStats({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Invoices Processed",
      value: String(stats.totalProcessed),
      description:
        stats.pending > 0
          ? `${stats.pending} awaiting reconciliation`
          : "Purchase invoices analyzed",
      icon: Files,
    },
    {
      title: "Match Rate",
      value: `${stats.matchRate}%`,
      description: `${stats.matchedCount} of ${stats.totalProcessed + stats.pending} invoices reconciled`,
      icon: CheckCircle2,
    },
    {
      title: "Verified Claimable ITC",
      value: formatINR(stats.verifiedItc, { decimals: 1 }),
      description: "ITC verified against GSTR-2B",
      icon: IndianRupee,
    },
    {
      title: "Exceptions",
      value: String(stats.exceptions),
      description: "Records requiring attention",
      icon: CircleAlert,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h2 className="mt-2 text-3xl font-bold">{stat.value}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
