"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Category {
  _id: string;
  name: string;
  shortDetails?: string;
  rateActual: number;
  rateDiscounted?: number;
  icon?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryApiResponse {
  data?: {
    categories?: Category[];
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

interface SingleCategoryApiResponse {
  data?: Category;
  message?: string;
}

interface SettingsApiResponse {
  data?: {
    lateFee: number;
  };
  message?: string;
}

interface CategoryFormState {
  name: string;
  shortDetails: string;
  rateActual: string;
  rateDiscounted: string;
  icon: File | null;
}

const emptyForm: CategoryFormState = {
  name: "",
  shortDetails: "",
  rateActual: "",
  rateDiscounted: "",
  icon: null,
};

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

const formatMoney = (amount?: number) =>
  typeof amount === "number" ? `£${amount}` : "N/A";

const buildCategoryFormData = (form: CategoryFormState) => {
  const formData = new FormData();
  formData.append("name", form.name.trim());
  formData.append("shortDetails", form.shortDetails.trim());
  formData.append("rateActual", form.rateActual);
  formData.append("rateDiscounted", form.rateDiscounted);

  if (form.icon) {
    formData.append("icon", form.icon);
  }

  return formData;
};

export default function CategoryManagement(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewCategoryId, setViewCategoryId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(emptyForm);

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

  const settingsQuery = useQuery<SettingsApiResponse>({
    queryKey: ["journey-settings"],
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/journeys/settings`);
      const response = await readJsonResponse<SettingsApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to fetch late fee");
      }

      return response;
    },
  });

  useEffect(() => {
    const fetchedLateFee = settingsQuery.data?.data?.lateFee;
    if (typeof fetchedLateFee === "number") {
      setLateFee(String(fetchedLateFee));
    }
  }, [settingsQuery.data?.data?.lateFee]);

  const categoryQuery = useQuery<CategoryApiResponse>({
    queryKey: ["categories", searchQuery, currentPage],
    queryFn: async () => {
      const url = new URL(`${apiBaseUrl}/categories`);
      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("limit", String(rowsPerPage));

      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }

      const res = await fetch(url.toString());
      const response = await readJsonResponse<CategoryApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to fetch categories");
      }

      return response;
    },
  });

  const singleCategoryQuery = useQuery<SingleCategoryApiResponse>({
    queryKey: ["category-details", viewCategoryId],
    enabled: Boolean(viewCategoryId),
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/categories/${viewCategoryId}`);
      const response = await readJsonResponse<SingleCategoryApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to fetch category");
      }

      return response;
    },
  });

  const categories = categoryQuery.data?.data?.categories || [];
  const totalPages =
    categoryQuery.data?.data?.paginationInfo?.totalPages ||
    categoryQuery.data?.meta?.totalPages ||
    1;
  const totalData =
    categoryQuery.data?.data?.paginationInfo?.totalData ||
    categoryQuery.data?.meta?.total ||
    0;
  const showingStart =
    totalData === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingEnd = Math.min(showingStart + categories.length - 1, totalData);
  const shouldShowPagination = totalData > rowsPerPage;
  const selectedCategory = singleCategoryQuery.data?.data;

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${TOKEN}`,
    }),
    [TOKEN],
  );

  const lateFeeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${apiBaseUrl}/journeys/settings/late-fee`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lateFee: Number(lateFee) }),
      });
      const response = await readJsonResponse<SettingsApiResponse>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to update late fee");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Late fee updated successfully");
      await settingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update late fee",
      );
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (form: CategoryFormState) => {
      const res = await fetch(`${apiBaseUrl}/categories`, {
        method: "POST",
        headers: authHeaders,
        body: buildCategoryFormData(form),
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to add category");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Category added successfully");
      setIsAddOpen(false);
      setCategoryForm(emptyForm);
      await categoryQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add category",
      );
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      form,
    }: {
      id: string;
      form: CategoryFormState;
    }) => {
      const res = await fetch(`${apiBaseUrl}/categories/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: buildCategoryFormData(form),
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to update category");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Category updated successfully");
      setEditingCategory(null);
      setCategoryForm(emptyForm);
      await categoryQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category",
      );
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBaseUrl}/categories/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const response = await readJsonResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(response?.message || "Failed to delete category");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Category deleted successfully");
      setDeleteTarget(null);
      await categoryQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category",
      );
    },
  });

  const resetForm = () => {
    setCategoryForm(emptyForm);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      shortDetails: category.shortDetails || "",
      rateActual: String(category.rateActual),
      rateDiscounted:
        typeof category.rateDiscounted === "number"
          ? String(category.rateDiscounted)
          : "",
      icon: null,
    });
  };

  const updateFormField = (field: keyof CategoryFormState, value: string) => {
    setCategoryForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateFormIcon = (file: File | null) => {
    setCategoryForm((prev) => ({ ...prev, icon: file }));
  };

  const submitCategoryForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (
      !categoryForm.rateActual ||
      Number.isNaN(Number(categoryForm.rateActual))
    ) {
      toast.error("Actual charge is required");
      return;
    }

    if (
      categoryForm.rateDiscounted &&
      Number.isNaN(Number(categoryForm.rateDiscounted))
    ) {
      toast.error("Discounted charge must be a number");
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory._id,
        form: categoryForm,
      });
      return;
    }

    addCategoryMutation.mutate(categoryForm);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Set Late Fee
          </label>
          <div className="relative flex items-center max-w-lg bg-[#E2E8F0] rounded p-1.5 pr-2">
            <input
              type="number"
              value={lateFee}
              onChange={(e) => setLateFee(e.target.value)}
              className="bg-transparent border-0 pl-3 w-full text-sm font-medium text-slate-600 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              disabled={
                lateFeeMutation.isPending ||
                status !== "authenticated" ||
                !TOKEN
              }
              onClick={() => lateFeeMutation.mutate()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0052B4] text-white hover:bg-blue-700 transition shadow-sm disabled:pointer-events-none disabled:opacity-60"
            >
              <Pencil className="w-4 h-4 fill-white text-[#0052B4] stroke-2" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="flex items-center justify-center gap-2 bg-[#004EAF] hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3.5 rounded shadow-md transition-all self-start md:self-end"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Add Catagory
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 my-6">
        <h2 className="text-xl font-bold tracking-tight text-[#1D2B4F]">
          Journey Catagory Details
        </h2>

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

      <div className="bg-white rounded-[12px] border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#EBF5FF] border-b-0">
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="font-semibold text-slate-700 h-14 px-8 text-left w-[35%]">
                Journey Name
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center w-[20%]">
                Actual Charge
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-6 text-center w-[25%]">
                Discounted Charge
              </TableHead>
              <TableHead className="font-semibold text-slate-700 h-14 px-8 text-center w-[20%]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {categoryQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  Loading category details...
                </TableCell>
              </TableRow>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <TableRow
                  key={category._id}
                  className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                >
                  <TableCell className="px-8 py-5 font-normal text-slate-500 text-left whitespace-nowrap">
                    {category.name}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {formatMoney(category.rateActual)}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-normal text-slate-500 text-center">
                    {formatMoney(category.rateDiscounted)}
                  </TableCell>

                  <TableCell className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setViewCategoryId(category._id)}
                        className="text-slate-600 hover:text-blue-600 transition"
                        aria-label="View category details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(category)}
                        className="text-slate-600 hover:text-red-500 transition"
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditDialog(category)}
                        className="text-slate-600 hover:text-green-600 transition"
                        aria-label="Edit category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  No matching category details found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {shouldShowPagination ? (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-sm text-slate-400 font-medium">
          <div>
            Showing {showingStart} to {showingEnd} of {totalData} results
          </div>

          <div className="flex items-center gap-1.5 select-none">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
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
                  className={`flex h-10 w-10 items-center justify-center rounded border font-semibold transition ${
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
              className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      <CategoryFormDialog
        open={isAddOpen || Boolean(editingCategory)}
        title={editingCategory ? "Edit Category" : "Add Category"}
        description={
          editingCategory
            ? "Update this category information."
            : "Create a new journey category."
        }
        form={categoryForm}
        isSubmitting={
          addCategoryMutation.isPending || updateCategoryMutation.isPending
        }
        submitLabel={editingCategory ? "Update" : "Add"}
        currentIconUrl={editingCategory?.icon}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingCategory(null);
            resetForm();
          }
        }}
        onFieldChange={updateFormField}
        onIconChange={updateFormIcon}
        onSubmit={submitCategoryForm}
      />

      <Dialog
        open={Boolean(viewCategoryId)}
        onOpenChange={(open) => !open && setViewCategoryId(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
            <DialogDescription>
              Complete information for the selected category.
            </DialogDescription>
          </DialogHeader>

          {singleCategoryQuery.isLoading ? (
            <p className="py-8 text-center text-sm font-medium text-slate-400">
              Loading category details...
            </p>
          ) : selectedCategory ? (
            <div className="space-y-4">
              {selectedCategory.icon ? (
                <div
                  role="img"
                  aria-label={selectedCategory.name}
                  className="h-28 w-28 rounded-lg border border-slate-100 bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedCategory.icon})` }}
                />
              ) : null}
              <DetailItem label="Journey Name" value={selectedCategory.name} />
              <DetailItem
                label="Short Details"
                value={selectedCategory.shortDetails || "N/A"}
              />
              <DetailItem
                label="Actual Charge"
                value={formatMoney(selectedCategory.rateActual)}
              />
              <DetailItem
                label="Discounted Charge"
                value={formatMoney(selectedCategory.rateDiscounted)}
              />
              <DetailItem
                label="Status"
                value={selectedCategory.isActive ? "Active" : "Inactive"}
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
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category?? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {deleteTarget.name}
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
              disabled={deleteCategoryMutation.isPending}
              onClick={() =>
                deleteTarget && deleteCategoryMutation.mutate(deleteTarget._id)
              }
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryFormDialog({
  open,
  title,
  description,
  form,
  isSubmitting,
  submitLabel,
  currentIconUrl,
  onOpenChange,
  onFieldChange,
  onIconChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  form: CategoryFormState;
  isSubmitting: boolean;
  submitLabel: string;
  currentIconUrl?: string;
  onOpenChange: (open: boolean) => void;
  onFieldChange: (field: keyof CategoryFormState, value: string) => void;
  onIconChange: (file: File | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [selectedIconPreview, setSelectedIconPreview] = useState<string | null>(
    null,
  );
  const iconPreviewUrl = selectedIconPreview || currentIconUrl;

  useEffect(() => {
    if (!form.icon) {
      setSelectedIconPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(form.icon);
    setSelectedIconPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [form.icon]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField
            label="Journey Name"
            value={form.name}
            onChange={(value) => onFieldChange("name", value)}
            placeholder="Category 6"
          />
          <FormField
            label="Short Details"
            value={form.shortDetails}
            onChange={(value) => onFieldChange("shortDetails", value)}
            placeholder="Category 9"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Actual Charge"
              type="number"
              value={form.rateActual}
              onChange={(value) => onFieldChange("rateActual", value)}
              placeholder="30"
            />
            <FormField
              label="Discounted Charge"
              type="number"
              value={form.rateDiscounted}
              onChange={(value) => onFieldChange("rateDiscounted", value)}
              placeholder="20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Icon
            </label>
            {iconPreviewUrl ? (
              <div
                role="img"
                aria-label="Category icon preview"
                className="h-20 w-20 rounded-lg border border-slate-200 bg-cover bg-center"
                style={{ backgroundImage: `url(${iconPreviewUrl})` }}
              />
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                onIconChange(event.target.files?.[0] || null)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded file:border-0 file:bg-[#004EAF] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-700 block">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}
