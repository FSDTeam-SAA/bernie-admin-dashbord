"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

type JourneyStatus = "PENDING" | "CLEARED";

interface Journey {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  categoryId: {
    _id: string;
    name: string;
    rateActual: number;
    rateDiscounted: number;
    icon: string;
  };
  vehicleNumber: string;
  preferredDate: string;
  categoryPrice: number;
  lateFee: number;
  totalPrice: number;
  isLateFeeApplied: boolean;
  paymentStatus: string;
  journeyStatus: JourneyStatus;
  stripeSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface JourneyApiResponse {
  data?: {
    journeys?: Journey[];
    paginationInfo?: {
      currentPage: number;
      totalPages: number;
      totalData: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

const statusOptions: { label: string; value: JourneyStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Cleared", value: "CLEARED" },
];

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(date));
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

export default function JourneyManagement(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Journey | null>(null);
  const [updatingJourneyId, setUpdatingJourneyId] = useState<string | null>(
    null,
  );
  const [deletingJourneyId, setDeletingJourneyId] = useState<string | null>(
    null,
  );

  const rowsPerPage = 10;
  const { data: session, status } = useSession();
  const TOKEN = session?.user?.accessToken;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, refetch, isFetching, isLoading } = useQuery<JourneyApiResponse>(
    {
      queryKey: ["journeys", searchQuery, statusFilter, currentPage, TOKEN],
      enabled: status === "authenticated" && Boolean(TOKEN),
      queryFn: async () => {
        const url = new URL(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/journeys/all`,
        );

        url.searchParams.set("page", String(currentPage));
        url.searchParams.set("limit", String(rowsPerPage));
        if (searchQuery) {
          url.searchParams.set("search", searchQuery);
        }
        if (statusFilter !== "all") {
          url.searchParams.set("status", statusFilter);
        }

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        const response = await readJsonResponse<JourneyApiResponse>(res);
        if (!res.ok) {
          throw new Error(response?.message || "Failed to fetch journeys");
        }

        return response;
      },
    },
  );

  const journeys = data?.data?.journeys || [];
  const totalPages =
    data?.data?.paginationInfo?.totalPages || data?.meta?.totalPages || 1;
  const totalData =
    data?.data?.paginationInfo?.totalData || data?.meta?.total || 0;
  const showingStart = totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(showingStart + journeys.length - 1, totalData);
  const shouldShowPagination = totalData > rowsPerPage;
  const shouldShowSkeleton = isLoading || (isFetching && journeys.length === 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(1);
  };

  const getStatusClassName = (journeyStatus: JourneyStatus) => {
    if (journeyStatus === "CLEARED") return "bg-emerald-50 text-emerald-700";
    return "bg-amber-50 text-amber-700";
  };

  const updateJourneyStatus = async (
    journeyId: string,
    journeyStatus: JourneyStatus,
  ) => {
    setUpdatingJourneyId(journeyId);

    try {
      const requestOptions = {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: journeyStatus }),
      };

      let res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/journeys/${journeyId}/status`,
        {
          method: "PUT",
          ...requestOptions,
        },
      );

      let response = await readJsonResponse<{ message?: string }>(res);
      if (!res.ok && res.status === 405) {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/journeys/${journeyId}/status`,
          {
            method: "PATCH",
            ...requestOptions,
          },
        );
        response = await readJsonResponse<{ message?: string }>(res);
      }

      if (!res.ok) {
        throw new Error(response?.message || "Failed to update journey status");
      }

      toast.success("Journey status updated successfully");
      await refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update journey status",
      );
    } finally {
      setUpdatingJourneyId(null);
    }
  };

  const deleteJourney = async () => {
    if (!deleteTarget) return;

    setDeletingJourneyId(deleteTarget._id);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/journeys/${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      const response = await readJsonResponse<{ message?: string }>(res);
      if (!res.ok) {
        throw new Error(response?.message || "Failed to delete journey");
      }

      toast.success("Journey deleted successfully");
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete journey",
      );
    } finally {
      setDeletingJourneyId(null);
    }
  };

  return (
    <div className="w-full space-y-6 text-[#1E2B4B]">
      <div className="relative w-full">
        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by date, VRN, name, or email..."
          value={searchInput}
          onChange={handleSearchChange}
          className="w-full rounded-[16px] border-0 bg-[#F1F5F9] py-4 pl-14 pr-5 text-sm font-medium text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      <div className="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">
            Journey Details
          </h2>
          {isFetching && !isLoading ? (
            <p className="mt-1 text-xs font-medium text-slate-400">
              Refreshing journey data...
            </p>
          ) : null}
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-10 min-w-36 cursor-pointer rounded-xl border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <Table className="min-w-[1180px] table-fixed">
          <TableHeader className="bg-[#EBF5FF] border-b-0">
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="h-14 w-[15%] px-6 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Name
              </TableHead>
              <TableHead className="h-14 w-[21%] px-6 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Email
              </TableHead>
              <TableHead className="h-14 w-[17%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Vehicle Registration Number
              </TableHead>
              <TableHead className="h-14 w-[12%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Journey Date
              </TableHead>
              <TableHead className="h-14 w-[13%] px-6 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Category
              </TableHead>
              <TableHead className="h-14 w-[10%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Status
              </TableHead>
              <TableHead className="h-14 w-[12%] px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {shouldShowSkeleton ? (
              <JourneyTableSkeleton />
            ) : journeys.length > 0 ? (
              journeys.map((journey) => (
                <TableRow
                  key={journey._id}
                  className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                >
                  <TableCell className="px-6 py-5 text-left font-bold text-slate-900">
                    {journey.userId?.name || "N/A"}
                  </TableCell>
                  <TableCell className="truncate px-6 py-5 text-left font-normal text-slate-500">
                    {journey.userId?.email || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-mono font-medium tracking-wide text-slate-600">
                    {journey.vehicleNumber}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-normal text-slate-500">
                    {formatDate(journey.preferredDate)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-left font-normal text-slate-500">
                    {journey.categoryId?.name || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <Select
                      value={journey.journeyStatus}
                      disabled={updatingJourneyId === journey._id}
                      onValueChange={(value) =>
                        updateJourneyStatus(journey._id, value as JourneyStatus)
                      }
                    >
                      <SelectTrigger
                        className={`mx-auto h-8 min-w-28 cursor-pointer rounded-md border-0 px-3 text-xs font-bold shadow-none focus:ring-0 focus:ring-offset-0 ${getStatusClassName(journey.journeyStatus)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="center">
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedJourney(journey)}
                        className="flex h-9 w-9 items-center cursor-pointer justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                        aria-label="View journey details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(journey)}
                        className="flex h-9 w-9 items-center justify-center cursor-pointer rounded-lg text-slate-600 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete journey"
                      >
                        <Trash2 className="h-4 w-4" />
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

      {shouldShowPagination ? (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 text-sm text-slate-400 font-medium">
        <div>
          Showing {showingStart} to {showingEnd} of {totalData} results
        </div>

        <div className="flex items-center gap-1.5 select-none">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
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
                className={`flex h-10 w-10 items-center justify-center cursor-pointer rounded border text-sm font-semibold transition ${
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
            type="button"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      ) : null}

      <Dialog
        open={Boolean(selectedJourney)}
        onOpenChange={(open) => !open && setSelectedJourney(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Journey Details</DialogTitle>
            <DialogDescription>
              Complete information for the selected journey.
            </DialogDescription>
          </DialogHeader>

          {selectedJourney ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Name
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedJourney.userId?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Email
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedJourney.userId?.email || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Journey Date
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDate(selectedJourney.preferredDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Vehicle Number" value={selectedJourney.vehicleNumber} />
                <DetailItem label="Category" value={selectedJourney.categoryId?.name || "N/A"} />
                <DetailItem label="Payment Status" value={selectedJourney.paymentStatus} />
                <DetailItem label="Journey Status" value={selectedJourney.journeyStatus} />
                <DetailItem
                  label="Category Price"
                  value={formatCurrency(selectedJourney.categoryPrice)}
                />
                <DetailItem
                  label="Late Fee"
                  value={formatCurrency(selectedJourney.lateFee)}
                />
                <DetailItem
                  label="Late Fee Applied"
                  value={selectedJourney.isLateFeeApplied ? "Yes" : "No"}
                />
                <DetailItem
                  label="Total Price"
                  value={formatCurrency(selectedJourney.totalPrice)}
                />
                <DetailItem
                  label="Stripe Session ID"
                  value={selectedJourney.stripeSessionId || "N/A"}
                  className="sm:col-span-2"
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this journey? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {deleteTarget.userId?.name || "N/A"} - {deleteTarget.vehicleNumber}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingJourneyId === deleteTarget?._id}
              onClick={deleteJourney}
            >
              {deletingJourneyId === deleteTarget?._id
                ? "Deleting..."
                : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JourneyTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, rowIndex) => (
        <TableRow key={rowIndex} className="border-slate-100">
          {Array.from({ length: 7 }, (_, cellIndex) => (
            <TableCell key={cellIndex} className="px-6 py-5">
              <div
                className={`h-4 animate-pulse rounded bg-slate-100 ${
                  cellIndex === 1
                    ? "w-11/12"
                    : cellIndex === 6
                      ? "mx-auto w-16"
                      : "w-3/4"
                }`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function DetailItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-100 p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}
