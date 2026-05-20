"use client";

import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ১. টোকেন ডেটা স্ট্রাকচার ইন্টারফেস
interface TokenData {
  id: string;
  buyerName: string;
  email: string;
  amount: number;
  totalPrice: string;
  purchaseDate: string;
}

// ২. স্ক্রিনশট অনুযায়ী ডামি ডেটা
const initialTokens: TokenData[] = [
  {
    id: "1",
    buyerName: "Floyd Miles",
    email: "nathan.roberts@example.com",
    amount: 4,
    totalPrice: "£45",
    purchaseDate: "11-12-2026",
  },
  {
    id: "2",
    buyerName: "Kathryn Murphy",
    email: "felicia.reid@example.com",
    amount: 12,
    totalPrice: "£45",
    purchaseDate: "11-12-2026",
  },
  {
    id: "3",
    buyerName: "Leslie Alexander",
    email: "deanna.curtis@example.com",
    amount: 14,
    totalPrice: "£45",
    purchaseDate: "11-12-2026",
  },
  {
    id: "4",
    buyerName: "Jane Cooper",
    email: "tanya.hill@example.com",
    amount: 6,
    totalPrice: "£45",
    purchaseDate: "11-12-2026",
  },
  {
    id: "5",
    buyerName: "Dianne Russell",
    email: "debra.holt@example.com",
    amount: 10,
    totalPrice: "£45",
    purchaseDate: "11-12-2026",
  },
  {
    id: "6",
    buyerName: "Ralph Edwards",
    email: "debbie.baker@example.com",
    amount: 10,
    totalPrice: "£45",
    purchaseDate: "11-12-2026",
  },
];

export default function TokenManagement(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // ৩. ফিল্টারিং লজিক (Buyer Name অথবা Email দিয়ে সার্চ)
  const filteredTokens = initialTokens.filter(
    (item) =>
      item.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ৪. পেজিনেশন ক্যালকুলেশন
  const totalPages = Math.max(
    Math.ceil(filteredTokens.length / rowsPerPage),
    1,
  );
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTokens = filteredTokens.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  const showingStart = filteredTokens.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + rowsPerPage, filteredTokens.length);

  return (
    <div className="w-full">
      {/* ৫. উইনার কন্টেইনার কার্ড (হুবহু স্ক্রিনশটের ডিজাইন) */}
      <div className="bg-[#FFFFFF] border border-slate-100 rounded-[12px] flex flex-col items-center justify-center min-h-[320px] mb-10 shadow-[0px_4px_20px_0px_#0A192F0D]">
        <h2 className="text-2xl font-bold text-[#0052B4] tracking-wide mb-4">
          Winner
        </h2>
        <div className="w-full max-w-md bg-[#A0AEC0] rounded-xl py-6 px-4 flex flex-col items-center justify-center shadow-inner text-center">
          <span className="text-[10px] font-bold tracking-wider text-slate-200 uppercase mb-1">
            Name
          </span>
          <span className="text-base font-bold text-white tracking-wide">
            Not Selected Yet!
          </span>
        </div>
      </div>

      {/* ৬. উইনার সিলেকশন বাটন গ্রুপ */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-6">
        {/* ব্লু প্রাইমারি ড্রপডাউন বাটন */}
        <button className="flex items-center justify-between gap-3 bg-[#0052B4] hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-all">
          Select Winner Manually
          <ChevronDown className="w-4 h-4 opacity-80 stroke-[2.5]" />
        </button>

        {/* হোয়াইট আউটলাইন ড্রপডাউন বাটন */}
        <button className="flex items-center justify-between gap-3 bg-white border-2 border-[#0052B4] text-[#0052B4] hover:bg-blue-50/50 font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm transition-all">
          Let System Choose a Winner
          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* ৭. টেবিল টাইটেল ও সার্চ ইনপুট বার */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-6">
        <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
          Token Details
        </h3>

        {/* ডান পাশের সার্চ বার */}
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

      {/* ৮. মেইন ডেটা টেবিল (আপনার রিকোয়েস্ট অনুযায়ী সেন্টার এলাইনমেন্ট ডিজাইন) */}
      <div className="bg-white rounded-[16px] border border-slate-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-[#EBF5FF] border-b-0">
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center">
                Buyer Name
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center">
                Email
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center">
                Total Price
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center">
                Purchase Date
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {paginatedTokens.length > 0 ? (
              paginatedTokens.map((token) => (
                <TableRow
                  key={token.id}
                  className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                >
                  {/* প্রথম কলাম একটু ডার্ক এবং বাকিগুলো মিডিয়াম/লাইট গ্রে */}
                  <TableCell className="px-6 py-5 font-bold text-slate-900 text-center whitespace-nowrap">
                    {token.buyerName}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {token.email}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {token.amount}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {token.totalPrice}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center whitespace-nowrap">
                    {token.purchaseDate}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching token details found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ৯. অপ্টিমাইজড পেজিনেশন ফুটার */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 text-sm text-slate-400 font-medium">
        <div>
          Showing {showingStart} to {showingEnd} of {filteredTokens.length}{" "}
          results
        </div>

        <div className="flex items-center gap-1.5 select-none">
          {/* প্রিভিয়াস বাটন */}
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* ডাইনামিক পেজ নাম্বার */}
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNumber = i + 1;
            const isActive = currentPage === pageNumber;

            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`flex h-9 w-9 items-center justify-center rounded-md border font-semibold text-xs transition ${
                  isActive
                    ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* নেক্সট বাটন */}
          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
