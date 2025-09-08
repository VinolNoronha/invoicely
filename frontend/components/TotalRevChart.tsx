"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getMonthlySales } from "@/lib/utils";

// const chartData = [
//   { month: "January 2024", desktop: 186 },
//   { month: "February", desktop: 305 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
//   { month: "July", desktop: 314, mobile: 140 },
//   { month: "August", desktop: 244, mobile: 140 },
//   { month: "September", desktop: 124, mobile: 140 },
//   { month: "October", desktop: 234, mobile: 140 },
//   { month: "November", desktop: 212, mobile: 140 },
//   { month: "December", desktop: 216, mobile: 140 },
// ];

const chartData = await getMonthlySales("6b8cf389-c67a-4b58-81f9-74af0ced1379");

const chartConfig = {
  desktop: {
    label: "Sales",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export default function TotalChartRev() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[400px] w-20/21">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <YAxis tickLine={false} tickMargin={15} axisLine={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
