"use client";

import React from "react";
import {
  Plus,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// API Base URL (আপনার .env.local ফাইলে NEXT_PUBLIC_API_URL="আপনার_ইউআরএল" সেট করুন)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// টাইপ ডেফিনিশন (Better Development Experience এর জন্য)
interface InsuranceItem {
  _id: string;
  name: string;
  shortDetails: string;
  rate: number;
  savingUpTo: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InsuranceListing() {
  const queryClient = useQueryClient();

  // ১. Get All Insurances Query
  const {
    data: responseData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["insurances"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/insurances`);
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
  });

  // ২. Create Insurance Mutation
  const createMutation = useMutation({
    mutationFn: async (
      newInsurance: Omit<
        InsuranceItem,
        "_id" | "isActive" | "createdAt" | "updatedAt"
      >,
    ) => {
      const res = await fetch(`${API_BASE_URL}/insurances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInsurance),
      });
      if (!res.ok) throw new Error("Failed to create insurance");
      return res.json();
    },
    onSuccess: () => {
      // নতুন ডেটা অ্যাড হলে টেবিল বা গ্রিড রিফ্রেশ করবে
      queryClient.invalidateQueries({ queryKey: ["insurances"] });
    },
  });

  // ৩. Update Insurance Mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InsuranceItem>;
    }) => {
      const res = await fetch(`${API_BASE_URL}/insurances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update insurance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurances"] });
    },
  });

  // ৪. Delete Insurance Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/insurances/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete insurance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurances"] });
    },
  });

  // হ্যান্ডলার ফাংশনস (টেস্টিং বা পরবর্তীতে ফর্ম যুক্ত করার সুবিধার জন্য)
  const handleAddInsurance = () => {
    // উদাহরণস্বরূপ Dummy Body দিয়ে ক্রিয়েট করা
    createMutation.mutate({
      name: "City-Premium Plan",
      shortDetails:
        "Comprehensive cover optimized for London Congestion Zone regular users.",
      rate: 42.5,
      savingUpTo: 20,
    });
  };

  const handleEditInsurance = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        name: "City-High-Premium Plan",
        shortDetails:
          "Comprehensive cover optimized for London Congestion Zone regular users.",
        rate: 42.5,
        savingUpTo: 20,
      },
    });
  };

  const handleDeleteInsurance = (id: string) => {
    if (confirm("Are you sure you want to delete this insurance?")) {
      deleteMutation.mutate(id);
    }
  };

  // API থেকে আসা মূল ডেটা এবং পেজিনেশন আলাদা করা
  const insurances: InsuranceItem[] = responseData?.data?.insurances || [];
  const meta = responseData?.data?.paginationInfo;

  return (
    <div className="w-full min-h-screen font-sans antialiased text-[#1e293b]">
      <div className="space-y-6">
        {/* Top Header Controls */}
        <div className="flex justify-end">
          <button
            onClick={handleAddInsurance}
            disabled={createMutation.isPending}
            className="flex items-center justify-center gap-2 bg-[#0052cc] hover:bg-blue-700 text-white font-medium px-6 py-3.5 rounded-xl shadow-sm transition-all text-sm whitespace-nowrap disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Add Insurance
          </button>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-[#1a253c] tracking-tight">
          Insurance Details
        </h2>

        {/* Loading & Error States */}
        {isLoading && (
          <div className="flex justify-center items-center py-20 text-[#0052cc]">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-red-500 font-medium">
            Something went wrong while fetching insurances.
          </div>
        )}

        {/* Insurance Cards Grid */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insurances.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-slate-400">
                No insurance data found.
              </div>
            ) : (
              insurances.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative transition-all hover:shadow-md"
                >
                  <div>
                    {/* Card Top Row */}
                    <div className="flex items-center justify-between mb-4">
                      {/* Car Icon Badge */}
                      <div className="w-10 h-10 rounded-full bg-[#e6f0fa] flex items-center justify-center text-[#0052cc]">
                        <Car className="w-5 h-5 fill-current stroke-[1.5]" />
                      </div>
                      {/* Discount Badge */}
                      <span className="bg-[#e6f0fa] text-[#0052cc] text-xs font-bold px-3 py-1 rounded-md tracking-wide">
                        Save {item.savingUpTo}%
                      </span>
                    </div>

                    {/* Card Header Title */}
                    <h3 className="text-2xl font-serif font-bold text-[#1a253c] tracking-wide mb-3">
                      {item.name}
                    </h3>

                    {/* Description Paragraph */}
                    <p className="text-xs text-slate-400 leading-relaxed font-normal mb-5 max-w-md">
                      {item.shortDetails}
                    </p>

                    {/* Feature Checklists (Static Features, can be dynamic if API provides them) */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 font-normal">
                        <CheckCircle2 className="w-4 h-4 text-[#0052cc] stroke-[2]" />
                        <span>No-claims bonus protection</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 font-normal">
                        <CheckCircle2 className="w-4 h-4 text-[#0052cc] stroke-[2]" />
                        <span>24/7 Central London recovery</span>
                      </div>
                    </div>
                  </div>

                  {/* Rate and Action Row */}
                  <div>
                    <div className="mb-4">
                      <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">
                        MEMBER RATE
                      </span>
                      <span className="text-[#0052cc] text-sm font-extrabold">
                        £{item.rate}/mo
                      </span>
                    </div>

                    {/* Actions Button Group */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleEditInsurance(item._id)}
                        disabled={updateMutation.isPending}
                        className="bg-[#0052cc] hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteInsurance(item._id)}
                        disabled={deleteMutation.isPending}
                        className="bg-[#f1f3f5] hover:bg-slate-200 text-slate-400 hover:text-red-500 font-semibold text-xs py-3 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && !isError && meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-sm text-slate-400 font-medium">
            <div>
              Showing {insurances.length} of {meta.totalData} results
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={!meta.hasPrevPage}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                className={`w-9 h-9 flex items-center justify-center rounded-lg ${meta.currentPage === 1 ? "bg-[#0f172a] text-white" : "bg-white border border-slate-200 text-slate-700"} font-semibold shadow-sm`}
              >
                {meta.currentPage}
              </button>

              <button
                disabled={!meta.hasNextPage}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
