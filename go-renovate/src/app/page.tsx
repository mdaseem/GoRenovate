"use client";
import { useRouter } from "next/navigation";
import Header from "./component/Atoms/Header/Header";
import { LoginContainer } from "./component/Molecules/LoginContainer/LoginContainer";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function Home() {
    const { data: session, status } = useSession();
    const navigate = useRouter();
    
    useEffect(() => {
      if (status === "authenticated") return navigate.push("/Home");
    }, [status]);

  const renderHeader = () => {
    return <Header />;
  };
  return (
    <div>
      {renderHeader()}
      <LoginContainer />
    </div>
  );
}
