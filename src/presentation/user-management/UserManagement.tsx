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
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isVerified?: boolean;
}

interface UsersApiResponse {
  data?: {
    users?: User[];
    paginationInfo?: {
      currentPage: number;
      totalPages: number;
      totalData: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  message?: string;
}

export default function UserManagement(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  const { data, isLoading } = useQuery<UsersApiResponse>({
    queryKey: ["users", searchQuery, currentPage],
    enabled: Boolean(TOKEN),
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/all-users?search=${encodeURIComponent(
          searchQuery,
        )}&page=${currentPage}&limit=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      return res.json();
    },
  });

  const users: User[] = data?.data?.users || [];
  const paginationInfo = data?.data?.paginationInfo;
  const totalPages = paginationInfo?.totalPages || 1;
  const totalData = paginationInfo?.totalData || users.length;
  const showingStart = totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(currentPage * rowsPerPage, totalData);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

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
        User Details
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
                Phone
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Role
              </TableHead>
              {/* <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Verified
              </TableHead> */}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <UserTableSkeleton />
            ) : users.length > 0 ? (
              users.map((user) => (
                <TableRow
                  key={user._id}
                  className="hover:bg-slate-50/80 border-slate-100 transition-colors"
                >
                  <TableCell className="px-6 py-5 font-bold text-slate-900 text-center">
                    {user.name}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {user.email}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {user.phone || "-"}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-slate-600 text-center">
                    {user.role}
                  </TableCell>
                  {/* <TableCell className="px-6 py-5 font-medium text-slate-600 text-center">
                    {user.isVerified ? "Yes" : "No"}
                  </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-sm text-slate-400 font-medium">
        <div>
          Showing {showingStart} to {showingEnd} of {totalData} results
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

function UserTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="border-slate-100">
          {Array.from({ length: 5 }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className="px-6 py-5">
              <Skeleton
                className={`mx-auto h-4 ${
                  cellIndex === 1
                    ? "w-44"
                    : cellIndex === 2
                      ? "w-36"
                      : "w-24"
                }`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
