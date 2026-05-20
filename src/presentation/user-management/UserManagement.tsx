"use client";

import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 1. Structural Type for User Details
interface UserData {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
}

// 2. Dummy Data matching your screen capture
const initialUsers: UserData[] = [
  {
    id: "1",
    name: "Floyd Miles",
    email: "nathan.roberts@example.com",
    registrationNumber: "HR26DF1234",
  },
  {
    id: "2",
    name: "Kathryn Murphy",
    email: "felicia.reid@example.com",
    registrationNumber: "UP16BP1111",
  },
  {
    id: "3",
    name: "Leslie Alexander",
    email: "deanna.curtis@example.com",
    registrationNumber: "HR26DF6666",
  },
  {
    id: "4",
    name: "Jane Cooper",
    email: "tanya.hill@example.com",
    registrationNumber: "DL7SCA0123",
  },
  {
    id: "5",
    name: "Dianne Russell",
    email: "debra.holt@example.com",
    registrationNumber: "AS01BW9876",
  },
  {
    id: "6",
    name: "Ralph Edwards",
    email: "debbie.baker@example.com",
    registrationNumber: "DL1C6789",
  },
];

export default function UserManagement(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Optional: Client-side search logic across fields
  const filteredUsers = initialUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const totalPages = Math.max(Math.ceil(filteredUsers.length / rowsPerPage), 1);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + rowsPerPage,
  );
  const showingStart = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(
    startIndex + paginatedUsers.length,
    filteredUsers.length,
  );

  return (
    <div className="w-full text-[#1E2B4B]">
      {/* Search Input Bar Layer */}
      <div className="relative w-full mb-10">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search By Name Or VRN..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-14 pr-5 py-4 bg-[#F1F5F9] border-0 !rounded-[16px] text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* Main Title Head */}
      <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-6">
        User Details
      </h1>

      {/* Styled shadcn Data Table Box */}
      <div className="bg-white rounded-[8px] border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#EBF5FF] border-b-0">
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Name
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Email
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Vehicle Registration Number
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-slate-50/80 border-slate-100 transition-colors"
                >
                  <TableCell className="px-6 py-5 font-bold text-slate-900 text-center">
                    {user.name}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {user.email}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-slate-600 font-mono tracking-wider text-center">
                    {user.registrationNumber}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching user details found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Block Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-sm text-slate-400 font-medium">
        <div>
          Showing {showingStart} to {showingEnd} of {filteredUsers.length}{" "}
          results
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
