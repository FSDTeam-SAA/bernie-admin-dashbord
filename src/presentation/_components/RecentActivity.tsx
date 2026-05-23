"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ActivityData {
  token: string;
  totalAmount: string;
  date: string;
  registration: string;
}

interface Transaction {
  _id: string;
  vehicleNumber: string;
  totalAmount: number;
  purchaseDate: string;
  serviceType: string;
  serviceName?: string;
}

interface TransactionsResponse {
  success: boolean;
  message: string;
  data: {
    transactions: Transaction[];
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB")
    .format(new Date(date))
    .replaceAll("/", "-");
}

export default function RecentActivity(): React.JSX.Element {
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;

  const { data: tableData = [] } = useQuery({
    queryKey: ["recent-transactions"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/admin/transactions?limit=5`,
        {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
        },
      );

      const response = (await res.json()) as TransactionsResponse;

      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to fetch transactions");
      }

      return response.data.transactions.map<ActivityData>((transaction) => ({
        token: transaction.serviceName ?? transaction.serviceType,
        totalAmount: `£${transaction.totalAmount}`,
        date: formatDate(transaction.purchaseDate),
        registration: transaction.vehicleNumber,
      }));
    },
  });

  return (
    <div className="mt-6 w-full rounded-[16px] bg-white font-sans text-[#1E2B4B]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
        <Link href="/transaction-management" className="ml-auto">
          <button className="text-sm font-medium cursor-pointer text-slate-500 transition hover:text-slate-800 mt-6">
            View All
          </button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <Table className="">
          <TableHeader className="bg-[#E0EEFF]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 w-[18%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Token
              </TableHead>
              <TableHead className="h-12 w-[22%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Total Amount
              </TableHead>
              <TableHead className="h-12 w-[22%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Date
              </TableHead>
              <TableHead className="h-12 w-[38%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Vehicle Registration Number
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow
                key={index}
                className="border-slate-100 transition hover:bg-slate-50"
              >
                <TableCell className="px-6 py-5 text-center">
                  <span className="mx-auto inline-flex h-9 min-w-14 items-center justify-center rounded-xl bg-[#EBF5FF] px-3 text-sm font-extrabold text-[#0052B4]">
                    {row.token}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-5 text-center text-base font-bold text-slate-950">
                  {row.totalAmount}
                </TableCell>
                <TableCell className="px-6 py-5 text-center font-medium text-slate-600">
                  {row.date}
                </TableCell>
                <TableCell className="px-6 py-5 text-center font-mono font-semibold tracking-wider text-slate-700">
                  {row.registration}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
