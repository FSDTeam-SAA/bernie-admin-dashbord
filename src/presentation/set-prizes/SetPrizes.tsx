"use client";

import React, { useState } from "react";
import { Search, Plus, Trash2, Pencil } from "lucide-react";

// ১. প্রাইজের ডেটা স্ট্রাকচার ইন্টারফেস
interface PrizeData {
  id: string;
  name: string;
  isActive: boolean;
}

// ২. স্ক্রিনশট অনুযায়ী ডামি ডেটা
const initialPrizes: PrizeData[] = [
  {
    id: "1",
    name: "London Mega Cash Prize of £1000",
    isActive: true,
  },
  {
    id: "2",
    name: "Platinum Driver Reward £1500",
    isActive: false,
  },
  {
    id: "3",
    name: "Platinum Driver Reward £1500",
    isActive: false,
  },
];

export default function SetPrizes(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");

  // ৩. ফিল্টারিং লজিক (Prize Name দিয়ে সার্চ)
  const filteredPrizes = initialPrizes.filter((prize) =>
    prize.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-[#F1F5F9] border border-transparent rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner"
          />
        </div>

        {/* ব্লু অ্যাড প্রাইজ বাটন */}
        <button className="flex items-center justify-center gap-2 bg-[#0052B4] hover:bg-blue-700 text-white font-semibold text-sm px-7 py-3.5 rounded shadow-sm transition-all w-full sm:w-auto shrink-0">
          <Plus className="w-4 h-4 stroke-[3]" />
          Add Prizes
        </button>
      </div>

      {/* ৫. প্রাইজ কার্ড গ্রিড সেকশন */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 py-10">
        {filteredPrizes.length > 0 ? (
          filteredPrizes.map((prize) => (
            <div
              key={prize.id}
              className="bg-[#FFFFFF] border border-slate-50 rounded p-6 shadow-[4px_8px_22px_0px_#004EB01F] transition-all flex flex-col justify-between min-h-[150px]"
            >
              {/* প্রাইজের নাম (টাইপোগ্রাফি স্টাইল ম্যাচিং) */}
              <h3 className="text-lg font-bold text-[#0A3D80] leading-snug tracking-wide font-serif mb-6">
                {prize.name}
              </h3>

              {/* ফুটার কন্ট্রোল সেকশন (স্ট্যাটাস ব্যাজ ও অ্যাকশন আইকন) */}
              <div className="flex items-center justify-between pt-2">
                {/* ডাইনামিক স্ট্যাটাস ব্যাজ */}
                {prize.isActive ? (
                  <span className="bg-[#E6F7ED] text-[#22C55E] text-xs font-semibold px-6 py-2 tracking-wide select-none">
                    Active
                  </span>
                ) : (
                  <span className="bg-[#E2E8F0] text-slate-500 text-xs font-semibold px-6 py-2 tracking-wide select-none">
                    Inactive
                  </span>
                )}

                {/* রাইট সাইড অ্যাকশন আইকন গ্রুপ */}
                <div className="flex items-center gap-4">
                  <button className="text-slate-700 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="text-slate-700 hover:text-blue-600 transition-colors p-1">
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
    </div>
  );
}
