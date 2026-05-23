"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Plan {
  _id: string;
  planName: string;
  price: number;
  billingCycle: string;
  title: string;
  packageIncludes: string;
  isActive: boolean;
  subscribers?: number;
  createdAt: string;
  updatedAt: string;
}

interface PlansResponse {
  success: boolean;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: {
    plans: Plan[];
    paginationInfo?: {
      currentPage: number;
      totalPages: number;
      totalData: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

interface SinglePlanResponse {
  success: boolean;
  message: string;
  data: Plan;
}

interface PlanFormState {
  planName: string;
  price: string;
  billingCycle: string;
  title: string;
  packageIncludes: string;
}

const emptyForm: PlanFormState = {
  planName: "",
  price: "",
  billingCycle: "",
  title: "",
  packageIncludes: "",
};

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const formatDate = (date?: string) => {
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

const getPlanPayload = (form: PlanFormState) => ({
  planName: form.planName.trim(),
  price: Number(form.price),
  billingCycle: form.billingCycle.trim(),
  title: form.title.trim(),
  packageIncludes: form.packageIncludes.trim(),
});

function matchesSearch(plan: Plan, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    plan.planName,
    plan.price,
    plan.billingCycle,
    plan.title,
    plan.packageIncludes,
    plan.isActive ? "active" : "inactive",
    plan.subscribers,
    formatDate(plan.createdAt),
  ].some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(normalizedSearch),
  );
}

export default function SubscriptionManagement(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [viewPlanId, setViewPlanId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanFormState>(emptyForm);
  const rowsPerPage = 10;

  const queryClient = useQueryClient();
  const { data: session } = useSession();
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

  const plansQuery = useQuery<PlansResponse>({
    queryKey: ["plans", currentPage, searchQuery],
    queryFn: async () => {
      const url = new URL(`${apiBaseUrl}/plans`);

      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("limit", String(rowsPerPage));
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }

      const res = await fetch(url.toString());
      const response = await readJsonResponse<PlansResponse>(res);

      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to fetch plans");
      }

      return response;
    },
  });

  const singlePlanQuery = useQuery<SinglePlanResponse>({
    queryKey: ["plan-details", viewPlanId],
    enabled: Boolean(viewPlanId),
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/plans/${viewPlanId}`);
      const response = await readJsonResponse<SinglePlanResponse>(res);

      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to fetch plan");
      }

      return response;
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof getPlanPayload>) => {
      const res = await fetch(`${apiBaseUrl}/plans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const response = await readJsonResponse<{ message?: string }>(res);
      if (!res.ok) {
        throw new Error(response.message || "Failed to create plan");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Plan created successfully");
      closeFormDialog();
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ReturnType<typeof getPlanPayload>> & {
        isActive?: boolean;
      };
    }) => {
      const res = await fetch(`${apiBaseUrl}/plans/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const response = await readJsonResponse<{ message?: string }>(res);
      if (!res.ok) {
        throw new Error(response.message || "Failed to update plan");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Plan updated successfully");
      closeFormDialog();
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
      await queryClient.invalidateQueries({ queryKey: ["plan-details"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBaseUrl}/plans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const response = await readJsonResponse<{ message?: string }>(res);
      if (!res.ok) {
        throw new Error(response.message || "Failed to delete plan");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Plan deleted successfully");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const plans = plansQuery.data?.data?.plans || [];
  const visiblePlans = plans.filter((plan) => matchesSearch(plan, searchQuery));
  const selectedPlan = singlePlanQuery.data?.data;
  const apiTotalData =
    plansQuery.data?.data?.paginationInfo?.totalData ||
    plansQuery.data?.meta?.total ||
    0;
  const totalData =
    searchQuery && apiTotalData === plans.length
      ? visiblePlans.length
      : apiTotalData;
  const totalPages = Math.max(
    plansQuery.data?.data?.paginationInfo?.totalPages ||
      plansQuery.data?.meta?.totalPages ||
      1,
    1,
  );
  const showingStart =
    totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(
    showingStart + visiblePlans.length - 1,
    totalData,
  );
  const shouldShowSkeleton =
    plansQuery.isLoading || (plansQuery.isFetching && plans.length === 0);
  const shouldShowPagination = totalData > rowsPerPage;

  const openAddDialog = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      planName: plan.planName,
      price: String(plan.price),
      billingCycle: plan.billingCycle,
      title: plan.title,
      packageIncludes: plan.packageIncludes || "",
    });
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    setFormOpen(false);
    setEditingPlan(null);
    setForm(emptyForm);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = getPlanPayload(form);
    if (
      !payload.planName ||
      Number.isNaN(payload.price) ||
      !payload.billingCycle ||
      !payload.title
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan._id, payload });
      return;
    }

    createPlanMutation.mutate(payload);
  };

  const updateStatus = (plan: Plan, value: string) => {
    const nextStatus = value === "active";
    if (nextStatus === plan.isActive) return;

    updatePlanMutation.mutate({
      id: plan._id,
      payload: { isActive: nextStatus },
    });
  };

  const isSaving = createPlanMutation.isPending || updatePlanMutation.isPending;

  return (
    <div className="w-full text-[#1E2B4B]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xl">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search By Name Or Pricing..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-[16px] border-0 bg-[#F1F5F9] py-4 pl-14 pr-5 text-sm font-medium text-slate-700 transition-all placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0052B4] px-5 text-sm font-bold text-white transition hover:bg-[#00418F]"
        >
          <Plus className="h-4 w-4" />
          Add Subscription
        </button>
      </div>

      <h1 className="mb-6 mt-8 text-2xl font-bold tracking-tight text-[#0F172A]">
        Subscription Details
      </h1>

      <div className="overflow-hidden rounded-[8px] border border-slate-100 bg-white">
        <Table>
          <TableHeader className="border-b-0 bg-[#EBF5FF]">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Plan Name
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Price
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Billing Cycle
              </TableHead>
              <TableHead className="h-12 px-6 text-center font-semibold text-slate-700">
                Subscribers
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
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center font-medium text-slate-400"
                >
                  Loading subscriptions...
                </TableCell>
              </TableRow>
            ) : visiblePlans.length > 0 ? (
              visiblePlans.map((plan) => (
                <TableRow
                  key={plan._id}
                  className="border-slate-100 transition-colors hover:bg-slate-50/80"
                >
                  <TableCell className="px-6 py-5 text-center font-bold text-slate-900">
                    {plan.planName}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-bold text-slate-900">
                    {formatMoney(plan.price)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-medium text-slate-600">
                    {plan.billingCycle}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-medium text-slate-600">
                    {plan.subscribers ?? 0}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center font-medium text-slate-600">
                    {formatDate(plan.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <Select
                      value={plan.isActive ? "active" : "inactive"}
                      disabled={updatePlanMutation.isPending}
                      onValueChange={(value) => updateStatus(plan, value)}
                    >
                      <SelectTrigger
                        className={`mx-auto h-8 min-w-24 cursor-pointer rounded-md border-0 px-3 text-xs font-bold uppercase shadow-none focus:ring-0 focus:ring-offset-0 disabled:cursor-not-allowed ${
                          plan.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="center">
                        <SelectItem value="active" className="cursor-pointer">
                          Active
                        </SelectItem>
                        <SelectItem value="inactive" className="cursor-pointer">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewPlanId(plan._id)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                        aria-label="View subscription details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditDialog(plan)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Edit subscription"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(plan)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete subscription"
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
                  className="py-12 text-center font-medium text-slate-400"
                >
                  No matching subscription found.
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
        open={formOpen}
        onOpenChange={(open) => !open && closeFormDialog()}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Subscription" : "Add Subscription"}
            </DialogTitle>
            <DialogDescription>
              Fill in the subscription plan information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Plan Name"
                value={form.planName}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, planName: value }))
                }
              />
              <FormField
                label="Price"
                type="number"
                value={form.price}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, price: value }))
                }
              />
              <FormField
                label="Billing Cycle"
                value={form.billingCycle}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, billingCycle: value }))
                }
              />
              <FormField
                label="Title"
                value={form.title}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, title: value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Package Includes
              </label>
              <textarea
                value={form.packageIncludes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    packageIncludes: event.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeFormDialog}
                disabled={isSaving}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewPlanId)}
        onOpenChange={(open) => !open && setViewPlanId(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              Complete information for the selected subscription plan.
            </DialogDescription>
          </DialogHeader>

          {singlePlanQuery.isLoading ? (
            <p className="py-8 text-center text-sm font-medium text-slate-400">
              Loading subscription details...
            </p>
          ) : selectedPlan ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Plan Name" value={selectedPlan.planName} />
              <DetailItem
                label="Price"
                value={formatMoney(selectedPlan.price)}
              />
              <DetailItem
                label="Billing Cycle"
                value={selectedPlan.billingCycle}
              />
              <DetailItem
                label="Subscribers"
                value={String(selectedPlan.subscribers ?? 0)}
              />
              <DetailItem
                label="Status"
                value={selectedPlan.isActive ? "Active" : "Inactive"}
              />
              <DetailItem
                label="Created At"
                value={formatDate(selectedPlan.createdAt)}
              />
              <DetailItem
                label="Title"
                value={selectedPlan.title}
                className="sm:col-span-2"
              />
              <DetailItem
                label="Package Includes"
                value={selectedPlan.packageIncludes || "N/A"}
                className="sm:col-span-2"
              />
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
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              This will permanently delete this subscription plan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deletePlanMutation.isPending}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                deleteTarget && deletePlanMutation.mutate(deleteTarget._id)
              }
              disabled={deletePlanMutation.isPending}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              {deletePlanMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
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
