"use client";

import React, { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SigninPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Proper Submit Handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      // Error Handling
      if (!res || res.error || !res.ok || res.status >= 400) {
        throw new Error(
          res?.error && res.error !== "CredentialsSignin"
            ? res.error
            : "Invalid email or password"
        );
      }

      // Success
      toast.success("Login Successfully!");

      // Redirect
      router.push("/");
    } catch (err: unknown) {
      console.error(err);

      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
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
            Welcome Back!
          </h1>

          <p className="text-base text-[#787878] font-normal mb-8 text-center leading-[170%]">
            Access to manage your account
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

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[14px] font-medium text-slate-700 block tracking-wide">
                Password <span className="text-[#CC3333] ml-0.5">*</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#EAEAEA]/60 border border-transparent rounded-[8px] px-4 py-[14px] pr-12 text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-[#EAEAEA]/80 focus:border-slate-200 transition-all duration-200"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer p-1 rounded-md"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1 select-none">
              <label className="flex items-center gap-2 text-[13px] text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#004EAF] focus:ring-offset-0 focus:ring-0 accent-[#004EAF] cursor-pointer"
                />
                Remember Me
              </label>

              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-[#C84B31] hover:text-[#b03f27] hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !rememberMe}
              className="w-full bg-[#004EAF] text-white font-semibold text-[15px] py-[14px] px-4 rounded-xl shadow-[0px_6px_16px_rgba(0,78,175,0.25)] hover:bg-[#004195] hover:shadow-[0px_8px_20px_rgba(0,78,175,0.35)] active:scale-[0.99] transition-all duration-200 cursor-pointer text-center mt-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          {/* <p className="text-[13px] text-slate-500 mt-10 text-center tracking-normal">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#004EAF] font-bold hover:underline ml-1 transition-colors"
            >
              Register Here
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
}
