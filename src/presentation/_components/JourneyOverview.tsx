"use client"
import React from "react"
import { Cell, Pie, PieChart } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

const chartData = [
  { segment: "ulez", value: 30, amount: "30", percentage: "30.0%", fill: "var(--color-ulez)" },
  { segment: "tunnel", value: 30, amount: "30", percentage: "30.0%", fill: "var(--color-tunnel)" },
  { segment: "congestion", value: 15, amount: "15", percentage: "15.0%", fill: "var(--color-congestion)" },
  { segment: "others", value: 10, amount: "10", percentage: "10.0%", fill: "var(--color-others)" },
]

const chartConfig = {
  ulez: { label: "ULEZ", color: "#9333EA" },
  tunnel: { label: "Tunnel", color: "#F87171" },
  congestion: { label: "Congestion", color: "#00BCE0" },
  others: { label: "Others", color: "#486EFD" },
} satisfies ChartConfig

export default function JourneyOverview(): React.JSX.Element {
  return (
    <div className="flex h-full w-full flex-col bg-white p-6 rounded-[16px] shadow-[0px_0px_10px_0px_#0000001A] font-sans text-[#1E2B4B]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold tracking-tight">Journey Overview</h2>
        <button className="text-sm text-slate-500 font-medium hover:text-slate-700 transition">View All</button>
      </div>

      {/* Content layout */}
      <div className="flex flex-1 items-center justify-between gap-4">
        <ChartContainer config={chartConfig} className="mx-0 h-[140px] w-[140px]">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="segment"
              innerRadius={38}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Legend Layout matches image exactly */}
        <div className="flex flex-col gap-3.5 w-52">
          {chartData.map((item) => {
            const config = chartConfig[item.segment as keyof typeof chartConfig]
            return (
              <div key={item.segment} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="font-medium text-slate-700">{config.label}</span>
                </div>
                <span className="text-slate-500 text-xs font-mono">
                  {item.amount} <span className="text-slate-400">({item.percentage})</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
