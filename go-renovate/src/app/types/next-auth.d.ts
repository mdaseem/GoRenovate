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
      id?: number;
      connections:
        | [{ userId?: number | string; Name: string; status: string }]
        | [];
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
    id?: number;
    connections?:
      | [{ userId?: number | string; Name: string; status: string }]
      | [];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    email?: string | null | undefined;
    name?: string | null | undefined;
    id?: number;
    connections?: [];

    /*
      Stored inside Auth.js JWT cookie
    */
    backendToken?: string;
  }
}
