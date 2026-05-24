/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { ALL_ACCESS_PERMISSION } from "./team-permissions";

type TeamAdmin = {
  _id: string;
  email: string;
  permissions?: string[];
};

const readJsonResponse = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
};

async function getTeamAdminForUser(email: string, accessToken: string) {
  const url = new URL(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/team`);
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "20");
  url.searchParams.set("search", email);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  const response = await readJsonResponse<{
    data?: { admins?: TeamAdmin[] };
  }>(res);

  if (!res.ok) return null;

  return (
    response.data?.admins?.find(
      (admin) => admin.email?.toLowerCase() === email.toLowerCase(),
    ) || null
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "email",
        },

        password: {
          label: "Password",
          type: "password",
          placeholder: "password",
        },
      },

      async authorize(credentials) {
        // Validate credentials
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        try {
          // API Request
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          // Parse response
          const response = await res.json();

          console.log("Backend login response:", response);

          // Check API success
          if (
            !res.ok ||
            response?.success === false ||
            response?.status === false
          ) {
            throw new Error(response?.message || "Login failed");
          }

          // Get user
          const user = response?.data?.user;

          if (!user) {
            throw new Error("User data not found");
          }

          // Role check
          if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
            throw new Error("Only admins can access this page");
          }

          // Tokens
          const accessToken =
            response?.data?.accessToken || null;

          const refreshToken =
            user?.refreshToken || null;

          const teamAdmin =
            user.role === "ADMIN" && accessToken
              ? await getTeamAdminForUser(user.email, accessToken)
              : null;

          const permissions =
            user.role === "SUPER_ADMIN"
              ? [ALL_ACCESS_PERMISSION]
              : teamAdmin?.permissions || [];

          // Return user data
          return {
            id: user?._id,
            name: user?.name || "",
            email: user?.email,
            phoneNumber: user?.phoneNumber || null,
            role: user?.role,
            permissions,
            teamAdminId: teamAdmin?._id || null,
            profileImage: user?.profileImage || null,
            accessToken,
            refreshToken,
          };
        } catch (error) {
          console.error("Authentication error:", error);

          const message =
            error instanceof Error
              ? error.message
              : "Authentication failed";

          throw new Error(message);
        }
      },
    }),
  ],

  callbacks: {
    // JWT Callback
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: any;
    }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phoneNumber = user.phoneNumber;
        token.role = user.role;
        token.permissions = user.permissions;
        token.teamAdminId = user.teamAdminId;
        token.profileImage = user.profileImage;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }

      return token;
    },

    // Session Callback
    async session({
      session,
      token,
    }: {
      session: any;
      token: JWT;
    }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        phoneNumber: token.phoneNumber,
        role: token.role,
        permissions: token.permissions,
        teamAdminId: token.teamAdminId,
        profileImage: token.profileImage,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };

      return session;
    },
  },
};
