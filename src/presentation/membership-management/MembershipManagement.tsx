"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type MembershipStatus = "PENDING" | "ACTIVE" | "CLEARED" | "EXPIRED";

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
  endDate: string | null;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
}

interface MembershipsResponse {
  success: boolean;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: {
    memberships: Membership[];
    paginationInfo?: {
      currentPage: number;
      totalPages: number;
      totalData: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

interface SingleMembershipResponse {
  success: boolean;
  message: string;
  data: Membership;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const statusOptions: { label: string; value: MembershipStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Cleared", value: "CLEARED" },
  { label: "Expired", value: "EXPIRED" },
];

const statusFilterOptions = [
  { label: "All Status", value: "all" },
  ...statusOptions,
];

const formatDate = (date?: string | null) => {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatMoney = (amount: number) => `£${amount}`;

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

function getStatusClassName(status: MembershipStatus) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "CLEARED") return "bg-blue-50 text-blue-700";
  if (status === "EXPIRED") return "bg-red-50 text-red-600";
  return "bg-amber-50 text-amber-700";
}

function matchesSearch(membership: Membership, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    membership.userId?.name,
    membership.userId?.email,
    membership.planId?.planName,
    membership.planId?.price,
    membership.planId?.billingCycle,
    membership.status,
    formatDate(membership.startDate),
    formatDate(membership.endDate),
  ].some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(normalizedSearch),
  );
}

function matchesStatus(membership: Membership, statusFilter: string) {
  if (statusFilter === "all") return true;

  return membership.status === statusFilter;
}

export default function MembershipManagement(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMembershipId, setViewMembershipId] = useState<string | null>(null);
  const rowsPerPage = 10;

