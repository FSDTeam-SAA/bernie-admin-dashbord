/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { FormEvent, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Check } from "lucide-react"; // মডাল ও পাসওয়ার্ড ফিল্ডের জন্য আইকন

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL থেকে ইমেইল রিড করা হচ্ছে (যেমন: bdcallingjahidul@gmail.com)
  const email = searchParams.get("email") || "";

  // পাসওয়ার্ড স্টেট ও শো/হাইড লজিক
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // মডাল ওপেন করার স্টেট
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // TanStack Query Mutation
  const resetPassMutation = useMutation({
    mutationFn: async (bodyData: { email: string; newPassword: string }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/reset-password`, // আপনার সঠিক API এন্ডপয়েন্ট অনুযায়ী চেঞ্জ করতে পারেন
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData), // আপনার রিকোয়ার্ড বডি ফরম্যাট
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      return res.json();
    },
    onSuccess: () => {
      // পাসওয়ার্ড চেঞ্জ সফল হলে স্ক্রিনশটের মতো মডাল ওপেন হবে
      setShowSuccessModal(true);
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  // সাবমিট হ্যান্ডলার
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // মিউটেশন কল করা হচ্ছে আপনার পছন্দনীয় বডি স্ট্রাকচারে
    resetPassMutation.mutate({
      email: email.trim(),
      newPassword: newPassword,
    });
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center relative">
      {/* Logo */}
      <div className="mb-6 relative h-[135px] w-[135px] flex items-center justify-center select-none">
        <Image
          src="/images/auth-round-image.png"
          alt="BubbleDrive Logo"
          width={360}
          height={360}
          className="object-contain pointer-events-none w-full h-full"
          priority
        />
      </div>

      {/* Heading */}
      <h1 className="text-[40px] leading-[120%] font-bold text-[#131313] mb-1 text-center font-sans">
        New Password
      </h1>

      <p className="text-base text-[#787878] font-normal mb-8 text-center leading-[170%]">
        Please enter your new password below
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {/* New Password */}
        <div className="space-y-2">
          <label className="text-[14px] font-medium text-slate-700 block tracking-wide">
            New Password <span className="text-[#CC3333] ml-0.5">*</span>
          </label>

          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter New Password..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-[#EAEAEA]/60 border border-transparent rounded-[8px] px-4 py-[14px] pr-12 text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-[#EAEAEA]/80 focus:border-slate-200 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer p-1 rounded-md"
            >
              {showNewPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Re-enter Password */}
        <div className="space-y-2">
          <label className="text-[14px] font-medium text-slate-700 block tracking-wide">
            Re-enter Password <span className="text-[#CC3333] ml-0.5">*</span>
          </label>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter Password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-[#EAEAEA]/60 border border-transparent rounded-[8px] px-4 py-[14px] pr-12 text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-[#EAEAEA]/80 focus:border-slate-200 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer p-1 rounded-md"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={resetPassMutation.isPending}
          className="w-full bg-[#004EAF] text-white font-semibold text-[15px] py-[14px] px-4 rounded-xl shadow-[0px_6px_16px_rgba(0,78,175,0.25)] hover:bg-[#004195] hover:shadow-[0px_8px_20px_rgba(0,78,175,0.35)] active:scale-[0.99] transition-all duration-200 cursor-pointer text-center mt-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {resetPassMutation.isPending ? "Updating Password..." : "Update Password"}
        </button>
      </form>

      {/* Success Modal Backdrop */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 animate-fade-in">
          {/* Modal Content Box (Exact match with screenshot) */}
          <div className="bg-[#FAF8F5] rounded-2xl p-8 max-w-[400px] w-full mx-4 shadow-2xl flex flex-col items-center border border-white/60 text-center scale-up-animation">
            
            {/* Checkmark Icon Circle */}
            <div className="h-12 w-12 rounded-full bg-[#004EAF]/10 flex items-center justify-center mb-5 text-[#004EAF]">
              <div className="h-8 w-8 rounded-full bg-[#004EAF]/20 flex items-center justify-center">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
            </div>

            {/* Modal Headings */}
            <h2 className="text-[20px] font-bold text-[#131313] mb-1.5 font-sans">
              Password Changed Successfully
            </h2>
            <p className="text-[13px] text-[#667085] font-normal mb-6 max-w-[280px] leading-relaxed">
              Your password has been updated successfully
            </p>

            {/* Back to Login Button */}
            <button
              onClick={() => router.push("/signin")} // অথবা আপনার প্রপার সাইন-ইন পাথ দিবেন
              className="w-full bg-[#004EAF] hover:bg-[#004195] text-white font-semibold text-[14px] py-[12px] px-4 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white selection:bg-[#004EAF]/20">
      {/* Left Side: 50% Image Panel */}
      <div className="relative hidden w-1/2 h-full lg:block select-none">
        <Image
          src="/images/auth.png"
          alt="BubbleDrive Authentication Visual"
          fill
          priority
          sizes="50vw"
          className="object-cover pointer-events-none"
        />
      </div>

      {/* Right Side */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2 sm:px-12 md:px-16 lg:px-20 xl:px-24">
        <Suspense fallback={<div className="text-slate-500 text-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}