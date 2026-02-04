/**
 * Configuration Better Auth - LE SAGE DEV
 * Authentification : Email/Password + OAuth (Google) + 2FA
 * Adapter : Prisma (supporte better_auth_* dans schema.prisma)
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "./prisma";

// Production : BETTER_AUTH_URL obligatoire (ex: https://lesagedev.com). Sinon VERCEL_URL en secours.
const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "http://localhost:3000";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: { modelName: "betterAuthUser" },
  account: {
    modelName: "betterAuthAccount",
    fields: {
      accessTokenExpiresAt: "expiresAt",
    },
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "email-password"],
      allowDifferentEmails: false,
    },
  },
  verification: { modelName: "betterAuthVerification" },

  basePath: "/api/auth",
  baseURL,

  appName: "LE SAGE DEV",

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      console.log("Reset password pour:", user.email, "→", url);
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },

  session: {
    modelName: "betterAuthSession",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  trustedOrigins: [
    baseURL,
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL,
    "https://lesagedev.com",
    "https://www.lesagedev.com",
    "https://hotel-demo-murex.vercel.app",
    "http://localhost:3000",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`, `https://www.${process.env.VERCEL_URL}`] : []),
  ].filter(Boolean),

  plugins: [
    twoFactor({
      issuer: "LE SAGE DEV",
      twoFactorTable: "better_auth_two_factor",
    }),
  ],
});
