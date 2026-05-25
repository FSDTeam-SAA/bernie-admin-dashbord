"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALL_ACCESS_PERMISSION,
  ASSIGNABLE_TEAM_PERMISSIONS,
} from "@/lib/team-permissions";

interface CreateWorkerPayload {
  name: string;
  email: string;
  permissions: string[];
}

interface CreateWorkerResponse {
  success?: boolean;
  status?: boolean;
  message?: string;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const emptyForm = {
  name: "",
  email: "",
};

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

function AddWorkers() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;
  const [form, setForm] = useState(emptyForm);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const hasAllAccess = selectedPermissions.includes(ALL_ACCESS_PERMISSION);
  const selectedPermissionCount = hasAllAccess
    ? ASSIGNABLE_TEAM_PERMISSIONS.length
    : selectedPermissions.length;

  const permissionPayload = useMemo(() => {
    if (hasAllAccess) return [ALL_ACCESS_PERMISSION];

    return selectedPermissions.filter(
      (permission) => permission !== ALL_ACCESS_PERMISSION,
    );
  }, [hasAllAccess, selectedPermissions]);

  const createWorkerMutation = useMutation({
    mutationFn: async (payload: CreateWorkerPayload) => {
      const res = await fetch(`${apiBaseUrl}/team`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const response = await readJsonResponse<CreateWorkerResponse>(res);

      if (!res.ok || response.success === false || response.status === false) {
        throw new Error(response.message || "Failed to create worker admin");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Worker admin created successfully");
      setForm(emptyForm);
      setSelectedPermissions([]);
      await queryClient.invalidateQueries({ queryKey: ["team-workers"] });
      router.push("/manage-workers");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateFormField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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

  const selectAllPermissions = () => {
    setSelectedPermissions([ALL_ACCESS_PERMISSION]);
  };

  const clearPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name) {
      toast.error("Worker name is required");
      return;
    }

    if (!email) {
      toast.error("Worker email is required");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (permissionPayload.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    if (status !== "authenticated" || !accessToken) {
      toast.error("You must be signed in to create a worker admin");
      return;
    }

    createWorkerMutation.mutate({
      name,
      email,
      permissions: permissionPayload,
    });
  };

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

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-[8px] border border-slate-100 bg-white p-6">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[#0052cc]">
            <UserPlus className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Add Worker Admin
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Create a worker account and choose which dashboard routes they can access.
          </p>

          <div className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="worker-name" className="text-sm font-bold text-slate-700">
                Full Name
              </Label>
              <Input
                id="worker-name"
                type="text"
                value={form.name}
                onChange={(event) => updateFormField("name", event.target.value)}
                placeholder="Rishad new admin"
                className="h-12 rounded-lg border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-none focus-visible:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-email" className="text-sm font-bold text-slate-700">
                Email Address
              </Label>
              <Input
                id="worker-email"
                type="email"
                value={form.email}
                onChange={(event) => updateFormField("email", event.target.value)}
                placeholder="herece7563@noyavip.com"
                className="h-12 rounded-lg border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-none focus-visible:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Selected Access
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {selectedPermissionCount}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              route{selectedPermissionCount === 1 ? "" : "s"} selected
            </p>
          </div>
        </section>

        <section className="rounded-[8px] border border-slate-100 bg-white p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0052cc]" />
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Route Permissions
                </h2>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Choose only the pages this worker should manage.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearPermissions}
                className="h-10 rounded-lg border-slate-200 px-4 font-semibold text-slate-600 cursor-pointer"
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={selectAllPermissions}
                className="h-10 rounded-lg border-blue-100 bg-blue-50 px-4 font-semibold text-[#0052cc] hover:bg-blue-100 cursor-pointer"
              >
                All Access
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
                <span className="mt-1 block text-sm font-medium leading-6 text-slate-500">
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
                  className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
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
                  <span className="text-sm font-semibold leading-5 text-slate-700">
                    {permission}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={createWorkerMutation.isPending}
              onClick={() => router.push("/manage-workers")}
              className="h-11 rounded-lg border-slate-200 px-6 font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createWorkerMutation.isPending}
              className="h-11 rounded-lg bg-[#0052cc] px-6 font-semibold text-white hover:bg-[#0047b3] cursor-pointer"
            >
              {createWorkerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {createWorkerMutation.isPending ? "Creating..." : "Create Worker"}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default AddWorkers;
