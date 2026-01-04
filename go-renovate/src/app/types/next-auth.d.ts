import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    backendToken?: string; // <-- your custom field
    user?: DefaultSession["user"] & {
      email?: string;
    };
  }

  interface JWT {
    email?: string;
  }
}