  const queryClient = useQueryClient();
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
  }, [searchQuery, statusFilter]);

  const membershipsQuery = useQuery<MembershipsResponse>({
    queryKey: [
      "memberships",
      currentPage,
      searchQuery,
      statusFilter,
      accessToken,
    ],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const url = new URL(`${apiBaseUrl}/memberships/all`);

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
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const response = await readJsonResponse<MembershipsResponse>(res);

      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to fetch memberships");
      }

      return response;
    },
  });

  const singleMembershipQuery = useQuery<SingleMembershipResponse>({
    queryKey: ["membership-details", viewMembershipId, accessToken],
    enabled:
      status === "authenticated" &&
      Boolean(accessToken) &&
      Boolean(viewMembershipId),
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/memberships/${viewMembershipId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const response = await readJsonResponse<SingleMembershipResponse>(res);

      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to fetch membership");
      }

      return response;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: MembershipStatus;
    }) => {
      const res = await fetch(`${apiBaseUrl}/memberships/${id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response.message || "Failed to update membership");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Membership status updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      await queryClient.invalidateQueries({ queryKey: ["membership-details"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const memberships = membershipsQuery.data?.data?.memberships || [];
  const visibleMemberships = memberships.filter(
    (membership) =>
      matchesSearch(membership, searchQuery) &&
      matchesStatus(membership, statusFilter),
  );
  const selectedMembership = singleMembershipQuery.data?.data;
  const apiTotalData =
    membershipsQuery.data?.data?.paginationInfo?.totalData ||
    membershipsQuery.data?.meta?.total ||
    0;
  const shouldUseLocalTotal =
    (searchQuery || statusFilter !== "all") &&
    apiTotalData === memberships.length;
  const totalData =
    shouldUseLocalTotal
      ? visibleMemberships.length
      : apiTotalData;
  const totalPages = Math.max(
    membershipsQuery.data?.data?.paginationInfo?.totalPages ||
      membershipsQuery.data?.meta?.totalPages ||
      1,
    1,
  );
  const showingStart =
    totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(
    showingStart + visibleMemberships.length - 1,
    totalData,
  );
  const shouldShowSkeleton =
    membershipsQuery.isLoading ||
    (membershipsQuery.isFetching && memberships.length === 0);
  const shouldShowPagination = totalData > rowsPerPage;

  const updateMembershipStatus = (
    membership: Membership,
    nextStatus: MembershipStatus,
  ) => {
    if (membership.status === nextStatus) return;

    updateStatusMutation.mutate({
      id: membership._id,
      nextStatus,
    });
  };

  return (
    <div className="w-full text-[#1E2B4B]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search By Name, Email Or Plan..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-[16px] border-0 bg-[#F1F5F9] py-4 pl-14 pr-5 text-sm font-medium text-slate-700 transition-all placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="!h-12 w-full cursor-pointer rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-none focus:ring-2 focus:ring-blue-500/20 sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {statusFilterOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="cursor-pointer"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <h1 className="mb-6 mt-8 text-2xl font-bold tracking-tight text-[#0F172A]">
        Member Details
      </h1>

      <div className="overflow-hidden rounded-[8px] border border-slate-100 bg-white">
        <Table>
          <TableHeader className="border-b-0 bg-[#EBF5FF]">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Name
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Email
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Membership Type
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Date
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Status
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {shouldShowSkeleton ? (
              <MembershipTableSkeleton />
            ) : visibleMemberships.length > 0 ? (
              visibleMemberships.map((membership) => (
                <TableRow
                  key={membership._id}
                  className="border-slate-100 transition-colors hover:bg-slate-50/80"
                >
                  <TableCell className="px-6 py-5 text-center font-bold text-slate-900">
                    {membership.userId?.name || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-normal text-slate-500">
                    {membership.userId?.email || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-medium text-slate-600">
                    {membership.planId?.planName || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-medium text-slate-600">
                    {formatDate(membership.startDate)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <Select
                      value={membership.status}
                      disabled={updateStatusMutation.isPending}
                      onValueChange={(value) =>
                        updateMembershipStatus(
                          membership,
                          value as MembershipStatus,
                        )
                      }
                    >
                      <SelectTrigger
                        className={`mx-auto h-8 min-w-28 cursor-pointer rounded-md border-0 px-3 text-xs font-bold uppercase shadow-none focus:ring-0 focus:ring-offset-0 disabled:cursor-not-allowed ${getStatusClassName(
                          membership.status,
                        )}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="center">
                        {statusOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="cursor-pointer"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <button
                      type="button"
                      onClick={() => setViewMembershipId(membership._id)}
                      className="mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                      aria-label="View membership details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center font-medium text-slate-400"
                >
                  No matching membership found.
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

      <Dialog
        open={Boolean(viewMembershipId)}
        onOpenChange={(open) => !open && setViewMembershipId(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Membership Details</DialogTitle>
            <DialogDescription>
              Complete information for the selected membership.
            </DialogDescription>
          </DialogHeader>

          {singleMembershipQuery.isLoading ? (
            <DetailSkeleton />
          ) : selectedMembership ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Name"
                value={selectedMembership.userId?.name || "N/A"}
              />
              <DetailItem
                label="Email"
                value={selectedMembership.userId?.email || "N/A"}
              />
              <DetailItem
                label="Plan"
                value={selectedMembership.planId?.planName || "N/A"}
              />
              <DetailItem
                label="Plan Price"
                value={formatMoney(selectedMembership.planId?.price || 0)}
              />
              <DetailItem
                label="Billing Cycle"
                value={selectedMembership.planId?.billingCycle || "N/A"}
              />
              <DetailItem label="Status" value={selectedMembership.status} />
              <DetailItem
                label="Start Date"
                value={formatDate(selectedMembership.startDate)}
              />
              <DetailItem
                label="End Date"
                value={formatDate(selectedMembership.endDate)}
              />
              <DetailItem
                label="Created At"
                value={formatDate(selectedMembership.createdAt)}
              />
              <DetailItem
                label="Updated At"
                value={formatDate(selectedMembership.updatedAt)}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MembershipTableSkeleton() {
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
                      ? "h-8 w-28 rounded-md"
                      : cellIndex === 5
                        ? "h-9 w-9 rounded-lg"
                        : "w-28"
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
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="h-20 rounded-lg" />
      ))}
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
    <div
      className={`rounded-lg border border-slate-100 bg-white p-4 ${className}`}
    >
      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
        {label}
      </p>
      <p className="break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
