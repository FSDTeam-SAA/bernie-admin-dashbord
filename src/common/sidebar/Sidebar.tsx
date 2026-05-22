"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  PackageOpen,
  TruckElectric,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard Overview", href: "/", icon: LayoutDashboard },
  {
    name: "User Management",
    href: "/user-management",
    icon: PackageOpen,
  },
  {
    name: "Journey Management",
    href: "/journey-management",
    icon: TruckElectric,
  },
  {
    name: "Catagory Management",
    href: "/category-management",
    icon: TruckElectric,
  },
  {
    name: "Token Management",
    href: "/token-management",
    icon: TruckElectric,
  },
  {
    name: "Set Prizes",
    href: "/set-prizes",
    icon: TruckElectric,
  },
  {
    name: "Transaction Management",
    href: "/transaction-management",
    icon: TruckElectric,
  },
  {
    name: "Subscription Management",
    href: "/subscription-management",
    icon: TruckElectric,
  },
  {
    name: "Membership Management",
    href: "/membership-management",
    icon: TruckElectric,
  },
  {
    name: "Insurance Listing",
    href: "/insurance-listing",
    icon: TruckElectric,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: TruckElectric,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/signin" });
  };

  return (
    <>
      <div className="flex h-screen sticky top-0 bottom-0 w-[380px] flex-col bg-white z-50 shadow-[4px_0px_40px_0px_rgba(0,0,0,0.04)]">
        {/* Logo Section - Perfectly Centered without borders */}
        <div className="h-[120px] flex items-center justify-center px-6">
          <div className="relative h-[60px] w-[190px] flex items-center justify-center">
            <Image
              src="/images/d-logo.png"
              alt="BubbleDrive Logo"
              height={200}
              width={200}
              className="object-contain max-h-full max-w-full"
              priority
            />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2 flex flex-col items-stretch px-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-[12px] px-5 py-4 transition-all duration-200 group text-[16px]",
                  isActive
                    ? "bg-[#0052cc] text-white font-medium shadow-[0px_8px_30px_0px_#00000029]"
                    : "text-[#555555] hover:bg-slate-50 hover:text-black font-normal",
                )}
              >
                <item.icon
                  className={cn(
                    "h-[22px] w-[22px] shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-white"
                      : "text-[#555555] group-hover:text-black",
                  )}
                />
                <span className="leading-none">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Action at the bottom */}
        <div className="p-4 mb-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center gap-4 rounded-xl px-5 py-4 text-[16px] font-normal text-[#FF0000] transition-colors duration-200 hover:bg-red-50/50 cursor-pointer border-none bg-transparent"
          >
            <LogOut className="h-[22px] w-[22px] shrink-0 text-[#FF0000]" />
            <span className="leading-none">Log Out</span>
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(nextOpen) => !isLoggingOut && setOpen(nextOpen)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will be redirected to the
              sign in page.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoggingOut}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
