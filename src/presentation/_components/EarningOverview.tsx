"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const chartData = [
  { day: "Mon", earnings: 420 },
  { day: "Tue", earnings: 280 },
  { day: "Wed", earnings: 320 },
  { day: "Thu", earnings: 900 },
  { day: "Fri", earnings: 550 },
  { day: "Sat", earnings: 700 },
  { day: "Sun", earnings: 1350 },
];

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "#0A6C9E",
  },
} satisfies ChartConfig;

export default function EarningOverview(): React.JSX.Element {
  return (
    <div className="h-full w-full bg-white p-6 rounded-[16px] shadow-[0px_0px_10px_0px_#0000001A] font-sans text-[#1E2B4B]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Earning Overview</h2>
          <p className="text-sm text-slate-500 mt-1">
            Your weekly earnings growth trajectory.
          </p>
        </div>
        <Select defaultValue="weekly">
          <SelectTrigger className="h-10 rounded-xl border-0 bg-slate-100 px-4 text-slate-700 shadow-none hover:bg-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 10, left: -20, right: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="5%" stopColor="#87CEEB" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#87CEEB" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="4 4"
            stroke="#F1F5F9"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={[0, 1500]}
            ticks={[0, 300, 600, 900, 1200, 1500]}
            className="text-xs text-slate-400 font-mono"
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            className="text-xs text-slate-400"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="earnings"
            type="monotone"
            fill="url(#earningsGrad)"
            stroke="var(--color-earnings)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
