"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ১. ডেটা স্ট্রাকচার ইন্টারফেস
interface JourneyData {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
  journeyDate: string;
  category: string;
  status: "Pending" | "Approved" | "Rejected";
}

// ২. স্ক্রিনশট অনুযায়ী ডামি ডেটা
const initialJourneys: JourneyData[] = [
  {
    id: "1",
    name: "Floyd Miles",
    email: "nathan.roberts@example.com",
    registrationNumber: "HR26DF1234",
    journeyDate: "11-12-2026",
    category: "Congestion Charge",
    status: "Pending",
  },
  {
    id: "2",
    name: "Kathryn Murphy",
    email: "felicia.reid@example.com",
    registrationNumber: "UP16BP1111",
    journeyDate: "11-12-2026",
    category: "ULEZ Charge",
    status: "Pending",
  },
  {
    id: "3",
    name: "Leslie Alexander",
    email: "deanna.curtis@example.com",
    registrationNumber: "HR26DF6666",
    journeyDate: "11-12-2026",
    category: "Tunnel Charge",
    status: "Pending",
  },
  {
    id: "4",
    name: "Jane Cooper",
    email: "tanya.hill@example.com",
    registrationNumber: "DL7SCA0123",
    journeyDate: "11-12-2026",
    category: "Tunnel Charge",
    status: "Pending",
  },
  {
    id: "5",
    name: "Dianne Russell",
    email: "debra.holt@example.com",
    registrationNumber: "AS01BW9876",
    journeyDate: "11-12-2026",
    category: "ULEZ Charge",
    status: "Pending",
  },
  {
    id: "6",
    name: "Ralph Edwards",
    email: "debbie.baker@example.com",
    registrationNumber: "DL1C6789",
    journeyDate: "11-12-2026",
    category: "ULEZ Charge",
    status: "Pending",
  },
];

export default function JourneyManagement(): React.JSX.Element {
  const [journeys, setJourneys] = useState<JourneyData[]>(initialJourneys);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // ৩. ফিল্টারিং লজিক (Date, VRN এবং Status এর উপর ভিত্তি করে)
  const filteredJourneys = journeys.filter((item) => {
    const matchesSearch =
      item.registrationNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.journeyDate.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" ||
      item.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // ৪. ডাইনামিক পেজিনেশন ক্যালকুলেশন
  const totalPages = Math.max(
    Math.ceil(filteredJourneys.length / rowsPerPage),
    1,
  );
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedJourneys = filteredJourneys.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  const showingStart = filteredJourneys.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(
    startIndex + paginatedJourneys.length,
    filteredJourneys.length,
  );

  const getStatusClassName = (status: JourneyData["status"]) => {
    if (status === "Approved") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "Rejected") {
      return "bg-red-50 text-red-600";
    }

    return "bg-amber-50 text-amber-700";
  };

  const updateJourneyStatus = (
    journeyId: string,
    status: JourneyData["status"],
  ) => {
    setJourneys((prevJourneys) =>
      prevJourneys.map((journey) =>
        journey.id === journeyId ? { ...journey, status } : journey,
      ),
    );
  };

  return (
    <div className="w-full space-y-6 text-[#1E2B4B]">
      {/* সার্চ ইনপুট বার */}
      <div className="relative w-full">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search By Date Or VRN..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-14 pr-5 py-4 bg-[#F1F5F9] border-0 rounded-[16px] text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {/* টেবিল সাব-হেডার এবং ফিল্টার অপশন */}
      <div className="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">
          Journey Details
        </h2>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-10 min-w-36 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* মেইন ডাটা টেবিল কন্টেইনার */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <Table className="min-w-[1180px] table-fixed">
          <TableHeader className="bg-[#EBF5FF] border-b-0">
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="h-14 w-[16%] px-6 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Name
              </TableHead>
              <TableHead className="h-14 w-[22%] px-6 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Email
              </TableHead>
              <TableHead className="h-14 w-[18%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Vehicle Registration Number
              </TableHead>
              <TableHead className="h-14 w-[12%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Journey Date
              </TableHead>
              <TableHead className="h-14 w-[14%] px-6 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Category
              </TableHead>
              <TableHead className="h-14 w-[10%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Status
              </TableHead>
              <TableHead className="h-14 w-[8%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {paginatedJourneys.length > 0 ? (
              paginatedJourneys.map((journey) => (
                <TableRow
                  key={journey.id}
                  className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                >
                  <TableCell className="px-6 py-5 text-left font-bold text-slate-900">
                    {journey.name}
                  </TableCell>
                  <TableCell className="truncate px-6 py-5 text-left font-normal text-slate-500">
                    {journey.email}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-mono font-medium tracking-wide text-slate-600">
                    {journey.registrationNumber}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-normal text-slate-500">
                    {journey.journeyDate}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-left font-normal text-slate-500">
                    {journey.category}
                  </TableCell>

                  {/* স্ট্যাটাস ব্যাজ ড্রপডাউন স্টাইল */}
                  <TableCell className="px-6 py-5 text-center">
                    <Select
                      value={journey.status}
                      onValueChange={(value) =>
                        updateJourneyStatus(
                          journey.id,
                          value as JourneyData["status"],
                        )
                      }
                    >
                      <SelectTrigger
                        className={`mx-auto h-8 min-w-28 rounded-md border-0 px-3 text-xs font-bold shadow-none focus:ring-0 focus:ring-offset-0 ${getStatusClassName(
                          journey.status,
                        )}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="center">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* অ্যাকশন বাটন গ্রুপ (চোখ এবং ডিলিট আইকন) */}
                  <TableCell className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching journey details found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* অপ্টিমাইজড পেজিনেশন ফুটার */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 text-sm text-slate-400 font-medium">
        <div>
          Showing {showingStart} to {showingEnd} of {filteredJourneys.length}{" "}
          results
        </div>

        <div className="flex items-center gap-1.5 select-none">
          {/* প্রিভিয়াস পেজ */}
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* ডাইনামিক বাটন জেনারেটর */}
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNumber = i + 1;
            const isActive = currentPage === pageNumber;

            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`flex h-10 w-10 items-center justify-center rounded border text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* নেক্সট পেজ */}
          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
