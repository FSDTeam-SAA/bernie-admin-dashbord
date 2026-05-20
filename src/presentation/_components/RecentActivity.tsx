import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ActivityData {
  token: string;
  totalAmount: string;
  date: string;
  registration: string;
}

const tableData: ActivityData[] = [
  {
    token: "£5",
    totalAmount: "£45",
    date: "11-12-2026",
    registration: "LX 334 GHO",
  },
  {
    token: "£5",
    totalAmount: "£45",
    date: "11-12-2026",
    registration: "LKJ 787 HUI",
  },
  {
    token: "£5",
    totalAmount: "£40",
    date: "11-12-2026",
    registration: "2332 KJ KKK",
  },
];

export default function RecentActivity(): React.JSX.Element {
  return (
    <div className="mt-6 w-full rounded-[16px] bg-white font-sans text-[#1E2B4B]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
        <button className="text-sm font-medium text-slate-500 transition hover:text-slate-800 mt-6">
          View All
        </button>
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
