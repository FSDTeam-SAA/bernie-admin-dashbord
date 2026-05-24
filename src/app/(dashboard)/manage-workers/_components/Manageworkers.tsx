"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkerAdmin {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: "Active" | "Suspended" | string;
  createdBy: {
    _id: string;
    name?: string;
    email: string;
  } | null;
  lastActive: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkersResponse {
  success?: boolean;
  status?: boolean;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data?: {
    admins?: WorkerAdmin[];
    paginationInfo?: {
      currentPage: number;
      totalPages: number;
      totalData: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const rowsPerPage = 10;

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

const formatDate = (date?: string | null) => {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

function getStatusClassName(status: string) {
  return status === "Active"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-red-50 text-red-600";
}

function Manageworkers() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const workersQuery = useQuery<WorkersResponse>({
    queryKey: ["team-workers", currentPage, searchQuery, accessToken],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const url = new URL(`${apiBaseUrl}/team`);
      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("limit", String(rowsPerPage));
      if (searchQuery) url.searchParams.set("search", searchQuery);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const response = await readJsonResponse<WorkersResponse>(res);

      if (!res.ok || response.success === false || response.status === false) {
        throw new Error(response.message || "Failed to fetch workers");
      }

      return response;
    },
  });

  const workers = workersQuery.data?.data?.admins || [];
  const paginationInfo = workersQuery.data?.data?.paginationInfo;
  const totalData =
    paginationInfo?.totalData || workersQuery.data?.meta?.total || 0;
  const totalPages = Math.max(
    paginationInfo?.totalPages || workersQuery.data?.meta?.totalPages || 1,
    1,
  );
  const showingStart =
    totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(showingStart + workers.length - 1, totalData);
  const shouldShowSkeleton =
    workersQuery.isLoading || (workersQuery.isFetching && workers.length === 0);
  const shouldShowPagination = totalData > rowsPerPage;

  return (
    <div className="w-full text-[#1E2B4B]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xl">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-[16px] border-0 bg-[#F1F5F9] py-4 pl-14 pr-5 text-sm font-medium text-slate-700 transition-all placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <h1 className="mb-6 mt-8 text-2xl font-bold tracking-tight text-[#0F172A]">
        Worker Admins
      </h1>

      <div className="overflow-hidden rounded-[8px] border border-slate-100 bg-white">
        <Table>
          <TableHeader className="border-b-0 bg-[#EBF5FF]">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="h-12 px-6 text-left font-semibold text-slate-700">
                Admin
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Role
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Permissions
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Status
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Created
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {shouldShowSkeleton ? (
              <WorkerTableSkeleton />
            ) : workers.length > 0 ? (
              workers.map((worker) => (
                <TableRow
                  key={worker._id}
                  className="border-slate-100 transition-colors hover:bg-slate-50/80"
                >
                  <TableCell className="px-6 py-5 text-left">
                    <p className="font-bold text-slate-900">
                      {worker.name || "N/A"}
                    </p>
                    <p className="mt-1 text-sm font-normal text-slate-500">
                      {worker.email || "N/A"}
                    </p>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-medium text-slate-600">
                    {worker.role || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {worker.permissions?.length || 0}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <span
                      className={`inline-flex rounded-md px-3 py-1 text-xs font-bold uppercase ${getStatusClassName(
                        worker.status,
                      )}`}
                    >
                      {worker.status || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-medium text-slate-600">
                    {formatDate(worker.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <Link
                      href={`/manage-workers/${worker._id}`}
                      className="mx-auto inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0052cc] px-4 text-sm font-semibold text-white transition hover:bg-[#0047b3]"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Access
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center font-medium text-slate-400"
                >
                  No worker admin found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {shouldShowPagination && (
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-sm font-medium text-slate-400 sm:flex-row">
          <div>
            Showing {showingStart} to {showingEnd} of {totalData} results
          </div>

          <div className="flex select-none items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => {
              const pageNumber = i + 1;
              const isActive = currentPage === pageNumber;

              return (
                <button
                  type="button"
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded border font-semibold transition ${
                    isActive
                      ? "border-[#0F172A] bg-[#0F172A] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkerTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="border-slate-100">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className="px-6 py-5">
              <Skeleton
                className={`mx-auto h-4 ${
                  cellIndex === 0
                    ? "ml-0 h-10 w-56"
                    : cellIndex === 5
                      ? "h-9 w-24 rounded-lg"
                      : cellIndex === 3
                        ? "h-6 w-20 rounded-md"
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

export default Manageworkers;
