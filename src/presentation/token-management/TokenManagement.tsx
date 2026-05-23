"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface Token {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  vehicleNumber: string;
  quantity: number;
  totalPrice: number;
  paymentStatus: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Winner {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string | null;
    profileImage?: string;
  };
  tokenId: {
    _id: string;
    vehicleNumber: string;
    quantity: number;
    totalPrice: number;
    createdAt: string;
  };
  prizeId?: {
    _id: string;
    prizeTag: string;
  } | null;
  vehicleNumber: string;
  selectionType: "AUTO" | "MANUAL";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface TokensApiResponse {
  data?: {
    tokens?: Token[];
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

interface WinnerApiResponse {
  data?: Winner | null;
  message?: string;
}

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const formatMoney = (amount?: number) =>
  typeof amount === "number" ? `£${amount}` : "N/A";

export default function TokenManagement(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const { data: session, status } = useSession();
  const TOKEN = session?.user?.accessToken;
  const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    }),
    [TOKEN],
  );

  const tokenQuery = useQuery<TokensApiResponse>({
    queryKey: ["tokens", searchQuery, currentPage],
    enabled: status === "authenticated" && Boolean(TOKEN),
    queryFn: async () => {
      const url = new URL(`${apiBaseUrl}/tokens/all`);
      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("limit", String(rowsPerPage));

      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }

      const res = await fetch(url.toString(), {
        headers: authHeaders,
      });
      const response = await readJsonResponse<TokensApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to fetch tokens");
      }

      return response;
    },
  });

  const winnerQuery = useQuery<WinnerApiResponse>({
    queryKey: ["current-winner"],
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/tokens/winner/current`);
      const response = await readJsonResponse<WinnerApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to fetch winner");
      }

      return response;
    },
  });

  const tokens = tokenQuery.data?.data?.tokens || [];
  const winner = winnerQuery.data?.data || null;
  const totalPages =
    tokenQuery.data?.data?.paginationInfo?.totalPages ||
    tokenQuery.data?.meta?.totalPages ||
    1;
  const totalData =
    tokenQuery.data?.data?.paginationInfo?.totalData ||
    tokenQuery.data?.meta?.total ||
    0;
  const showingStart = totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(showingStart + tokens.length - 1, totalData);
  const shouldShowPagination = totalData > rowsPerPage;

  const manualWinnerMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await fetch(`${apiBaseUrl}/tokens/winner/manual`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ tokenId }),
      });
      const response = await readJsonResponse<WinnerApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to select winner");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Winner selected manually");
      await winnerQuery.refetch();
      setSelectedTokenId("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to select winner",
      );
    },
  });

  const randomWinnerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${apiBaseUrl}/tokens/winner/auto`, {
        method: "POST",
        headers: authHeaders,
      });
      const response = await readJsonResponse<WinnerApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to select winner");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Winner selected automatically");
      await winnerQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to select winner",
      );
    },
  });

  return (
    <div className="w-full">
      <div className="relative mb-10 flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-[16px] border border-blue-100 bg-white px-5 py-10 shadow-[0px_8px_28px_0px_#0A192F14]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#0052B4]" />
        <h2 className="mb-6 text-3xl font-extrabold tracking-wide text-[#0052B4]">
          Winner
        </h2>
        <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl bg-[#1D2B4F] px-6 py-8 text-center shadow-[0px_16px_36px_0px_#0F172A26]">
          <span className="mb-2 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-100">
            Name
          </span>
          <span className="text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
            {winnerQuery.isLoading ? (
              <Skeleton className="mx-auto h-9 w-56 bg-white/20" />
            ) : (
              winner?.userId?.name || "Not Selected Yet!"
            )}
          </span>

          {winnerQuery.isLoading ? (
            <WinnerDetailSkeleton />
          ) : winner ? (
            <div className="mt-7 grid w-full grid-cols-1 gap-3 text-left text-sm text-white/90 sm:grid-cols-2">
              <WinnerInfo label="Email" value={winner.userId?.email || "N/A"} />
              <WinnerInfo label="Vehicle" value={winner.vehicleNumber || "N/A"} />
              <WinnerInfo
                label="Token Qty"
                value={String(winner.tokenId?.quantity || "N/A")}
              />
              <WinnerInfo label="Type" value={winner.selectionType} />
              <WinnerInfo
                label="Prize"
                value={winner.prizeId?.prizeTag || "N/A"}
                className="col-span-2"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 py-6">
        <div className="flex min-h-12 w-full max-w-md items-center gap-3 rounded-xl bg-[#0052B4] px-4 py-2.5 shadow-[0px_8px_20px_0px_#0052B433] sm:w-auto sm:min-w-[390px]">
          <Select value={selectedTokenId} onValueChange={setSelectedTokenId}>
            <SelectTrigger className="h-10 flex-1 border-0 bg-transparent px-0 text-sm font-bold text-white shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:text-white cursor-pointer">
              <SelectValue placeholder="Select Winner Manually" />
            </SelectTrigger>
            <SelectContent>
              {tokens.length > 0 ? (
                tokens.map((token) => (
                  <SelectItem key={token._id} value={token._id}>
                    {token.userId?.name || "N/A"} - {token.vehicleNumber} - x
                    {token.quantity}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-token" disabled>
                  No tokens found
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <button
            type="button"
            disabled={
              !selectedTokenId ||
              selectedTokenId === "no-token" ||
              manualWinnerMutation.isPending
            }
            onClick={() => manualWinnerMutation.mutate(selectedTokenId)}
            className="h-9 rounded-lg bg-white px-4 text-xs font-extrabold text-[#0052B4] transition hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          >
            Select
          </button>
        </div>

        <button
          type="button"
          disabled={randomWinnerMutation.isPending}
          onClick={() => randomWinnerMutation.mutate()}
          className="flex min-h-12 items-center justify-between gap-3 cursor-pointer rounded-xl border-2 border-[#0052B4] bg-white px-6 py-3 text-sm font-extrabold text-[#0052B4] shadow-sm transition-all hover:bg-blue-50/70 disabled:pointer-events-none disabled:opacity-60"
        >
          {randomWinnerMutation.isPending
            ? "Choosing..."
            : "Let System Choose a Winner"}
          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-6">
        <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
          Token Details
        </h3>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

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
                Vehicle Number
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center">
                Purchase Date
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {tokenQuery.isLoading ? (
              <TokenTableSkeleton />
            ) : tokens.length > 0 ? (
              tokens.map((token) => (
                <TableRow
                  key={token._id}
                  className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                >
                  <TableCell className="px-6 py-5 font-bold text-slate-900 text-center whitespace-nowrap">
                    {token.userId?.name || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {token.userId?.email || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {token.quantity}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {formatMoney(token.totalPrice)}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center whitespace-nowrap">
                    {token.vehicleNumber}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center whitespace-nowrap">
                    {formatDate(token.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching token details found.
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
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => {
              const pageNumber = i + 1;
              const isActive = currentPage === pageNumber;

              return (
                <button
                  type="button"
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

            <button
              type="button"
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
      ) : null}
    </div>
  );
}

function WinnerDetailSkeleton() {
  return (
    <div className="mt-7 grid w-full grid-cols-1 gap-3 text-left text-sm sm:grid-cols-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-[70px] rounded-xl bg-white/20 ${
            index === 4 ? "sm:col-span-2" : ""
          }`}
        />
      ))}
    </div>
  );
}

function TokenTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="border-slate-100">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className="px-6 py-5">
              <Skeleton
                className={`mx-auto h-4 ${
                  cellIndex === 1
                    ? "w-44"
                    : cellIndex === 4
                      ? "w-32"
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

function WinnerInfo({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/10 px-4 py-3 ${className}`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-100/80">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-bold text-white">{value}</p>
    </div>
  );
}
