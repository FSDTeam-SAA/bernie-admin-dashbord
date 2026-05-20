"use client";

import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Trash2, Pencil, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ১. ডেটা স্ট্রাকচার ইন্টারফেস
interface CategoryData {
  id: string;
  journeyName: string;
  actualCharge: string;
  discountedCharge: string;
}

// ২. ডামি ডেটা
const initialCategories: CategoryData[] = [
  { id: "1", journeyName: "Congestion Charge", actualCharge: "£45", discountedCharge: "£10" },
  { id: "2", journeyName: "ULEZ Charge", actualCharge: "£45", discountedCharge: "£10" },
  { id: "3", journeyName: "Tunnel Charge", actualCharge: "£45", discountedCharge: "£10" },
  { id: "4", journeyName: "Tunnel Charge", actualCharge: "£45", discountedCharge: "£10" },
  { id: "5", journeyName: "ULEZ Charge", actualCharge: "£45", discountedCharge: "£10" },
  { id: "6", journeyName: "ULEZ Charge", actualCharge: "£45", discountedCharge: "£10" },
];

export default function CategoryManagement(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [lateFee, setLateFee] = useState("£9.90");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // ৩. ফিল্টারিং লজিক
  const filteredCategories = initialCategories.filter((item) =>
    item.journeyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ৪. ডাইনামিক পেজিনেশন ক্যালকুলেশন
  const totalPages = Math.max(Math.ceil(filteredCategories.length / rowsPerPage), 1);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + rowsPerPage);

  const showingStart = filteredCategories.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + rowsPerPage, filteredCategories.length);

  return (
    <div className="w-full">
      {/* ৫. আপার কন্ট্রোল সেকশন */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        {/* Set Late Fee ইনপুট বক্স */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Set Late Fee</label>
          <div className="relative flex items-center max-w-lg bg-[#E2E8F0] rounded p-1.5 pr-2">
            <input
              type="text"
              value={lateFee}
              onChange={(e) => setLateFee(e.target.value)}
              className="bg-transparent border-0 pl-3 w-full text-sm font-medium text-slate-600 placeholder-slate-400 focus:outline-none"
            />
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0052B4] text-white hover:bg-blue-700 transition shadow-sm">
              <Pencil className="w-4 h-4 fill-white text-[#0052B4] stroke-2" />
            </button>
          </div>
        </div>

        {/* Add Category প্রাইমারি বাটন */}
        <button className="flex items-center justify-center gap-2 bg-[#004EAF] hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3.5 rounded shadow-md transition-all self-start md:self-end">
          <Plus className="w-4 h-4 stroke-[3]" />
          Add Catagory
        </button>
      </div>

      {/* ৬. টেবিল হেডার এবং ছোট সার্চ ইনপুট */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 my-6">
        <h2 className="text-xl font-bold tracking-tight text-[#1D2B4F]">
          Journey Catagory Details
        </h2>
        
        {/* ডান পাশের ছোট টাইট সার্চ বার */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* ৭. ডাটা টেবিল কন্টেইনার */}
      <div className="bg-white rounded-[12px] border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#EBF5FF] border-b-0">
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="font-semibold text-slate-700 h-14 px-8 text-left w-[35%]">Journey Name</TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center w-[20%]">Actual Charge</TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center w-[25%]">Discounted Charge</TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-8 text-center w-[20%]">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {paginatedCategories.length > 0 ? (
              paginatedCategories.map((category) => (
                <TableRow
                  key={category.id}
                  className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                >
                  <TableCell className="px-8 py-5 font-normal text-slate-500 text-left whitespace-nowrap">
                    {category.journeyName}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {category.actualCharge}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {category.discountedCharge}
                  </TableCell>
                  
                  {/* ৩টি অ্যাকশন বাটন */}
                  <TableCell className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button className="text-slate-600 hover:text-blue-600 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-slate-600 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-slate-600 hover:text-green-600 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching category details found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Block Footer - Fixed Variable Here */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-sm text-slate-400 font-medium">
        <div>
          Showing {showingStart} to {showingEnd} of {filteredCategories.length} results
        </div>

        <div className="flex items-center gap-1.5 select-none">
          {/* Previous Page Button */}
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Clean, Dynamic Page Number Generator */}
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNumber = i + 1;
            const isActive = currentPage === pageNumber;

            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`flex h-10 w-10 items-center justify-center rounded border font-semibold transition ${
                  isActive
                    ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* Next Page Button */}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}