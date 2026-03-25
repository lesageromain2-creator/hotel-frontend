/**
 * Configuration Better Auth - Hôtel
 * Authentification : Email/Password + OAuth (Google) + 2FA
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "./prisma";
import { sendResetPasswordEmail, sendVerificationEmail } from "./sendAuthEmail";

// En production Vercel : BETTER_AUTH_URL doit être l'URL exacte du site (ex: https://hotel-demo-murex.vercel.app)
const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Hôtel La Grande Croix";

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

  appName,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      void sendResetPasswordEmail(user.email, url);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendVerificationEmail(user.email, url);
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
    "https://hotel-demo-murex.vercel.app",
    "https://accounts.google.com", // OAuth callback
    "https://www.googleapis.com",
    "http://localhost:3000",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`, `https://www.${process.env.VERCEL_URL}`] : []),
  ].filter((x): x is string => typeof x === "string"),

  plugins: [
    twoFactor({
      issuer: appName,
      twoFactorTable: "better_auth_two_factor",
    }),
  ],
});
