"use client";
import ProductListPage from "@/app/component/Molecules/ProductListPage/ProductListPage";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, } = useSession();

  return (
    <div className="login-page">
      {!session && <div className="loader1" />}
      <ProductListPage />
    </div>
  );
}
