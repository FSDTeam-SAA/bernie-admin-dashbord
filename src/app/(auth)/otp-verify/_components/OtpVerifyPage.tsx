/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { FormEvent, useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL থেকে ইমেইল রিড করা হচ্ছে
  const email = searchParams.get("email") || "";

  // ৬টি ডিজিটের জন্য স্টেট
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // পেজ লোড হলে প্রথম ওটিপি বক্সে অটো-ফোকাস হবে
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // TanStack Query Mutation (ওটিপি ভেরিফাই করার জন্য)
  const verifyOtpMutation = useMutation({
    mutationFn: async (bodyData: { email: string; otp: string }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/verify-code`,
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
        throw new Error(errorData.message || "Invalid OTP code");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "OTP Verified Successfully!");
      // ওটিপি সফল হলে নতুন পাসওয়ার্ড সেট করার পেজে নিয়ে যাবে
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  // ইনপুট হ্যান্ডলার (Auto-forward লজিক)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.currentTarget.value;
    if (isNaN(Number(value))) return; // শুধু নাম্বার এলাউড

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // শুধু শেষ ক্যারেক্টারটি নিবে
    setOtp(newOtp);

    // টাইপ করার পর পরের ইনপুটে অটো ফোকাস হবে
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // ব্যাকস্পেস সাপোর্ট (আগের বক্সে ফিরে যাওয়ার জন্য)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // এক ক্লিকে পুরো ওটিপি পেস্ট সাপোর্ট
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const pastedOtp = pastedData.split("");
      setOtp(pastedOtp);
      inputRefs.current[5].focus();
    }
  };

  // সাবমিট হ্যান্ডলার
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length < 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    verifyOtpMutation.mutate({
      email: email,
      otp: otpCode,
    });
  };

  return (
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
        Enter OTP
      </h1>

      <p className="text-base text-[#787878] font-normal mb-8 text-center leading-[170%]">
        An OTP has been sent to your email address <br /> please verify it below
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        {/* OTP 6-Digit Fields */}
        <div className="flex justify-between gap-2.5 w-full mb-5" onPaste={handlePaste}>
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              ref={(el) => {
                if (el) inputRefs.current[index] = el;
              }}
              value={data}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-14 bg-[#EAEAEA]/60 border border-transparent rounded-[8px] text-center text-xl font-bold text-slate-800 focus:outline-none focus:bg-[#EAEAEA]/80 focus:border-slate-200 transition-all duration-200"
              required
            />
          ))}
        </div>

        {/* Resend Link directly under OTP inputs */}
        <div className="flex items-center justify-center mb-6 select-none">
          <p className="text-[13px] font-medium text-slate-700">
            Didn&apos;t Receive OTP?{" "}
            <Link
              href="/forgot-password"
              className="text-[#C84B31] hover:text-[#b03f27] hover:underline font-semibold ml-0.5 transition-colors"
            >
              Resend OTP
            </Link>
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={verifyOtpMutation.isPending}
          className="w-full bg-[#004EAF] text-white font-semibold text-[15px] py-[14px] px-4 rounded-xl shadow-[0px_6px_16px_rgba(0,78,175,0.25)] hover:bg-[#004195] hover:shadow-[0px_8px_20px_rgba(0,78,175,0.35)] active:scale-[0.99] transition-all duration-200 cursor-pointer text-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {verifyOtpMutation.isPending ? "Verifying..." : "Verify"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-[13px] text-slate-500 mt-10 text-center tracking-normal">
        Back to{" "}
        <Link
          href="/signin"
          className="text-[#004EAF] font-bold hover:underline ml-1 transition-colors"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function OtpVerifyPage() {
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
        {/* Next.js-এ useSearchParams ব্যবহারের জন্য Suspense র‍্যাপার দেওয়া হয়েছে */}
        <Suspense fallback={<div className="text-slate-500 text-sm">Loading...</div>}>
          <OtpForm />
        </Suspense>
      </div>
    </div>
  );
}