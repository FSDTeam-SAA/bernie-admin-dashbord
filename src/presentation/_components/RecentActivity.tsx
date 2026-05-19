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
    <div className="w-full max-w-6xl font-sans text-[#1E2B4B]">
      <h2 className="text-xl font-bold tracking-tight mb-6">Recent Activity</h2>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <Table>
          {/* Custom light blue header styling exactly matching your original capture layout */}
          <TableHeader className="bg-[#EBF5FF] border-b-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-700 h-12 px-6">
                Token
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-12 px-6">
                Total Amount
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-12 px-6">
                Date
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-12 px-6">
                Vehicle Registration Number
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {tableData.map((row, index) => (
              <TableRow
                key={index}
                className="hover:bg-slate-50 border-slate-100 transition"
              >
                <TableCell className="px-6 py-4.5 font-extrabold text-slate-950">
                  {row.token}
                </TableCell>
                <TableCell className="px-6 py-4.5 font-bold text-slate-900">
                  {row.totalAmount}
                </TableCell>
                <TableCell className="px-6 py-4.5 font-medium text-slate-600">
                  {row.date}
                </TableCell>
                <TableCell className="px-6 py-4.5 font-mono font-medium text-slate-600 tracking-wider">
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
