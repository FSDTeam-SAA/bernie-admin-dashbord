import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      phoneNumber?: string | null;
      role?: string;
      profileImage?: string | null;
      accessToken?: string | null;
      refreshToken?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    phoneNumber?: string | null;
    role?: string;
    profileImage?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
  }
}
