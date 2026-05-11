import React from "react";
import Dashboard from "./component/Molecules/Dashboard/Dashboard";
import axios, { AxiosResponse } from "axios";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

async function getProducts() {
  const session = await getServerSession(authOptions);
  const token = session?.backendToken;
  if (!token) {
    return;
  }

  return axios
    .get<Response>("https://go-renovate-server.onrender.com/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(
      (
        response: AxiosResponse<
          Response,
          {
            data: {
              _id: number;
              description: string;
              actualPrice: number;
              discountPrice: number;
              rating: number;
              imageUrl: string | StaticImport;
            } | null;
          }
        >,
      ) => response.data,
    )
    .catch((error) => {
      console.log("Error fetching products:", error);
    });
}

export default async function Home() {
  const res: void | Response = await getProducts();

  return (
    <div>
      <Dashboard products={res} />
    </div>
  );
}
