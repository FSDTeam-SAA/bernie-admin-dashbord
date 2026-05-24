"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_ACCESS_PERMISSION,
  ASSIGNABLE_TEAM_PERMISSIONS,
} from "@/lib/team-permissions";

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

interface WorkerDetailsResponse {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: WorkerAdmin;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const statusOptions = ["Active", "Suspended"];

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

function WorkersDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;
  const workerId = params.id;
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("Active");

  const workerQuery = useQuery<WorkerDetailsResponse>({
    queryKey: ["team-worker-details", workerId, accessToken],
    enabled:
      status === "authenticated" && Boolean(accessToken) && Boolean(workerId),
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/team/${workerId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const response = await readJsonResponse<WorkerDetailsResponse>(res);

      if (!res.ok || response.success === false || response.status === false) {
        throw new Error(response.message || "Failed to fetch worker details");
      }

      return response;
    },
  });

  const worker = workerQuery.data?.data;

  useEffect(() => {
    if (!worker) return;

    setSelectedPermissions(worker.permissions || []);
    setSelectedStatus(worker.status || "Active");
  }, [worker]);

  const hasAllAccess = selectedPermissions.includes(ALL_ACCESS_PERMISSION);
  const displayedPermissionCount = hasAllAccess
    ? ASSIGNABLE_TEAM_PERMISSIONS.length
    : selectedPermissions.length;

  const updateWorkerMutation = useMutation({
    mutationFn: async () => {
      const permissionsToSave = hasAllAccess
        ? [ALL_ACCESS_PERMISSION]
        : selectedPermissions.filter(
            (permission) => permission !== ALL_ACCESS_PERMISSION,
          );

      const res = await fetch(`${apiBaseUrl}/team/${workerId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permissions: permissionsToSave,
          status: selectedStatus,
        }),
      });
      const response = await readJsonResponse<WorkerDetailsResponse>(res);

      if (!res.ok || response.success === false || response.status === false) {
        throw new Error(response.message || "Failed to update worker access");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Worker access updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["team-workers"] });
      await queryClient.invalidateQueries({
        queryKey: ["team-worker-details", workerId],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isDirty = useMemo(() => {
    if (!worker) return false;

    const previousPermissions = [...(worker.permissions || [])].sort();
    const nextPermissions = [...selectedPermissions].sort();

    return (
      previousPermissions.join("|") !== nextPermissions.join("|") ||
      worker.status !== selectedStatus
    );
  }, [selectedPermissions, selectedStatus, worker]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) => {
      if (permission === ALL_ACCESS_PERMISSION) {
        return current.includes(ALL_ACCESS_PERMISSION)
          ? current.filter((item) => item !== ALL_ACCESS_PERMISSION)
          : [ALL_ACCESS_PERMISSION];
      }

      const withoutAllAccess = current.filter(
        (item) => item !== ALL_ACCESS_PERMISSION,
      );

      return withoutAllAccess.includes(permission)
        ? withoutAllAccess.filter((item) => item !== permission)
        : [...withoutAllAccess, permission];
    });
  };

  if (workerQuery.isLoading) {
    return <WorkersDetailsSkeleton />;
  }

  if (workerQuery.isError) {
    return (
      <div className="rounded-[8px] border border-red-100 bg-red-50 p-6 text-sm font-medium text-red-700">
        {(workerQuery.error as Error).message}
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="rounded-[8px] border border-slate-100 bg-white p-10 text-center font-medium text-slate-400">
        Worker admin not found.
      </div>
    );
  }

  return (
    <div className="w-full text-[#1E2B4B]">
      <button
        type="button"
        onClick={() => router.push("/manage-workers")}
        className="mb-6 inline-flex items-center gap-2 rounded-lg px-1 text-sm font-semibold text-slate-500 transition hover:text-[#0052cc]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to workers
      </button>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-[8px] border border-slate-100 bg-white p-6">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[#0052cc]">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {worker.name || "N/A"}
          </h2>
          <p className="mt-2 break-words text-sm font-medium text-slate-500">
            {worker.email || "N/A"}
          </p>

          <div className="mt-8 space-y-4">
            <DetailItem label="Role" value={worker.role || "N/A"} />
            <DetailItem label="Created By" value={worker.createdBy?.email || "N/A"} />
            <DetailItem label="Last Active" value={formatDate(worker.lastActive)} />
            <DetailItem label="Created At" value={formatDate(worker.createdAt)} />
            <DetailItem label="Updated At" value={formatDate(worker.updatedAt)} />
          </div>
        </section>

        <section className="rounded-[8px] border border-slate-100 bg-white p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Route Access
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {displayedPermissionCount} route
                {displayedPermissionCount === 1 ? "" : "s"} selected
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="!h-10 w-full cursor-pointer rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-none focus:ring-2 focus:ring-blue-500/20 sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {statusOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="cursor-pointer"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                disabled={!isDirty || updateWorkerMutation.isPending}
                onClick={() => updateWorkerMutation.mutate()}
                className="h-10 rounded-lg bg-[#0052cc] px-5 font-semibold text-white hover:bg-[#0047b3] cursor-pointer"
              >
                {updateWorkerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={hasAllAccess}
                onCheckedChange={() => togglePermission(ALL_ACCESS_PERMISSION)}
                className="mt-0.5 border-blue-300 data-[state=checked]:border-[#0052cc] data-[state=checked]:bg-[#0052cc]"
              />
              <span>
                <span className="block text-sm font-bold text-slate-900">
                  All Access
                </span>
                <span className="mt-1 block text-sm font-medium text-slate-500">
                  Allow this worker admin to open every assignable dashboard route.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {ASSIGNABLE_TEAM_PERMISSIONS.map((permission) => {
              const checked =
                hasAllAccess || selectedPermissions.includes(permission);

              return (
                <label
                  key={permission}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    checked
                      ? "border-blue-100 bg-blue-50/60"
                      : "border-slate-100 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={hasAllAccess}
                    onCheckedChange={() => togglePermission(permission)}
                    className="mt-0.5 data-[state=checked]:border-[#0052cc] data-[state=checked]:bg-[#0052cc]"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {permission}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
        {label}
      </p>
      <p className="break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function WorkersDetailsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="rounded-[8px] border border-slate-100 bg-white p-6">
        <Skeleton className="mb-6 h-14 w-14 rounded-xl" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-3 h-4 w-72" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="rounded-[8px] border border-slate-100 bg-white p-6">
        <div className="flex justify-between border-b border-slate-100 pb-6">
          <div>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-3 h-4 w-28" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="mt-6 h-20 rounded-lg" />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default WorkersDetails;
