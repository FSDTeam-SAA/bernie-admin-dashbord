"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface UserAddress {
  country: string;
  cityState: string;
  roadArea: string;
  postalCode: string;
  taxId: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  dob: string | null;
  gender: string;
  role: string;
  stripeAccountId: string | null;
  bio: string;
  profileImage: string;
  multiProfileImage: string[];
  pdfFile: string;
  otp: string | null;
  otpExpires: string | null;
  otpVerified: boolean;
  resetExpires: string | null;
  isVerified: boolean;
  refreshToken: string;
  hasActiveSubscription: boolean;
  subscriptionExpireDate: string | null;
  blockedUsers: string[];
  language: string;
  address: UserAddress;
}

interface ProfileResponse {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: UserProfile;
}

interface ProfileFormState {
  name: string;
  email: string;
  gender: string;
}

interface PasswordFormState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const emptyProfileForm: ProfileFormState = {
  name: "",
  email: "",
  gender: "",
};

const emptyPasswordForm: PasswordFormState = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

export default function Settings(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] =
    useState<ProfileFormState>(emptyProfileForm);
  const [passwordData, setPasswordData] =
    useState<PasswordFormState>(emptyPasswordForm);

  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
    [accessToken],
  );

  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ["user-profile"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/user/me`, {
        headers: authHeaders,
      });
      const response = await readJsonResponse<ProfileResponse>(res);

      if (!res.ok || response.status === false || response.success === false) {
        throw new Error(response.message || "Failed to fetch user profile");
      }

      return response;
    },
  });

  const userProfile = profileQuery.data?.data;

  useEffect(() => {
    if (!userProfile) return;

    setProfileData({
      name: userProfile.name || "",
      email: userProfile.email || "",
      gender: userProfile.gender || "",
    });
  }, [userProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (body: { name: string; gender?: string }) => {
      const res = await fetch(`${apiBaseUrl}/user/me`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const response = await readJsonResponse<ProfileResponse>(res);

      if (!res.ok || response.status === false || response.success === false) {
        throw new Error(response.message || "Failed to update profile");
      }

      return response;
    },
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (body: { oldPassword: string; newPassword: string }) => {
      const res = await fetch(`${apiBaseUrl}/auth/change-password`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const response = await readJsonResponse<{
        message?: string;
        status?: boolean;
        success?: boolean;
      }>(res);

      if (!res.ok || response.status === false || response.success === false) {
        throw new Error(response.message || "Failed to change password");
      }

      return response;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPasswordData(emptyPasswordForm);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleProfileSubmit = () => {
    const name = profileData.name.trim();
    const gender = profileData.gender.trim();

    if (!name) {
      toast.error("Name is required");
      return;
    }

    updateProfileMutation.mutate({
      name,
      ...(gender ? { gender } : {}),
    });
  };

  const handlePasswordSubmit = () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      toast.error("Old password and new password are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    changePasswordMutation.mutate({
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleSave = () => {
    if (activeTab === "profile") {
      handleProfileSubmit();
      return;
    }

    handlePasswordSubmit();
  };

  const handleDiscard = () => {
    if (activeTab === "profile") {
      setProfileData({
        name: userProfile?.name || "",
        email: userProfile?.email || "",
        gender: userProfile?.gender || "",
      });
      return;
    }

    setPasswordData(emptyPasswordForm);
  };

  const isSaving =
    updateProfileMutation.isPending || changePasswordMutation.isPending;
  const displayName = profileData.name || userProfile?.name || "User";
  const displayEmail = profileData.email || userProfile?.email || "";
  const profileImage = userProfile?.profileImage || "";

  return (
    <div className="w-full min-h-screen font-sans antialiased text-[#1e293b]">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="w-full bg-white border border-slate-200 rounded-xl p-1.5 flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex-1 cursor-pointer text-center py-2.5 text-sm font-semibold rounded-[12px] transition-all ${
              activeTab === "profile"
                ? "bg-[#0052cc] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex-1 cursor-pointer text-center py-2.5 text-sm font-semibold rounded-[12px] transition-all ${
              activeTab === "security"
                ? "bg-[#0052cc] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Security
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-6 pb-8 flex flex-col items-center relative">
          <div className="w-full h-44 bg-[#5c9ce6] rounded-xl mb-16 relative" />

          <div
            className="absolute top-32 w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200 bg-cover bg-center"
            style={
              profileImage ? { backgroundImage: `url(${profileImage})` } : {}
            }
          >
            {profileQuery.isLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : !profileImage ? (
              <div className="flex h-full w-full items-center justify-center bg-[#e6f0fa] text-3xl font-bold text-[#0052cc]">
                {getInitials(displayName)}
              </div>
            ) : null}
          </div>

          <div className="text-center space-y-3 mt-2">
            <h1 className="text-3xl font-serif font-bold text-[#1a253c] tracking-wide flex items-center justify-center gap-1.5">
              {profileQuery.isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                displayName
              )}
              {userProfile?.isVerified ? (
                <CheckCircle2 className="w-5 h-5 text-[#0052cc] fill-[#0052cc] stroke-white stroke-[2.5]" />
              ) : null}
            </h1>

            {profileQuery.isLoading ? (
              <Skeleton className="mx-auto h-4 w-56" />
            ) : displayEmail ? (
              <p className="text-sm font-medium text-slate-400">
                {displayEmail}
              </p>
            ) : null}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
          {profileQuery.isLoading ? (
            <SettingsFormSkeleton />
          ) : profileQuery.isError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 py-10 text-center text-sm font-medium text-red-500">
              {profileQuery.error instanceof Error
                ? profileQuery.error.message
                : "Failed to fetch user profile"}
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#1a253c] tracking-tight">
                Personal Information
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500">
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(event) =>
                      setProfileData({
                        ...profileData,
                        name: event.target.value,
                      })
                    }
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500">
                      Gender
                    </label>
                    <Select
                      value={profileData.gender}
                      onValueChange={(value) =>
                        setProfileData({
                          ...profileData,
                          gender: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full cursor-pointer px-4 py-3.5 bg-white border border-slate-200 rounded-[12px] text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all !h-12">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male" className="cursor-pointer">
                          Male
                        </SelectItem>
                        <SelectItem value="female" className="cursor-pointer">
                          Female
                        </SelectItem>
                        <SelectItem value="other" className="cursor-pointer">
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#1a253c] tracking-tight">
                Password Settings
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500">
                    Old Password
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="********"
                      value={passwordData.oldPassword}
                      onChange={(event) =>
                        setPasswordData({
                          ...passwordData,
                          oldPassword: event.target.value,
                        })
                      }
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-[12px] text-slate-400 transition-colors hover:text-slate-600"
                    >
                      {showOldPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs font-bold text-slate-500">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="********"
                        value={passwordData.newPassword}
                        onChange={(event) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: event.target.value,
                          })
                        }
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-[12px] text-slate-400 transition-colors hover:text-slate-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs font-bold text-slate-500">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        value={passwordData.confirmPassword}
                        onChange={(event) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: event.target.value,
                          })
                        }
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-[12px] text-slate-400 transition-colors hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-8 mt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              className="cursor-pointer px-6 py-3 bg-white border border-red-200 hover:bg-red-50 text-red-500 font-medium text-xs rounded-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                isSaving || profileQuery.isLoading || profileQuery.isError
              }
              className="inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3 bg-[#0052cc] hover:bg-blue-700 text-white font-semibold text-xs rounded-[12px] shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-full rounded-[12px]" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full rounded-[12px]" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-4 border-t border-slate-50 pt-8">
        <Skeleton className="h-10 w-32 rounded-[12px]" />
        <Skeleton className="h-10 w-32 rounded-[12px]" />
      </div>
    </div>
  );
}
