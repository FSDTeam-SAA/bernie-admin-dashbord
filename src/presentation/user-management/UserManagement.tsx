"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
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

// Type for Membership data
interface Membership {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  planId: {
    _id: string;
    planName: string;
    price: number;
    billingCycle: string;
  };
  startDate: string;
  endDate: string;
  status: string;
}

export default function MembershipTable(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  // Fetch memberships from API with server-side search
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["memberships", searchQuery],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/memberships/all?search=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch memberships");
      return res.json();
    },
  });

  // Extract memberships array safely
  const memberships: Membership[] = data?.data?.memberships || [];

  // Pagination
  const totalPages = Math.max(Math.ceil(memberships.length / rowsPerPage), 1);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedMemberships = memberships.slice(
    startIndex,
    startIndex + rowsPerPage,
  );
  const showingStart = memberships.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(
    startIndex + paginatedMemberships.length,
    memberships.length,
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Refetch data whenever searchQuery changes
  useEffect(() => {
    refetch();
  }, [searchQuery]);

  return (
    <div className="w-full text-[#1E2B4B]">
      {/* Search Input */}
      <div className="relative w-full mb-10">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search By Name Or Email..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-14 pr-5 py-4 bg-[#F1F5F9] border-0 !rounded-[16px] text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-6">
        Membership Details
      </h1>

      {/* Table */}
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
                Plan
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  Loading memberships...
                </TableCell>
              </TableRow>
            ) : paginatedMemberships.length > 0 ? (
              paginatedMemberships.map((m) => (
                <TableRow
                  key={m._id}
                  className="hover:bg-slate-50/80 border-slate-100 transition-colors"
                >
                  <TableCell className="px-6 py-5 font-bold text-slate-900 text-center">
                    {m.userId.name}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {m.userId.email}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-slate-600 text-center">
                    {m.planId.planName} (${m.planId.price} /{" "}
                    {m.planId.billingCycle})
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-slate-600 text-center">
                    {m.status}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching membership found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-sm text-slate-400 font-medium">
        <div>
          Showing {showingStart} to {showingEnd} of {memberships.length} results
        </div>

        <div className="flex items-center gap-1.5 select-none">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="flex h-10 w-10 items-center justify-center cursor-pointer rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => {
            const pageNumber = i + 1;
            const isActive = currentPage === pageNumber;
            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`flex h-10 w-10 items-center justify-center rounded border font-semibold cursor-pointer transition ${
                  isActive
                    ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="flex h-10 w-10 items-center justify-center cursor-pointer rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
