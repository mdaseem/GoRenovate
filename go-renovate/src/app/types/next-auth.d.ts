import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /*
      Your backend JWT
    */
    backendToken?: string;

    /*
      Keep existing UI compatibility
    */
    loading?: boolean;

    user?: DefaultSession["user"] & {
      email?: string;
    };
  }

  /*
    IMPORTANT:
    Extend User type so:
    user.backendToken
    works inside jwt callback
  */
  interface User extends DefaultUser {
    backendToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    email?: string;

    /*
      Stored inside Auth.js JWT cookie
    */
    backendToken?: string;
  }
}
