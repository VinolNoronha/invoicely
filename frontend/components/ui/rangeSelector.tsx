"use client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type DateRange } from "@/lib/utils";

export default function GstStatsWrapper() {
  const router = useRouter(); //used to do url navigation push, replace etc..
  const searchParams = useSearchParams(); //used to read url search params
  const range = (searchParams.get("range") ?? "30d") as DateRange;

  const handleChange = (val: DateRange) => {
    router.replace(`?range=${val}`);
  };

  return (
    <div className="flex justify-end">
      <Select value={range} onValueChange={handleChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="3m">Last 3 months</SelectItem>
          <SelectItem value="6m">Last 6 months</SelectItem>
          <SelectItem value="1y">Last 1 year</SelectItem>
          <SelectItem value="fy">This financial year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
