"use client";
import React from "react";
// import ProductListPage from "../ProductListPage/ProductListPage";
import Loader from "../Loader/Loader";
import { useSession } from "next-auth/react";
import RenderFromOverlay from "../../Atoms/RenderFromOverlay/RenderFromOverlay";
import { useStopScrollOnOverlay } from "../../CustomHooks/useStopScrollOnOverlay";
import LoginContainer from "../LoginContainer/LoginContainer";
import HomePage from "../HomePage/HomePage";

type propType = {
  products: void | Response;
};

function Dashboard(props: propType) {
  const { data: session, status } = useSession();

  useStopScrollOnOverlay();

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

  return (
    <>
      {/* <ProductListPage products={props.products} /> */}
      <HomePage />
      <RenderFromOverlay />
    </>
  );
}

export default Dashboard;
