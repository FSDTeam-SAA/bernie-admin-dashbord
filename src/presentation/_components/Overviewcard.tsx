"use client";

import React from 'react';
import { Car, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

// 1. Define TypeScript interfaces for strict type checking
interface CardItemProps {
  title: string;
  value: string | number;
  // Allows both Lucide component components and custom render functions (like the £ symbol)
  icon: React.ComponentType<{ className?: string }> | (() => React.JSX.Element);
  gradientClass: string;
}

interface CardData {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }> | (() => React.JSX.Element);
  gradientClass: string;
}

interface DashboardStatsResponse {
  success: boolean;
  message: string;
  data: {
    totalRevenue: number;
    activeJourneyUsers: number;
    monthlyTokenCount: number;
  };
}

// 2. Sub-component with explicit TS props
const CardItem: React.FC<CardItemProps> = ({ title, value, icon: Icon, gradientClass }) => {
  return (
    <div className={`flex flex-col justify-between p-6 rounded-xl text-white shadow-md relative overflow-hidden h-36 ${gradientClass}`}>
      {/* Top Section: Title & Icon */}
      <div className="flex justify-between items-start w-full">
        <span className="text-xs font-normal text-slate-200 tracking-wide opacity-90">
          {title}
        </span>
        <div className="bg-white text-[#002855] p-2.5 rounded-xl shadow-sm flex items-center justify-center w-10 h-10">
          <Icon className="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>

      {/* Bottom Section: Main Value */}
      <div className="mt-auto">
        <span className="text-4xl font-extrabold tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
};

// 3. Main Dashboard Overview Component
export default function OverviewCard(): React.JSX.Element {
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;

  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/admin/dashboard/stats`, {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      });

      const response = (await res.json()) as DashboardStatsResponse;

      if (!res.ok || !response.success) {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }

      return response.data;
    },
  });

  // Strongly typed data array to prevent structural errors
  const cardData: CardData[] = [
    {
      title: 'Total Revenue',
      value: `£${overviewData?.totalRevenue ?? 0}`,
      // Custom inline text icon so the '£' perfectly matches your UI screenshot style
      icon: () => <span className="text-lg font-extrabold leading-none select-none">£</span>,
      gradientClass: 'bg-[#002855]', 
    },
    {
      title: 'Active Journey Users',
      value: overviewData?.activeJourneyUsers ?? 0,
      icon: Car, // Lucide Car icon
      gradientClass: 'bg-[#0052B4]', 
    },
    {
      title: 'Monthly Lottery Participation',
      value: overviewData?.monthlyTokenCount ?? 0,
      icon: User, // Lucide User icon
      gradientClass: 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]', 
    },
  ];

  if (status === 'loading' || isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex h-36 flex-col justify-between rounded-xl bg-white p-6 shadow-md"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="h-4 w-28 bg-slate-200/80" />
                <Skeleton className="h-10 w-10 rounded-xl bg-slate-200/80" />
              </div>
              <Skeleton className="h-10 w-24 bg-slate-200/80" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cardData.map((card, index) => (
          <CardItem
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            gradientClass={card.gradientClass}
          />
        ))}
      </div>
    </div>
  );
}
