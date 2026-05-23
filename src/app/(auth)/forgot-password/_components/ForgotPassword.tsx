/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query"; // TanStack Query ইমপোর্ট করা হয়েছে

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  // TanStack Query Mutation
  const forgotPassMutation = useMutation({
    mutationFn: async (bodyData: { email: string }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/forget-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send email");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "OTP sent successfully!");
      const encodedEmail = encodeURIComponent(email.trim());
      router.push(`/otp-verify?email=${encodedEmail}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  // Submit Handler
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mutation কল করা হচ্ছে
    forgotPassMutation.mutate({ email: email.trim() });
  };

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
        <div className="w-full max-w-[420px] flex flex-col items-center">
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
            Forgot Password?
          </h1>

          <p className="text-base text-[#787878] font-normal mb-8 text-center leading-[170%]">
            Enter your email to receive a 6-digit OTP code
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[14px] font-medium text-slate-700 block tracking-wide">
                Email <span className="text-[#CC3333] ml-0.5">*</span>
              </label>

              <input
                type="email"
                placeholder="Enter Your Email Address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#EAEAEA]/60 border border-transparent rounded-[8px] px-4 py-[14px] text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-[#EAEAEA]/80 focus:border-slate-200 transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={forgotPassMutation.isPending} // mutation.isPending ব্যবহার করা হয়েছে
              className="w-full bg-[#004EAF] text-white font-semibold text-[15px] py-[14px] px-4 rounded-xl shadow-[0px_6px_16px_rgba(0,78,175,0.25)] hover:bg-[#004195] hover:shadow-[0px_8px_20px_rgba(0,78,175,0.35)] active:scale-[0.99] transition-all duration-200 cursor-pointer text-center mt-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {forgotPassMutation.isPending ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-[13px] text-slate-500 mt-10 text-center tracking-normal">
            Remember your password?{" "}
            <Link
              href="/signin"
              className="text-[#004EAF] font-bold hover:underline ml-1 transition-colors"
            >
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}