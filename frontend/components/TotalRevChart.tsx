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
import { getMonthlyCashflow, getUser, formatINR } from "@/lib/utils";
import { useEffect, useState } from "react";

const chartConfig = {
  received: {
    label: "Received",
    color: "#16a34a",
  },
  pending: {
    label: "Pending",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

export default function TotalChartRev() {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const user = await getUser();
      const id = user?.id;

      if (id) {
        const data = await getMonthlyCashflow(id);
        setChartData(data);
      }
    }

    fetchData();
  }, []);

  return (
    <ChartContainer config={chartConfig} className="min-h-[400px] w-20/21">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <YAxis
          tickLine={false}
          tickMargin={15}
          axisLine={false}
          width={60}
          tickFormatter={(value) => formatINR(value, { decimals: 1 })}
        />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => {
            const [month, year] = value.split(" ");
            return `${month.slice(0, 3)} ${year.slice(2)}`;
          }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="received"
          stackId="revenue"
          fill="var(--color-received)"
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="pending"
          stackId="revenue"
          fill="var(--color-pending)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}

// "use client";

// import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

// import {
//   ChartConfig,
//   ChartContainer,
//   ChartLegend,
//   ChartLegendContent,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";
// import { getMonthlySales, getUser } from "@/lib/utils";
// import { useEffect, useState } from "react";

// // const chartData = [
// //   { month: "January 2024", desktop: 186 },
// //   { month: "February", desktop: 305 },
// //   { month: "March", desktop: 237, mobile: 120 },
// //   { month: "April", desktop: 73, mobile: 190 },
// //   { month: "May", desktop: 209, mobile: 130 },
// //   { month: "June", desktop: 214, mobile: 140 },
// //   { month: "July", desktop: 314, mobile: 140 },
// //   { month: "August", desktop: 244, mobile: 140 },
// //   { month: "September", desktop: 124, mobile: 140 },
// //   { month: "October", desktop: 234, mobile: 140 },
// //   { month: "November", desktop: 212, mobile: 140 },
// //   { month: "December", desktop: 216, mobile: 140 },
// // ];

// // const user = await getUser();
// // console.log(user);
// // const id = user?.id;
// // console.log(typeof id);
// // const chartData = await getMonthlySales(id);

// const chartConfig = {
//   desktop: {
//     label: "Sales",
//     color: "#2563eb",
//   },
// } satisfies ChartConfig;

// export default function TotalChartRev() {
//   const [chartData, setChartData] = useState<any[]>([]);

//   useEffect(() => {
//     async function fetchData() {
//       const user = await getUser();
//       const id = user?.id;

//       if (id) {
//         const data = await getMonthlySales(id);
//         setChartData(data);
//       }
//     }

//     fetchData();
//   }, []);

//   return (
//     <ChartContainer config={chartConfig} className="min-h-[400px] w-20/21">
//       <BarChart accessibilityLayer data={chartData}>
//         <CartesianGrid vertical={false} />
//         <YAxis tickLine={false} tickMargin={15} axisLine={false} />
//         <XAxis
//           dataKey="month"
//           tickLine={false}
//           tickMargin={10}
//           axisLine={false}
//           tickFormatter={(value) => {
//             const [month, year] = value.split(" ");
//             return `${month.slice(0, 3)} ${year.slice(2)}`;
//           }}
//         />
//         <ChartTooltip content={<ChartTooltipContent />} />
//         <ChartLegend content={<ChartLegendContent />} />
//         <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
//       </BarChart>
//     </ChartContainer>
//   );
// }
