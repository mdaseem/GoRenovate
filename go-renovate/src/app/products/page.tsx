import React from "react";
import axios, { AxiosResponse } from "axios";
import { getServerSession } from "next-auth";
import Dashboard from "../component/Molecules/Dashboard/Dashboard";
import { authOptions } from "../authOptions";

async function getProducts() {
  const session = await getServerSession(authOptions);
  const token = session?.backendToken;
  if (!token) {
    return;
  }

  return axios
    .get<Response>(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors`, {
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
              imageUrl: string[];
            } | null;
          }
        >,
      ) => response.data,
    )
    .catch((error) => {
      console.error("Error fetching products:", error);
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
