import React from "react";
import Dashboard from "./component/Molecules/Dashboard/Dashboard";
import axios, { AxiosResponse } from "axios";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { cookies } from "next/headers";

async function getProducts() {
  const cookieStore = await cookies();
  const token = cookieStore.get("backendToken")?.value;
  console.log("Error fetching products:", token);
  if (!token) {
    return;
  }

  return axios
    .get<Response>("https://go-renovate-server.onrender.com/products", {
      headers: {
        Authorization: `Bearer ${token}`,
        credentials: "include",
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
  // const navigate = useRouter();
  // const dispatch = useAppDispatch();
  // const store = useAppSelector((state: RootState) => state);
  // const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <Dashboard products={res} />
    </div>
  );
}
