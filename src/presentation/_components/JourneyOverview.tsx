"use client";
import React from "react";
import { Cell, Pie, PieChart } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";

const segments = ["ulez", "tunnel", "congestion", "others"] as const;

type ChartSegment = (typeof segments)[number];

interface JourneyChartItem {
  id?: string;
  segment: ChartSegment;
  label: string;
  value: number;
  amount: string;
  percentage: string;
  fill: string;
}

const defaultChartData: JourneyChartItem[] = [
  {
    segment: "ulez",
    label: "ULEZ",
    value: 30,
    amount: "30",
    percentage: "30.0%",
    fill: "var(--color-ulez)",
  },
  {
    segment: "tunnel",
    label: "Tunnel",
    value: 30,
    amount: "30",
    percentage: "30.0%",
    fill: "var(--color-tunnel)",
  },
  {
    segment: "congestion",
    label: "Congestion",
    value: 15,
    amount: "15",
    percentage: "15.0%",
    fill: "var(--color-congestion)",
  },
  {
    segment: "others",
    label: "Others",
    value: 10,
    amount: "10",
    percentage: "10.0%",
    fill: "var(--color-others)",
  },
];

const chartConfig = {
  ulez: { label: "ULEZ", color: "#9333EA" },
  tunnel: { label: "Tunnel", color: "#F87171" },
  congestion: { label: "Congestion", color: "#00BCE0" },
  others: { label: "Others", color: "#486EFD" },
} satisfies ChartConfig;

interface CategoryStat {
  _id: string;
  count: number;
  categoryName?: string;
  category?: {
    name?: string;
  };
  percentage: number;
}

interface DashboardChartsResponse {
  success: boolean;
  message: string;
  data: {
    categoryStats: {
      categories: CategoryStat[];
    };
  };
}

export default function JourneyOverview(): React.JSX.Element {
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;

  const { data: chartData = defaultChartData, isLoading } = useQuery<JourneyChartItem[]>({
    queryKey: ["dashboard-charts", "category-stats"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/admin/dashboard/charts`,
        {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
        },
      );

      const response = (await res.json()) as DashboardChartsResponse;

      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to fetch dashboard charts");
      }

      return response.data.categoryStats.categories.map((category, index) => {
        const segment = segments[index] ?? "others";

        return {
          id: category._id,
          segment,
          label:
            category.categoryName ||
            category.category?.name ||
            "Unknown Category",
          value: category.count,
          amount: String(category.count),
          percentage: `${category.percentage.toFixed(1)}%`,
          fill: `var(--color-${segment})`,
        };
      });
    },
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-full w-full flex-col rounded-[16px] bg-white p-6 font-sans text-[#1E2B4B] shadow-[0px_0px_10px_0px_#0000001A]">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex flex-1 items-center justify-between gap-4">
          <Skeleton className="h-[140px] w-[140px] rounded-full" />
          <div className="flex w-52 flex-col gap-3.5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-white p-6 rounded-[16px] shadow-[0px_0px_10px_0px_#0000001A] font-sans text-[#1E2B4B]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold tracking-tight">Journey Overview</h2>
        <Link
          href="/journey-management"
          className="text-sm text-slate-500 font-medium hover:text-slate-700 transition"
        >
          View All
        </Link>
      </div>

      {/* Content layout */}
      <div className="flex flex-1 items-center justify-between gap-4">
        <ChartContainer
          config={chartConfig}
          className="mx-0 h-[140px] w-[140px]"
        >
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
            const config =
              chartConfig[item.segment as keyof typeof chartConfig];
            return (
              <div
                key={item.id ?? item.segment}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="font-medium text-slate-700">
                    {item.label ?? config.label}
                  </span>
                </div>
                <span className="text-slate-500 text-xs font-mono">
                  {item.amount}{" "}
                  <span className="text-slate-400">({item.percentage})</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
