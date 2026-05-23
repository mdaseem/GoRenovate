export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - public folder
     * - the auth pages themselves
     */
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)",
  ],
}