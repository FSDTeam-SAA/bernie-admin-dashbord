"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Trash2, Pencil } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
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

interface Prize {
  _id: string;
  prizeTag: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PrizesApiResponse {
  data?: {
    prizes?: Prize[];
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

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

export default function SetPrizes(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [prizeTag, setPrizeTag] = useState("");
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Prize | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  const prizesQuery = useQuery<PrizesApiResponse>({
    queryKey: ["prizes", searchQuery],
    queryFn: async () => {
      const url = new URL(`${apiBaseUrl}/prizes`);
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "100");

      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }

      const res = await fetch(url.toString());
      const response = await readJsonResponse<PrizesApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to fetch prizes");
      }

      return response;
    },
  });

  const prizes = prizesQuery.data?.data?.prizes || [];
  const isAuthed = status === "authenticated" && Boolean(TOKEN);

  const createPrizeMutation = useMutation({
    mutationFn: async (nextPrizeTag: string) => {
      const res = await fetch(`${apiBaseUrl}/prizes`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ prizeTag: nextPrizeTag }),
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to add prize");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Prize added successfully");
      setIsAddOpen(false);
      setPrizeTag("");
      await prizesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add prize");
    },
  });

  const updatePrizeMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { prizeTag?: string; isActive?: boolean };
    }) => {
      const res = await fetch(`${apiBaseUrl}/prizes/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to update prize");
      }

      return response;
    },
    onSuccess: async (_, variables) => {
      toast.success(
        typeof variables.body.isActive === "boolean"
          ? "Prize status updated successfully"
          : "Prize updated successfully",
      );
      setEditingPrize(null);
      setPrizeTag("");
      await prizesQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update prize",
      );
    },
  });

  const deletePrizeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBaseUrl}/prizes/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to delete prize");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Prize deleted successfully");
      setDeleteTarget(null);
      await prizesQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete prize",
      );
    },
  });

  const openAddDialog = () => {
    setPrizeTag("");
    setIsAddOpen(true);
  };

  const openEditDialog = (prize: Prize) => {
    setEditingPrize(prize);
    setPrizeTag(prize.prizeTag);
  };

  const submitPrize = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrizeTag = prizeTag.trim();
    if (!trimmedPrizeTag) {
      toast.error("Prize name is required");
      return;
    }

    if (editingPrize) {
      updatePrizeMutation.mutate({
        id: editingPrize._id,
        body: { prizeTag: trimmedPrizeTag },
      });
      return;
    }

    createPrizeMutation.mutate(trimmedPrizeTag);
  };

  const togglePrizeStatus = (prize: Prize) => {
    updatePrizeMutation.mutate({
      id: prize._id,
      body: { isActive: !prize.isActive },
    });
  };

  return (
    <div className="w-full">
      {/* ৪. সার্চ বার এবং অ্যাড প্রাইজ বাটন সেকশন (হুবহু স্ক্রিনশটের লেআউট) */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        {/* হালকা ব্যাকগ্রাউন্ডের ওয়াইড সার্চ বার */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search By Prize Name.."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-[#F1F5F9] border border-transparent rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
          />
        </div>

        {/* ব্লু অ্যাড প্রাইজ বাটন */}
        <button
          type="button"
          onClick={openAddDialog}
          disabled={!isAuthed}
          className="flex items-center justify-center gap-2 bg-[#0052B4] hover:bg-blue-700 text-white font-semibold text-sm px-7 py-3.5 rounded shadow-sm transition-all w-full sm:w-auto shrink-0 disabled:pointer-events-none disabled:opacity-60"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Add Prizes
        </button>
      </div>

      {/* ৫. প্রাইজ কার্ড গ্রিড সেকশন */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 py-10">
        {prizesQuery.isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">
            Loading prizes...
          </div>
        ) : prizes.length > 0 ? (
          prizes.map((prize) => (
            <div
              key={prize._id}
              className="bg-[#FFFFFF] border border-slate-50 rounded p-6 shadow-[4px_8px_22px_0px_#004EB01F] transition-all flex flex-col justify-between min-h-[150px]"
            >
              {/* প্রাইজের নাম (টাইপোগ্রাফি স্টাইল ম্যাচিং) */}
              <h3 className="text-lg font-bold text-[#0A3D80] leading-snug tracking-wide font-serif mb-6">
                {prize.prizeTag}
              </h3>

              {/* ফুটার কন্ট্রোল সেকশন (স্ট্যাটাস ব্যাজ ও অ্যাকশন আইকন) */}
              <div className="flex items-center justify-between pt-2">
                {/* ডাইনামিক স্ট্যাটাস ব্যাজ */}
                <button
                  type="button"
                  disabled={!isAuthed || updatePrizeMutation.isPending}
                  onClick={() => togglePrizeStatus(prize)}
                  className={`text-xs font-semibold px-6 py-2 tracking-wide select-none transition disabled:pointer-events-none disabled:opacity-60 ${
                    prize.isActive
                      ? "bg-[#E6F7ED] text-[#22C55E]"
                      : "bg-[#E2E8F0] text-slate-500"
                  }`}
                >
                  {prize.isActive ? "Active" : "Inactive"}
                </button>

                {/* রাইট সাইড অ্যাকশন আইকন গ্রুপ */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(prize)}
                    disabled={!isAuthed || prize.isActive}
                    className="text-slate-700 hover:text-red-500 transition-colors p-1 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditDialog(prize)}
                    disabled={!isAuthed}
                    className="text-slate-700 hover:text-blue-600 transition-colors p-1 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* নো ডেটা ফাউন্ড স্টেট */
          <div className="col-span-full text-center py-12 text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">
            No prizes found matching your search.
          </div>
        )}
      </div>

      <PrizeFormDialog
        open={isAddOpen || Boolean(editingPrize)}
        title={editingPrize ? "Edit Prize" : "Add Prize"}
        description={
          editingPrize ? "Update prize name." : "Create a new prize item."
        }
        prizeTag={prizeTag}
        isSubmitting={createPrizeMutation.isPending || updatePrizeMutation.isPending}
        submitLabel={editingPrize ? "Update" : "Add"}
        onPrizeTagChange={setPrizeTag}
        onSubmit={submitPrize}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingPrize(null);
            setPrizeTag("");
          }
        }}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prize</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prize? Active prizes cannot
              be deleted.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {deleteTarget.prizeTag}
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
              disabled={deletePrizeMutation.isPending}
              onClick={() =>
                deleteTarget && deletePrizeMutation.mutate(deleteTarget._id)
              }
            >
              {deletePrizeMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrizeFormDialog({
  open,
  title,
  description,
  prizeTag,
  isSubmitting,
  submitLabel,
  onPrizeTagChange,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  prizeTag: string;
  isSubmitting: boolean;
  submitLabel: string;
  onPrizeTagChange: (value: string) => void;
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
            <label className="text-xs font-bold text-slate-700 block">
              Prize Name
            </label>
            <input
              type="text"
              value={prizeTag}
              onChange={(event) => onPrizeTagChange(event.target.value)}
              placeholder="Platinum Driver Reward £20000"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
