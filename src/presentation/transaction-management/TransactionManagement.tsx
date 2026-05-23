"use client";

import React, { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface Transaction {
  _id: string;
  buyerName: string;
  email: string;
  vehicleNumber: string;
  totalAmount: number;
  purchaseDate: string;
  serviceType: string;
  serviceName?: string;
  journeyStatus?: string;
  paymentStatus: string;
}

interface TransactionsResponse {
  success: boolean;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: {
    transactions: Transaction[];
    paginationInfo?: {
      currentPage: number;
      totalPages: number;
      totalData: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

interface SingleTransaction {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  categoryId?: {
    _id: string;
    name: string;
    rateActual: number;
    rateDiscounted: number;
  };
  vehicleNumber: string;
  preferredDate?: string;
  categoryPrice?: number;
  lateFee?: number;
  totalPrice?: number;
  isLateFeeApplied?: boolean;
  paymentStatus: string;
  journeyStatus?: string;
  stripeSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
  serviceType: string;
  serviceName?: string;
}

interface SingleTransactionResponse {
  success: boolean;
  message: string;
  data: SingleTransaction;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatMoney(amount?: number) {
  if (typeof amount !== "number") return "N/A";

  return `£${amount}`;
}

function matchesSearch(transaction: Transaction, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    transaction.buyerName,
    transaction.email,
    transaction.vehicleNumber,
    transaction.serviceType,
    transaction.serviceName,
    transaction.paymentStatus,
    transaction.journeyStatus,
    String(transaction.totalAmount),
    formatDate(transaction.purchaseDate),
  ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
}

export default function TransactionManagement(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const rowsPerPage = 10;
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;

  const {
    data: transactionData,
    isFetching,
    isLoading,
  } = useQuery<TransactionsResponse>({
    queryKey: ["transactions", currentPage, searchQuery, accessToken],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/admin/transactions`,
      );

      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("limit", String(rowsPerPage));
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const response = (await res.json()) as TransactionsResponse;

      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to fetch transactions");
      }

      return response;
    },
  });

  const { data: singleTransactionData, isLoading: isSingleTransactionLoading } =
    useQuery<SingleTransactionResponse>({
      queryKey: ["transaction-details", selectedTransactionId, accessToken],
      enabled:
        status === "authenticated" &&
        Boolean(accessToken) &&
        Boolean(selectedTransactionId),
      queryFn: async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/admin/transactions/${selectedTransactionId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        const response = (await res.json()) as SingleTransactionResponse;

        if (!res.ok || !response.success) {
          throw new Error(response.message || "Failed to fetch transaction");
        }

        return response;
      },
    });

  const transactions = transactionData?.data?.transactions || [];
  const visibleTransactions = transactions.filter((transaction) =>
    matchesSearch(transaction, searchQuery),
  );
  const selectedTransaction = singleTransactionData?.data;
  const totalPages = Math.max(
    transactionData?.data?.paginationInfo?.totalPages ||
      transactionData?.meta?.totalPages ||
      1,
    1,
  );
  const apiTotalData =
    transactionData?.data?.paginationInfo?.totalData ||
    transactionData?.meta?.total ||
    0;
  const totalData =
    searchQuery && apiTotalData === transactions.length
      ? visibleTransactions.length
      : apiTotalData;
  const showingStart =
    totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(
    showingStart + visibleTransactions.length - 1,
    totalData,
  );
  const shouldShowSkeleton =
    isLoading || (isFetching && transactions.length === 0);
  const shouldShowPagination = totalData > rowsPerPage;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="w-full text-[#1E2B4B]">
      <div className="relative w-full mb-10">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search By Name, Email Or Vehicle Number..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-14 pr-5 py-4 bg-[#F1F5F9] border-0 !rounded-[16px] text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* Main Title Head */}
      <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-6">
        Transaction Details
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
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Service
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Date
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Status
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center h-12 px-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {shouldShowSkeleton ? (
              <TransactionTableSkeleton />
            ) : visibleTransactions.length > 0 ? (
              visibleTransactions.map((transaction) => (
                <TableRow
                  key={transaction._id}
                  className="hover:bg-slate-50/80 border-slate-100 transition-colors"
                >
                  <TableCell className="px-6 py-5 font-bold text-slate-900 text-center">
                    {transaction.buyerName}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {transaction.email}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-slate-600 font-mono tracking-wider text-center">
                    {transaction.vehicleNumber}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-slate-600 text-center">
                    {transaction.serviceName ?? transaction.serviceType}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-bold text-slate-900 text-center">
                    £{transaction.totalAmount}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-slate-600 text-center">
                    {formatDate(transaction.purchaseDate)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <span className="inline-flex min-w-16 items-center justify-center rounded bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                      {transaction.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedTransactionId(transaction._id)}
                      className="mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                      aria-label="View transaction details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching transaction found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Block Footer */}
      {shouldShowPagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-sm text-slate-400 font-medium">
          <div>
            Showing {showingStart} to {showingEnd} of {totalData} results
          </div>

          <div className="flex items-center gap-1.5 select-none">
            {/* Previous Page Button */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded border font-semibold transition ${
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
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(selectedTransactionId)}
        onOpenChange={(open) => !open && setSelectedTransactionId(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information for the selected transaction.
            </DialogDescription>
          </DialogHeader>

          {isSingleTransactionLoading ? (
            <DetailSkeleton />
          ) : selectedTransaction ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <DetailItem
                  label="Name"
                  value={selectedTransaction.userId?.name || "N/A"}
                />
                <DetailItem
                  label="Email"
                  value={selectedTransaction.userId?.email || "N/A"}
                />
                <DetailItem
                  label="Vehicle Number"
                  value={selectedTransaction.vehicleNumber}
                />
                <DetailItem
                  label="Service Type"
                  value={
                    selectedTransaction.serviceName ||
                    selectedTransaction.serviceType
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Category"
                  value={selectedTransaction.categoryId?.name || "N/A"}
                />
                <DetailItem
                  label="Preferred Date"
                  value={
                    selectedTransaction.preferredDate
                      ? formatDate(selectedTransaction.preferredDate)
                      : "N/A"
                  }
                />
                <DetailItem
                  label="Category Price"
                  value={formatMoney(selectedTransaction.categoryPrice)}
                />
                <DetailItem
                  label="Late Fee"
                  value={formatMoney(selectedTransaction.lateFee)}
                />
                <DetailItem
                  label="Late Fee Applied"
                  value={selectedTransaction.isLateFeeApplied ? "Yes" : "No"}
                />
                <DetailItem
                  label="Total Price"
                  value={formatMoney(selectedTransaction.totalPrice)}
                />
                <DetailItem
                  label="Payment Status"
                  value={selectedTransaction.paymentStatus}
                />
                <DetailItem
                  label="Journey Status"
                  value={selectedTransaction.journeyStatus || "N/A"}
                />
                <DetailItem
                  label="Created At"
                  value={
                    selectedTransaction.createdAt
                      ? formatDate(selectedTransaction.createdAt)
                      : "N/A"
                  }
                />
                <DetailItem
                  label="Updated At"
                  value={
                    selectedTransaction.updatedAt
                      ? formatDate(selectedTransaction.updatedAt)
                      : "N/A"
                  }
                />
                <DetailItem
                  label="Stripe Session ID"
                  value={selectedTransaction.stripeSessionId || "N/A"}
                  className="sm:col-span-2"
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="border-slate-100">
          {Array.from({ length: 8 }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className="px-6 py-5">
              <Skeleton
                className={`mx-auto h-4 ${
                  cellIndex === 1
                    ? "w-44"
                    : cellIndex === 2
                      ? "w-32"
                      : cellIndex === 7
                        ? "h-9 w-9 rounded-lg"
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

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg bg-slate-200" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
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
    <div className={`rounded-lg border border-slate-100 bg-white p-4 ${className}`}>
      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
        {label}
      </p>
      <p className="break-words text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
