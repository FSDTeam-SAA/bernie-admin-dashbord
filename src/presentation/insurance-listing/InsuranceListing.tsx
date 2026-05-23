"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InsuranceItem {
  _id: string;
  name: string;
  shortDetails: string;
  rate: number;
  savingUpTo: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface InsurancesResponse {
  statusCode?: number;
  success?: boolean;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data?: {
    insurances?: InsuranceItem[];
    paginationInfo?: PaginationInfo;
  };
  responseTime?: string;
}

interface SingleInsuranceResponse {
  statusCode?: number;
  success?: boolean;
  message?: string;
  data?: InsuranceItem;
  responseTime?: string;
}

interface InsurancePayload {
  name: string;
  shortDetails: string;
  rate: number;
  savingUpTo: number;
}

interface InsuranceFormState {
  name: string;
  shortDetails: string;
  rate: string;
  savingUpTo: string;
}

const emptyForm: InsuranceFormState = {
  name: "",
  shortDetails: "",
  rate: "",
  savingUpTo: "",
};

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const rowsPerPage = 10;

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

const getInsurancePayload = (form: InsuranceFormState): InsurancePayload => ({
  name: form.name.trim(),
  shortDetails: form.shortDetails.trim(),
  rate: Number(form.rate),
  savingUpTo: Number(form.savingUpTo),
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);

export default function InsuranceListing(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] =
    useState<InsuranceItem | null>(null);
  const [viewInsuranceId, setViewInsuranceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InsuranceItem | null>(null);
  const [form, setForm] = useState<InsuranceFormState>(emptyForm);

  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
    [accessToken],
  );

  const insurancesQuery = useQuery<InsurancesResponse>({
    queryKey: ["insurances", currentPage, searchQuery],
    queryFn: async () => {
      const url = new URL(`${apiBaseUrl}/insurances`);
      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("limit", String(rowsPerPage));

      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }

      const res = await fetch(url.toString());
      const response = await readJsonResponse<InsurancesResponse>(res);

      if (!res.ok || response.success === false) {
        throw new Error(response.message || "Failed to fetch insurances");
      }

      return response;
    },
  });

  const singleInsuranceQuery = useQuery<SingleInsuranceResponse>({
    queryKey: ["insurance-details", viewInsuranceId],
    enabled: Boolean(viewInsuranceId),
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/insurances/${viewInsuranceId}`);
      const response = await readJsonResponse<SingleInsuranceResponse>(res);

      if (!res.ok || response.success === false) {
        throw new Error(response.message || "Failed to fetch insurance");
      }

      return response;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: InsurancePayload) => {
      const res = await fetch(`${apiBaseUrl}/insurances`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response.message || "Failed to create insurance");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Insurance created successfully");
      closeFormDialog();
      await queryClient.invalidateQueries({ queryKey: ["insurances"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<InsurancePayload> & { isActive?: boolean };
    }) => {
      const res = await fetch(`${apiBaseUrl}/insurances/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response.message || "Failed to update insurance");
      }

      return response;
    },
    onSuccess: async (_, variables) => {
      toast.success(
        typeof variables.payload.isActive === "boolean"
          ? "Insurance status updated successfully"
          : "Insurance updated successfully",
      );
      closeFormDialog();
      await queryClient.invalidateQueries({ queryKey: ["insurances"] });
      await queryClient.invalidateQueries({ queryKey: ["insurance-details"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBaseUrl}/insurances/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response.message || "Failed to delete insurance");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Insurance deleted successfully");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["insurances"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const insurances = insurancesQuery.data?.data?.insurances || [];
  const paginationInfo = insurancesQuery.data?.data?.paginationInfo;
  const totalData =
    paginationInfo?.totalData || insurancesQuery.data?.meta?.total || 0;
  const totalPages = Math.max(
    paginationInfo?.totalPages || insurancesQuery.data?.meta?.totalPages || 1,
    1,
  );
  const showingStart =
    totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(showingStart + insurances.length - 1, totalData);
  const shouldShowPagination = totalData > rowsPerPage;
  const selectedInsurance = singleInsuranceQuery.data?.data;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openAddDialog = () => {
    setEditingInsurance(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditDialog = (insurance: InsuranceItem) => {
    setEditingInsurance(insurance);
    setForm({
      name: insurance.name,
      shortDetails: insurance.shortDetails,
      rate: String(insurance.rate),
      savingUpTo: String(insurance.savingUpTo),
    });
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    setFormOpen(false);
    setEditingInsurance(null);
    setForm(emptyForm);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = getInsurancePayload(form);
    if (
      !payload.name ||
      !payload.shortDetails ||
      Number.isNaN(payload.rate) ||
      Number.isNaN(payload.savingUpTo)
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (payload.rate < 0 || payload.savingUpTo < 0) {
      toast.error("Rate and saving must be positive numbers");
      return;
    }

    if (editingInsurance) {
      updateMutation.mutate({ id: editingInsurance._id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const updateStatus = (insurance: InsuranceItem) => {
    updateMutation.mutate({
      id: insurance._id,
      payload: { isActive: !insurance.isActive },
    });
  };

  return (
    <div className="w-full font-sans antialiased text-[#1e293b]">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by insurance name..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full rounded-[16px] border-0 bg-[#F1F5F9] py-4 pl-14 pr-5 text-sm font-medium text-slate-700 transition-all placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="button"
            onClick={openAddDialog}
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0052B4] px-5 text-sm font-bold text-white transition hover:bg-[#00418F]"
          >
            <Plus className="h-4 w-4" />
            Add Insurance
          </button>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-[#1a253c]">
          Insurance Details
        </h2>

        {insurancesQuery.isLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-20 text-[#0052cc]">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : insurancesQuery.isError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 py-12 text-center font-medium text-red-500">
            {insurancesQuery.error instanceof Error
              ? insurancesQuery.error.message
              : "Something went wrong while fetching insurances."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {insurances.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed border-slate-200 bg-white py-12 text-center font-medium text-slate-400">
                No insurance data found.
              </div>
            ) : (
              insurances.map((item) => (
                <div
                  key={item._id}
                  className="relative flex flex-col justify-between rounded-[8px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f0fa] text-[#0052cc]">
                          <Car className="h-5 w-5 fill-current stroke-[1.5]" />
                        </div>
                        <button
                          type="button"
                          disabled={updateMutation.isPending}
                          onClick={() => updateStatus(item)}
                          className={`cursor-pointer rounded-md px-3 py-1 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            item.isActive
                              ? "bg-[#E6F7ED] text-[#22C55E]"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </button>
                      </div>

                      <span className="rounded-md bg-[#e6f0fa] px-3 py-1 text-xs font-bold tracking-wide text-[#0052cc]">
                        Save {item.savingUpTo}%
                      </span>
                    </div>

                    <h3 className="mb-3 text-2xl font-bold tracking-wide text-[#1a253c]">
                      {item.name}
                    </h3>

                    <p className="mb-5 max-w-md text-xs font-normal leading-relaxed text-slate-400">
                      {item.shortDetails}
                    </p>

                    <div className="mb-6 space-y-2">
                      <div className="flex items-center gap-2.5 text-xs font-normal text-slate-400">
                        <CheckCircle2 className="h-4 w-4 text-[#0052cc] stroke-[2]" />
                        <span>No-claims bonus protection</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-normal text-slate-400">
                        <CheckCircle2 className="h-4 w-4 text-[#0052cc] stroke-[2]" />
                        <span>24/7 Central London recovery</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Member Rate
                      </span>
                      <span className="text-sm font-extrabold text-[#0052cc]">
                        {formatCurrency(item.rate)}/mo
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setViewInsuranceId(item._id)}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#f1f5f9] py-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditDialog(item)}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0052cc] py-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#f1f3f5] py-3 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-200 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!insurancesQuery.isLoading && !insurancesQuery.isError && shouldShowPagination ? (
          <div className="flex flex-col items-center justify-between gap-4 pt-4 text-sm font-medium text-slate-400 sm:flex-row">
            <div>
              Showing {showingStart}-{showingEnd} of {totalData} results
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1 || insurancesQuery.isFetching}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#0f172a] px-3 font-semibold text-white shadow-sm">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  currentPage >= totalPages || insurancesQuery.isFetching
                }
                onClick={() =>
                  setCurrentPage((page) => Math.min(page + 1, totalPages))
                }
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <InsuranceFormDialog
        open={formOpen}
        title={editingInsurance ? "Edit Insurance" : "Add Insurance"}
        description={
          editingInsurance
            ? "Update this insurance package."
            : "Create a new insurance package."
        }
        form={form}
        isSubmitting={isSaving}
        submitLabel={editingInsurance ? "Update" : "Add"}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        onOpenChange={(open) => {
          if (!open) {
            closeFormDialog();
          }
        }}
      />

      <Dialog
        open={Boolean(viewInsuranceId)}
        onOpenChange={(open) => !open && setViewInsuranceId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insurance Details</DialogTitle>
            <DialogDescription>
              Single insurance API response details.
            </DialogDescription>
          </DialogHeader>

          {singleInsuranceQuery.isLoading ? (
            <div className="flex items-center justify-center py-10 text-[#0052cc]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedInsurance ? (
            <div className="space-y-3 text-sm text-slate-600">
              <DetailRow label="Name" value={selectedInsurance.name} />
              <DetailRow
                label="Short Details"
                value={selectedInsurance.shortDetails}
              />
              <DetailRow
                label="Rate"
                value={`${formatCurrency(selectedInsurance.rate)}/mo`}
              />
              <DetailRow
                label="Saving Up To"
                value={`${selectedInsurance.savingUpTo}%`}
              />
              <DetailRow
                label="Status"
                value={selectedInsurance.isActive ? "Active" : "Inactive"}
              />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-red-500">
              Failed to load insurance details.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewInsuranceId(null)}
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Insurance</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this insurance package?
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              {deleteTarget.name}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget._id)
              }
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InsuranceFormDialog({
  open,
  title,
  description,
  form,
  isSubmitting,
  submitLabel,
  onFormChange,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  form: InsuranceFormState;
  isSubmitting: boolean;
  submitLabel: string;
  onFormChange: React.Dispatch<React.SetStateAction<InsuranceFormState>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Insurance Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="City-Premium Plan"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Short Details
            </label>
            <textarea
              value={form.shortDetails}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  shortDetails: event.target.value,
                }))
              }
              placeholder="Comprehensive cover optimized for London Congestion Zone regular users."
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Rate
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    rate: event.target.value,
                  }))
                }
                placeholder="42.50"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Saving Up To (%)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.savingUpTo}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    savingUpTo: event.target.value,
                  }))
                }
                placeholder="20"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
