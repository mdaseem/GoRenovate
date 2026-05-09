import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    /*
      GOOGLE LOGIN
    */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    /*
      EMAIL/PASSWORD LOGIN
    */
    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      /*
        Runs when:
        signIn("credentials")
      */
      async authorize(credentials) {
        try {
          // https://go-renovate-server.onrender.com/auth
          // http://localhost:3002/auth
          const res = await fetch(
            "https://go-renovate-server.onrender.com/auth",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                email: credentials?.email,
                password: credentials?.password,
              }),
            },
          );

          const data = await res.json();

          /*
            Expected backend response:

            {
              token: "...",
              user: {
                id,
                email,
                name
              }
            }
          */

          if (!res.ok || !data?.token) {
            return null;
          }

          /*
            Returned object becomes:
            user
            inside jwt callback
          */
          return {
            id: data?.user?.id,
            email: data?.user?.email,
            name: data?.user?.name,

            /*
              YOUR backend JWT
            */
            backendToken: data.token,
          };
        } catch (error) {
          console.error("Credentials login failed:", error);

          return null;
        }
      },
    }),
  ],

  callbacks: {
    /*
      JWT CALLBACK

      Used for:
      - storing backend JWT
      - persisting auth state
    */
    async jwt({ token, user, account, profile }) {
      /*
        ==========================================
        GOOGLE LOGIN
        ==========================================
      */

      /*
        Runs ONLY on initial Google login
      */
      if (account?.provider === "google" && profile?.email) {
        token.email = profile.email;

        /*
          Only fetch backend token
          ONCE during login
        */
        if (!token.backendToken) {
          try {
            // http://localhost:3002/auth
            // https://go-renovate-server.onrender.com/auth
            const backendRes = await fetch(
              "https://go-renovate-server.onrender.com/auth",
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                body: JSON.stringify({
                  userEmail: profile.email,

                  isGoogleLogin: true,

                  /*
                    Optional but recommended
                    for backend verification
                  */
                  googleIdToken: account.id_token,
                }),
              },
            );

            if (backendRes.ok) {
              const data = await backendRes.json();

              /*
                Persist backend JWT
              */
              token.backendToken = data.token;
            }
          } catch (err) {
            console.error("Google backend auth failed:", err);
          }
        }
      }

      /*
        ==========================================
        CREDENTIALS LOGIN
        ==========================================
      */

      /*
        Runs ONLY after credentials login
      */
      if (user?.backendToken) {
        token.backendToken = user.backendToken;

        token.email = user.email || undefined;
      }

      return token;
    },

    /*
      SESSION CALLBACK

      Converts:
      token -> session

      NO backend API calls here
    */
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
      }

      /*
        Expose backend JWT
        to frontend
      */
      session.backendToken = token.backendToken;

      /*
        Keep existing UI compatibility
      */
      session.loading = false;

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
