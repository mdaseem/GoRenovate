import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  // Render protected content
  return (
    <>
      {children}
      {!session && <div className="loader1" />}
    </>
  );
}
