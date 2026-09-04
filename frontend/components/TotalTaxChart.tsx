"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getMonthlyGstChartServer, getUserServer } from "@/lib/actions";
import { formatINR } from "@/lib/utils";

const chartConfig = {
  output: {
    label: "Output GST",
    color: "#16a34a",
  },
  itc: {
    label: "Input Tax Credit",
    color: "#2563eb",
  },
} satisfies ChartConfig;

type ChartItem = {
  month: string;
  output: number;
  itc: number;
};

export default function TotalTaxChart() {
  const [chartData, setChartData] = React.useState<ChartItem[]>([]);

  React.useEffect(() => {
    async function fetchData() {
      const user = await getUserServer();
      const id = user?.id;
      const data = await getMonthlyGstChartServer(id);
      setChartData(data ?? []);
    }
    fetchData();
  }, []);

  return (
    <Card className="w-[95%] mx-auto">
      <CardHeader className="flex flex-col sm:flex-row items-center gap-2 space-y-0 border-b py-4 sm:py-2">
        <div className="grid flex-1 gap-1 text-center sm:text-left w-full">
          <div className="bg-amber-60 px-4 sm:px-10">
            <p className="sm:text-sm text-xs font-medium text-black hover:underline hover:decoration-2 hover:decoration-blue-600">
              Monthly Output GST vs Input Tax Credit
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => {
                const [month, year] = value.split(" ");
                return `${month.slice(0, 3)} ${year.slice(2)}`;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(value) => formatINR(value, { decimals: 1 })}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="output" fill="var(--color-output)" radius={4} />
            <Bar dataKey="itc" fill="var(--color-itc)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// "use client";

// import * as React from "react";
// import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   ChartConfig,
//   ChartContainer,
//   ChartLegend,
//   ChartLegendContent,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { getGstChartData, getUser } from "@/lib/utils";

// const chartConfig = {
//   visitors: {
//     label: "Visitors",
//   },
//   total_amount: {
//     label: "Total Rev.",
//     color: "hsl(var(--chart-1))",
//   },
//   op_gst: {
//     label: "O/P GST",
//     color: "hsl(var(--chart-2))",
//   },
// } satisfies ChartConfig;

// type ChartItem = {
//   date: string;
//   total_amount: number;
//   total_tax: number;
// };

// export default function TotalTaxChart() {
//   const [timeRange, setTimeRange] = React.useState("90d");
//   const [chartData, setChartData] = React.useState<ChartItem[]>([]);

//   React.useEffect(() => {
//     async function fetchData() {
//       const user = await getUser();
//       const id = user?.id;
//       const dta = await getGstChartData(id);
//       setChartData(dta || []);
//     }
//     fetchData();
//   }, []);

//   const filteredData = chartData.filter((item) => {
//     const date = new Date(item.date);
//     const referenceDate = new Date();
//     let daysToSubtract = 90;
//     if (timeRange === "30d") {
//       daysToSubtract = 30;
//     } else if (timeRange === "1y") {
//       daysToSubtract = 365;
//     }
//     const startDate = new Date(referenceDate);
//     startDate.setDate(startDate.getDate() - daysToSubtract);
//     return date >= startDate;
//   });

//   return (
//     <Card className="w-[95%] mx-auto">
//       <CardHeader className="flex flex-col sm:flex-row items-center gap-2 space-y-0 border-b py-4 sm:py-2">
//         <div className="grid flex-1 gap-1 text-center sm:text-left w-full">
//           <div className="bg-amber-60 px-4 sm:px-10">
//             <p className="sm:text-sm text-xs font-medium text-black hover:underline hover:decoration-2 hover:decoration-blue-600">
//               Daily Total Revenue v/s GST Collection
//             </p>
//           </div>
//         </div>
//         <Select value={timeRange} onValueChange={setTimeRange}>
//           <SelectTrigger
//             className="w-[60%] sm:w-[160px] rounded-lg sm:ml-auto"
//             aria-label="Select a value"
//           >
//             <SelectValue placeholder="Last 3 months" />
//           </SelectTrigger>
//           <SelectContent className="rounded-xl">
//             <SelectItem value="90d" className="rounded-lg">
//               Last 3 months
//             </SelectItem>
//             <SelectItem value="30d" className="rounded-lg">
//               Last 30 days
//             </SelectItem>
//             <SelectItem value="1y" className="rounded-lg">
//               Last 1 year
//             </SelectItem>
//           </SelectContent>
//         </Select>
//       </CardHeader>
//       <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
//         <ChartContainer
//           config={chartConfig}
//           className="aspect-auto h-[140px] w-full"
//         >
//           <AreaChart data={filteredData}>
//             <defs>
//               <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
//                 <stop
//                   offset="5%"
//                   stopColor="var(--color-desktop)"
//                   stopOpacity={0.8}
//                 />
//                 <stop
//                   offset="95%"
//                   stopColor="var(--color-desktop)"
//                   stopOpacity={0.1}
//                 />
//               </linearGradient>
//               <linearGradient id="fillGst" x1="0" y1="0" x2="0" y2="1">
//                 <stop
//                   offset="5%"
//                   stopColor="var(--color-mobile)"
//                   stopOpacity={0.8}
//                 />
//                 <stop
//                   offset="95%"
//                   stopColor="var(--color-mobile)"
//                   stopOpacity={0.1}
//                 />
//               </linearGradient>
//             </defs>
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="date"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               minTickGap={32}
//               tickFormatter={(value) => {
//                 const date = new Date(value);
//                 return date.toLocaleDateString("en-US", {
//                   month: "short",
//                   day: "numeric",
//                 });
//               }}
//             />
//             <ChartTooltip
//               cursor={false}
//               content={
//                 <ChartTooltipContent
//                   labelFormatter={(value) => {
//                     return new Date(value).toLocaleDateString("en-US", {
//                       month: "short",
//                       day: "numeric",
//                     });
//                   }}
//                   indicator="dot"
//                 />
//               }
//             />
//             <Area
//               dataKey="total_amount"
//               type="natural"
//               fill="url(#fillTotal)"
//               stroke={chartConfig.total_amount.color}
//               stackId="a"
//             />
//             <Area
//               dataKey="total_tax"
//               type="natural"
//               fill="url(#fillGst)"
//               stroke={chartConfig.op_gst.color}
//               stackId="b"
//             />
//             <ChartLegend content={<ChartLegendContent />} />
//           </AreaChart>
//         </ChartContainer>
//       </CardContent>
//     </Card>
//   );
// }
