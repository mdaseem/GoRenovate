"use client";
import React from "react";
import ProductListPage from "../ProductListPage/ProductListPage";
import Loader from "../Loader/Loader";
import { useSession } from "next-auth/react";
import LoginContainer from "../LoginContainer/LoginContainer";

type propType = {
  products: void | Response;
};

function Dashboard(props: propType) {
  const { data: session, status } = useSession();

  if (status === "loading" && !session) {
    return <Loader />;
  }

  if (!session?.loading && !session?.backendToken && !props.products) {
    if (status === "unauthenticated") {
      return <LoginContainer />;
    } else {
      return <LoginContainer />;
    }
  }

  return <ProductListPage products={props.products} />;
}

export default Dashboard;
