import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // When a user first signs in
    async jwt({ token, account, profile }) {
      // Store user info in the token (runs once on login)
      if (account && profile) {
        token.email = profile.email;
        token.backendToken = account.access_token;
      }
      return token;
    },

    // Whenever a session is checked or created
    async session({ session, token }) {
      if (token?.email && session.user) {
        session.user.email = token.email;
        session.loading = false;
      }

      // Optionally: automatically fetch a backend JWT and store it in the session
      // (you can also do this manually in another API route if you prefer)
      try {
        // https://go-renovate-server.onrender.com/auth
        // http://localhost:3002/auth
        session.loading = false; // start loading state
        const backendRes = await fetch(
          `https://go-renovate-server.onrender.com/auth`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: token.email,
              isGoogleLogin: true,
            }),
          },
        );

        if (backendRes.ok) {
          const { token: backendToken } = await backendRes.json();
          session.backendToken = backendToken; // attach backend JWT to session
          session.loading = false; // loading complete
        }
      } catch (err) {
        console.error("Failed to get backend token:", err);
        session.loading = false; // even on error, stop loading state
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
